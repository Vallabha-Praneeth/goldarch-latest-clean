/**
 * Framework B API - Send Chat Message
 * POST /api/framework-b/chat/send
 *
 * SECURED: Requires authentication
 * Rate limited: 60 requests per minute per user
 * MONITORED: Logs, analytics, performance tracking, cost tracking
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, checkRateLimit, handleCORSOptions, getCORSHeaders } from '@/lib/auth-helpers';
import { getChatService } from '@/Framework_B_Implementation/lib/services';
import type { SendMessageRequest } from '@/Framework_B_Implementation/services/ai-chat/ChatService';
import {
  PerformanceTimer,
  MetricType,
  errorTracker,
  ValidationError,
  ExternalAPIError,
  trackChatMessage,
} from '@/lib/logging';

export async function POST(request: NextRequest) {
  // Start performance monitoring for entire request
  const requestTimer = new PerformanceTimer(MetricType.API_RESPONSE_TIME, {
    endpoint: '/api/framework-b/chat/send',
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

    // 2. Rate limiting check (60 requests per minute for chat)
    const rateLimit = await checkRateLimit(user.id, 60, 60000);
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
    const body: SendMessageRequest = await request.json();

    if (!body.message || body.message.trim().length === 0) {
      const error = new ValidationError('Message is required', 'message', body.message);
      errorTracker.track(error, { userId: user.id, endpoint: '/api/framework-b/chat/send' });
      requestTimer.stop();
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode, headers: getCORSHeaders() }
      );
    }

    // 4. Add user ID to request for isolation
    const requestWithUser = {
      ...body,
      userId: user.id, // Ensure user can only access their own conversations
    };

    // 5. Get chat service
    const chatService = getChatService();

    // 6. Send message and get response
    const response = await chatService.sendMessage(requestWithUser);

    // 7. Track analytics (extract token counts from metadata if available)
    const duration = requestTimer.stop();
    const inputTokens = response.metadata?.tokensUsed?.input || 0;
    const outputTokens = response.metadata?.tokensUsed?.output || 0;

    await trackChatMessage(
      user.id,
      inputTokens,
      outputTokens,
      duration,
      true
    );

    // 8. Format response
    return NextResponse.json(
      {
        success: true,
        message: {
          role: response.message.role,
          content: response.message.content,
          timestamp: response.message.timestamp,
          citations: response.message.citations?.map(citation => ({
            source: citation.source,
            excerpt: citation.excerpt,
            score: citation.score,
            metadata: citation.metadata,
          })),
        },
        conversationId: response.conversationId,
        userId: user.id,
        conversation: {
          id: response.conversation.id,
          messageCount: response.conversation.messages.length,
          createdAt: response.conversation.createdAt,
          updatedAt: response.conversation.updatedAt,
        },
        metadata: response.metadata,
      },
      { headers: getCORSHeaders() }
    );
  } catch (error) {
    // Track error
    requestTimer.stop();
    const appError = error instanceof Error
      ? new ExternalAPIError('ChatSend', error.message, error)
      : new ExternalAPIError('ChatSend', 'Unknown error');

    errorTracker.track(appError, {
      userId: requestTimer['context'].userId,
      endpoint: '/api/framework-b/chat/send',
    });

    // Track failed analytics
    if (requestTimer['context'].userId) {
      await trackChatMessage(
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
 * GET endpoint to check chat service status
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

    const chatService = getChatService();
    const stats = chatService.getServiceStats();

    return NextResponse.json(
      {
        status: 'ready',
        userId: user.id,
        stats,
        endpoints: {
          send: '/api/framework-b/chat/send',
          conversations: '/api/framework-b/chat/conversations',
        },
      },
      { headers: getCORSHeaders() }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Chat service unavailable' },
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
