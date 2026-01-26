/**
 * Framework B API - Document Upload
 * POST /api/framework-b/documents/upload
 *
 * SECURED: Requires authentication
 * Rate limited: 50 requests per minute per user
 * MONITORED: Logs, analytics, performance tracking
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, checkRateLimit, handleCORSOptions, getCORSHeaders } from '@/lib/auth-helpers';
import {
  getDocumentProcessor,
  getEmbeddingsService,
  getVectorStore,
} from '@/Framework_B_Implementation/lib/services';
import {
  PerformanceTimer,
  MetricType,
  errorTracker,
  ValidationError,
  ExternalAPIError,
  trackDocumentUpload,
  logError,
} from '@/lib/logging';

export async function POST(request: NextRequest) {
  // Start performance monitoring for entire request
  const requestTimer = new PerformanceTimer(MetricType.API_RESPONSE_TIME, {
    endpoint: '/api/framework-b/documents/upload',
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

    // 2. Rate limiting check (50 requests per minute)
    const rateLimit = await checkRateLimit(user.id, 50, 60000);
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

    // 3. Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const projectId = formData.get('projectId') as string | null;
    const supplierId = formData.get('supplierId') as string | null;
    const namespace = formData.get('namespace') as string | null;

    if (!file) {
      const error = new ValidationError('File is required', 'file', null);
      errorTracker.track(error, { userId: user.id, endpoint: '/api/framework-b/documents/upload' });
      requestTimer.stop();
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode, headers: getCORSHeaders() }
      );
    }

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'text/markdown',
    ];

    if (!allowedTypes.includes(file.type)) {
      const error = new ValidationError(`Unsupported file type: ${file.type}`, 'file.type', file.type);
      errorTracker.track(error, { userId: user.id, endpoint: '/api/framework-b/documents/upload' });
      requestTimer.stop();
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode, headers: getCORSHeaders() }
      );
    }

    // 4. Get services
    const processor = getDocumentProcessor();
    const embeddingsService = getEmbeddingsService();
    const vectorStore = getVectorStore();

    // 5. Extract text and create chunks (with user context)
    const { document, chunks } = await processor.extractAndChunk(file, {
      filename: file.name,
      format: getFormatFromMimeType(file.type),
      source: 'upload',
      size: file.size,
      projectId: projectId || undefined,
      supplierId: supplierId || undefined,
      userId: user.id, // Add user ID for isolation
    });

    // Step 2: Generate embeddings for all chunks
    const embeddingsResponse = await embeddingsService.generateBatchEmbeddings({
      texts: chunks.map(chunk => chunk.content),
      batchSize: 100,
      parallel: true,
    });

    if (embeddingsResponse.failures > 0) {
      console.warn(`Failed to generate ${embeddingsResponse.failures} embeddings`);
    }

    // Step 3: Store vectors in Pinecone
    const targetNamespace = namespace || vectorStore.getNamespace({
      projectId: projectId || undefined,
      supplierId: supplierId || undefined,
    });

    await vectorStore.upsertChunks({
      chunks,
      embeddings: embeddingsResponse.embeddings.map(ev => ev.vector),
      namespace: targetNamespace,
    });

    // 6. Track analytics
    const duration = requestTimer.stop();
    await trackDocumentUpload(
      user.id,
      chunks.length,
      embeddingsResponse.totalTokens,
      duration,
      true
    );

    // 7. Return success response
    return NextResponse.json(
      {
        success: true,
        documentId: document.metadata.id,
        filename: document.metadata.filename,
        chunksCreated: chunks.length,
        vectorsIndexed: embeddingsResponse.embeddings.length,
        namespace: targetNamespace,
        userId: user.id, // Include for verification
        metadata: {
          format: document.metadata.format,
          size: document.metadata.size,
          wordCount: document.metadata.custom?.wordCount,
          pageCount: document.metadata.custom?.pageCount,
          tokensUsed: embeddingsResponse.totalTokens,
          processingTime: embeddingsResponse.totalTime,
        },
      },
      { headers: getCORSHeaders() }
    );
  } catch (error) {
    // Track error
    requestTimer.stop();
    const appError = error instanceof Error
      ? new ExternalAPIError(
          'DocumentUpload',
          error.message,
          error
        )
      : new ExternalAPIError('DocumentUpload', 'Unknown error');

    errorTracker.track(appError, {
      userId: requestTimer['context'].userId,
      endpoint: '/api/framework-b/documents/upload',
    });

    // Track failed analytics
    if (requestTimer['context'].userId) {
      await trackDocumentUpload(
        requestTimer['context'].userId,
        0,
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
 * Get document format from MIME type
 */
function getFormatFromMimeType(mimeType: string): 'pdf' | 'docx' | 'txt' | 'md' {
  switch (mimeType) {
    case 'application/pdf':
      return 'pdf';
    case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
    case 'application/msword':
      return 'docx';
    case 'text/markdown':
      return 'md';
    default:
      return 'txt';
  }
}

/**
 * GET endpoint to check supported file types
 * SECURED: Requires authentication
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (auth.response) return auth.response;
    const { user } = auth;

    const processor = getDocumentProcessor();
    const supportedFormats = processor.getSupportedFormats();

    return NextResponse.json(
      {
        supportedFormats,
        maxFileSize: '50MB',
        mimeTypes: [
          { format: 'pdf', mimeType: 'application/pdf' },
          { format: 'docx', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' },
          { format: 'txt', mimeType: 'text/plain' },
          { format: 'md', mimeType: 'text/markdown' },
        ],
      },
      { headers: getCORSHeaders() }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to get supported formats' },
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
