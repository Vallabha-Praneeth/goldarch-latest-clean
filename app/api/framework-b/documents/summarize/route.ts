/**
 * Framework B API - Document Summarization
 * POST /api/framework-b/documents/summarize
 *
 * SECURED: Requires authentication
 * Rate limited: 20 requests per minute per user
 * MONITORED: Logs, analytics, performance tracking, cost tracking
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, checkRateLimit, handleCORSOptions, getCORSHeaders } from '@/lib/auth-helpers';
import { getDocumentSummarizer } from '@/Framework_B_Implementation/lib/services';
import type { SummarizeDocumentRequest } from '@/Framework_B_Implementation/services/document-summarizer/DocumentSummarizer';
import {
  PerformanceTimer,
  MetricType,
  errorTracker,
  ValidationError,
  ExternalAPIError,
  trackSummarization,
} from '@/lib/logging';

export interface SummarizeRequestBody {
  documentId: string;
  namespace?: string;
  projectId?: string;
  supplierId?: string;
  summaryType?: 'brief' | 'detailed' | 'bullet-points';
  maxLength?: number;
}

export async function POST(request: NextRequest) {
  // Start performance monitoring for entire request
  const requestTimer = new PerformanceTimer(MetricType.API_RESPONSE_TIME, {
    endpoint: '/api/framework-b/documents/summarize',
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

    // 2. Rate limiting check (20 requests per minute - summarization is expensive)
    const rateLimit = await checkRateLimit(user.id, 20, 60000);
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
    const body: SummarizeRequestBody = await request.json();

    if (!body.documentId || body.documentId.trim().length === 0) {
      const error = new ValidationError('Document ID is required', 'documentId', body.documentId);
      errorTracker.track(error, { userId: user.id, endpoint: '/api/framework-b/documents/summarize' });
      requestTimer.stop();
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode, headers: getCORSHeaders() }
      );
    }

    // 4. Get summarizer service
    const summarizer = getDocumentSummarizer();

    // 5. Build namespace from project/supplier if provided
    // Note: User isolation should be enforced at the vector store level
    let namespace = body.namespace;
    if (!namespace && body.projectId) {
      namespace = `project-${body.projectId}`;
    } else if (!namespace && body.supplierId) {
      namespace = `supplier-${body.supplierId}`;
    }

    // 6. Prepare summarization request
    const summarizeRequest: SummarizeDocumentRequest = {
      documentId: body.documentId,
      namespace,
      summaryType: body.summaryType || 'brief',
      maxLength: body.maxLength,
    };

    // 7. Generate summary
    const result = await summarizer.summarizeDocument(summarizeRequest);

    // 8. Track analytics (estimate token split: 70% input, 30% output for summaries)
    const inputTokens = Math.round(result.metadata.totalTokens * 0.7);
    const outputTokens = Math.round(result.metadata.totalTokens * 0.3);
    const duration = requestTimer.stop();

    await trackSummarization(
      user.id,
      inputTokens,
      outputTokens,
      duration,
      true
    );

    return NextResponse.json(
      {
        success: true,
        summary: result.summary,
        documentId: result.documentId,
        summaryType: result.summaryType,
        userId: user.id,
        metadata: {
          chunkCount: result.metadata.chunkCount,
          totalTokens: result.metadata.totalTokens,
          processingTime: result.metadata.processingTime,
          model: result.metadata.model,
        },
      },
      { headers: getCORSHeaders() }
    );
  } catch (error) {
    // Track error
    requestTimer.stop();
    const appError = error instanceof Error
      ? new ExternalAPIError('DocumentSummarize', error.message, error)
      : new ExternalAPIError('DocumentSummarize', 'Unknown error');

    errorTracker.track(appError, {
      userId: requestTimer['context'].userId,
      endpoint: '/api/framework-b/documents/summarize',
    });

    // Track failed analytics
    if (requestTimer['context'].userId) {
      await trackSummarization(
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
 * GET endpoint to check summarization service status
 * SECURED: Requires authentication
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (auth.response) return auth.response;
    const { user } = auth;

    return NextResponse.json(
      {
        status: 'ready',
        supportedTypes: ['brief', 'detailed', 'bullet-points'],
        endpoint: '/api/framework-b/documents/summarize',
        description: 'Generate AI-powered summaries of documents',
      },
      { headers: getCORSHeaders() }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Summarization service not available' },
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
