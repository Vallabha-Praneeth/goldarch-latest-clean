/**
 * Framework B API - Semantic Search
 * POST /api/framework-b/documents/search
 *
 * SECURED: Requires authentication
 * Rate limited: 100 requests per minute per user
 * MONITORED: Logs, analytics, performance tracking
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, checkRateLimit, handleCORSOptions, getCORSHeaders } from '@/lib/auth-helpers';
import {
  getEmbeddingsService,
  getVectorStore,
} from '@/Framework_B_Implementation/lib/services';
import {
  PerformanceTimer,
  MetricType,
  errorTracker,
  ValidationError,
  AuthorizationError,
  ExternalAPIError,
  trackDocumentSearch,
} from '@/lib/logging';

export interface SearchRequest {
  query: string;
  topK?: number;
  minScore?: number;
  projectId?: string;
  supplierId?: string;
  namespace?: string;
  filters?: Record<string, any>;
}

export async function POST(request: NextRequest) {
  // Start performance monitoring for entire request
  const requestTimer = new PerformanceTimer(MetricType.API_RESPONSE_TIME, {
    endpoint: '/api/framework-b/documents/search',
  });

  try {
    // 1. Authentication check
    const auth = await requireAuth(request);
    if (auth.response) {
      requestTimer.stop();
      return auth.response; // Return 401 if not authenticated
    }
    const { user } = auth;

    // Update timer context with user ID
    requestTimer['context'].userId = user.id;

    // 2. Rate limiting check (100 requests per minute for search)
    const rateLimit = await checkRateLimit(user.id, 100, 60000);
    if (!rateLimit.allowed) {
      requestTimer.stop();
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          message: `Too many requests. Please try again in ${rateLimit.retryAfter} seconds.`,
          retryAfter: rateLimit.retryAfter,
        },
        {
          status: 429,
          headers: {
            ...getCORSHeaders(),
            'Retry-After': String(rateLimit.retryAfter),
          },
        }
      );
    }

    // 3. Parse and validate request
    const body: SearchRequest = await request.json();

    if (!body.query || body.query.trim().length === 0) {
      const error = new ValidationError('Query is required', 'query', body.query);
      errorTracker.track(error, { userId: user.id, endpoint: '/api/framework-b/documents/search' });
      requestTimer.stop();
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode, headers: getCORSHeaders() }
      );
    }

    // 4. Get services
    const embeddingsService = getEmbeddingsService();
    const vectorStore = getVectorStore();

    // 5. Generate query embedding
    const embeddingResponse = await embeddingsService.generateEmbedding(body.query);

    // 6. Build search parameters with user isolation
    const namespace = body.namespace || vectorStore.getNamespace({
      projectId: body.projectId,
      supplierId: body.supplierId,
    });

    // Build metadata filters with user ID for isolation
    let filters = body.filters || {};

    // Add user filter to ensure users only search their own documents
    if (!filters.userId) {
      filters.userId = user.id;
    } else if (filters.userId !== user.id) {
      // Prevent users from searching other users' documents
      const error = new AuthorizationError(
        'Cannot search other users\' documents',
        user.id,
        `documents:userId:${filters.userId}`
      );
      errorTracker.track(error, { userId: user.id, endpoint: '/api/framework-b/documents/search' });
      requestTimer.stop();
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode, headers: getCORSHeaders() }
      );
    }

    // Add project/supplier filters if provided
    if (!body.filters && (body.projectId || body.supplierId)) {
      const queryBuilder = vectorStore.buildQuery();

      if (body.projectId) {
        queryBuilder.forProject(body.projectId);
      }

      if (body.supplierId) {
        queryBuilder.forSupplier(body.supplierId);
      }

      filters = { ...queryBuilder.build(), userId: user.id };
    }

    // 7. Search vector store
    const searchResponse = await vectorStore.search({
      queryEmbedding: embeddingResponse.vector,
      topK: body.topK || 5,
      namespace,
      filters,
      minScore: body.minScore || 0.7,
    });

    // 8. Format results
    const results = searchResponse.results.map(result => ({
      id: result.id,
      documentId: result.documentId,
      content: result.content,
      score: result.score,
      metadata: {
        filename: result.metadata.filename,
        format: result.metadata.format,
        source: result.metadata.source,
        projectId: result.metadata.projectId,
        supplierId: result.metadata.supplierId,
        uploadedAt: result.metadata.uploadedAt,
        chunkIndex: result.metadata.chunkIndex,
      },
    }));

    // 9. Track analytics
    const duration = requestTimer.stop();
    await trackDocumentSearch(
      user.id,
      results.length,
      duration,
      true
    );

    return NextResponse.json(
      {
        success: true,
        query: body.query,
        results,
        count: results.length,
        namespace,
        userId: user.id,
        metadata: {
          processingTime: searchResponse.processingTime,
          embeddingCached: embeddingResponse.cached,
          tokensUsed: embeddingResponse.tokensUsed,
        },
      },
      { headers: getCORSHeaders() }
    );
  } catch (error) {
    // Track error
    requestTimer.stop();
    const appError = error instanceof Error
      ? new ExternalAPIError('DocumentSearch', error.message, error)
      : new ExternalAPIError('DocumentSearch', 'Unknown error');

    errorTracker.track(appError, {
      userId: requestTimer['context'].userId,
      endpoint: '/api/framework-b/documents/search',
    });

    // Track failed analytics
    if (requestTimer['context'].userId) {
      await trackDocumentSearch(
        requestTimer['context'].userId,
        0,
        requestTimer.elapsed(),
        false
      );
    }

    return NextResponse.json(
      {
        error: appError.message,
        details: process.env.NODE_ENV === 'development' ? appError.stack : undefined,
      },
      { status: appError.statusCode, headers: getCORSHeaders() }
    );
  }
}

/**
 * GET endpoint to retrieve search statistics
 * SECURED: Requires authentication
 */
export async function GET(request: NextRequest) {
  try {
    // Authentication check
    const auth = await requireAuth(request);
    if (auth.response) {
      return auth.response;
    }
    const { user } = auth;

    const { searchParams } = new URL(request.url);
    const namespace = searchParams.get('namespace') || undefined;
    const projectId = searchParams.get('projectId') || undefined;
    const supplierId = searchParams.get('supplierId') || undefined;

    const vectorStore = getVectorStore();

    // Get namespace stats
    const targetNamespace = namespace || vectorStore.getNamespace({
      projectId,
      supplierId,
    });

    // Return basic stats
    return NextResponse.json(
      {
        namespace: targetNamespace,
        available: true,
        userId: user.id,
        message: 'Search endpoint is ready',
        supportedFilters: [
          'projectId',
          'supplierId',
          'format',
          'source',
          'filename',
          'userId',
        ],
      },
      { headers: getCORSHeaders() }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to get search stats' },
      { status: 500, headers: getCORSHeaders() }
    );
  }
}

/**
 * OPTIONS endpoint for CORS preflight
 */
export async function OPTIONS() {
  return handleCORSOptions();
}
