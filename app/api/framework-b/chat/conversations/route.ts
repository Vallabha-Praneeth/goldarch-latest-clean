/**
 * Framework B API - Conversation Management
 * GET/POST/DELETE /api/framework-b/chat/conversations
 *
 * SECURED: Requires authentication
 * Rate limited: 100 requests per minute per user
 * MONITORED: Basic logging and error tracking
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, checkRateLimit, handleCORSOptions, getCORSHeaders } from '@/lib/auth-helpers';
import { getChatService } from '@/Framework_B_Implementation/lib/services';
import {
  errorTracker,
  AuthorizationError,
  ValidationError,
  ExternalAPIError,
  logError,
} from '@/lib/logging';

/**
 * GET - Retrieve conversations
 * SECURED: Users can only access their own conversations
 * Query params:
 * - conversationId: Get specific conversation
 * - search: Search conversations by content
 * - limit: Limit number of results (default: 10)
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Authentication check
    const auth = await requireAuth(request);
    if (auth.response) {
      return auth.response;
    }
    const { user } = auth;

    // 2. Rate limiting
    const rateLimit = checkRateLimit(user.id, 100, 60000);
    if (!rateLimit.allowed) {
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

    // 3. Parse query params
    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversationId');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '10');

    const chatService = getChatService();

    // 4. Get specific conversation (with user validation)
    if (conversationId) {
      const conversation = chatService.getConversation(conversationId);

      if (!conversation) {
        return NextResponse.json(
          { error: 'Conversation not found' },
          { status: 404, headers: getCORSHeaders() }
        );
      }

      // Ensure user owns this conversation
      if (conversation.userId !== user.id) {
        const error = new AuthorizationError(
          'Cannot access other users\' conversations',
          user.id,
          `conversation:${conversationId}`
        );
        errorTracker.track(error, { userId: user.id, endpoint: '/api/framework-b/chat/conversations' });
        return NextResponse.json(
          { error: error.message },
          { status: error.statusCode, headers: getCORSHeaders() }
        );
      }

      return NextResponse.json(
        {
          success: true,
          conversation,
        },
        { headers: getCORSHeaders() }
      );
    }

    // 5. Search conversations (only user's own)
    if (search) {
      const results = chatService.searchConversations(search, user.id);
      const limited = results.slice(0, limit);

      return NextResponse.json(
        {
          success: true,
          conversations: limited,
          count: results.length,
          showing: limited.length,
          userId: user.id,
        },
        { headers: getCORSHeaders() }
      );
    }

    // 6. Get conversations for authenticated user only
    const conversations = chatService.getUserConversations(user.id);
    const limited = conversations.slice(0, limit);

    return NextResponse.json(
      {
        success: true,
        conversations: limited,
        count: conversations.length,
        showing: limited.length,
        userId: user.id,
      },
      { headers: getCORSHeaders() }
    );
  } catch (error) {
    const appError = error instanceof Error
      ? new ExternalAPIError('ConversationsGet', error.message, error)
      : new ExternalAPIError('ConversationsGet', 'Unknown error');

    errorTracker.track(appError, {
      endpoint: '/api/framework-b/chat/conversations',
    });

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
 * POST - Create new conversation or perform action
 * SECURED: Users can only manage their own conversations
 * Body:
 * - action: 'create' | 'regenerate' | 'clear' | 'export' | 'import' | 'stats'
 * - conversationId: Required for actions except 'create' and 'import'
 * - metadata: Optional for 'create'
 * - json: Required for 'import'
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Authentication check
    const auth = await requireAuth(request);
    if (auth.response) {
      return auth.response;
    }
    const { user } = auth;

    // 2. Rate limiting
    const rateLimit = checkRateLimit(user.id, 100, 60000);
    if (!rateLimit.allowed) {
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

    // 3. Parse request body
    const body = await request.json();
    const { action, conversationId, metadata, json } = body;

    const chatService = getChatService();

    // Helper: Validate conversation ownership
    const validateOwnership = (convId: string) => {
      const conv = chatService.getConversation(convId);
      if (!conv) {
        throw new Error('Conversation not found');
      }
      if (conv.userId !== user.id) {
        throw new Error('Unauthorized: Cannot access other users\' conversations');
      }
      return conv;
    };

    // 4. Execute action
    switch (action) {
      case 'create': {
        // Always use authenticated user's ID
        const conversation = chatService.createConversation(user.id, metadata);
        return NextResponse.json(
          {
            success: true,
            conversation,
          },
          { headers: getCORSHeaders() }
        );
      }

      case 'regenerate': {
        if (!conversationId) {
          return NextResponse.json(
            { error: 'conversationId is required for regenerate' },
            { status: 400, headers: getCORSHeaders() }
          );
        }

        // Validate ownership
        validateOwnership(conversationId);

        const response = await chatService.regenerateResponse(conversationId);
        return NextResponse.json(
          {
            success: true,
            message: response.message,
            conversationId: response.conversationId,
          },
          { headers: getCORSHeaders() }
        );
      }

      case 'clear': {
        if (!conversationId) {
          return NextResponse.json(
            { error: 'conversationId is required for clear' },
            { status: 400, headers: getCORSHeaders() }
          );
        }

        // Validate ownership
        validateOwnership(conversationId);

        chatService.clearConversation(conversationId);
        return NextResponse.json(
          {
            success: true,
            message: 'Conversation cleared',
          },
          { headers: getCORSHeaders() }
        );
      }

      case 'export': {
        if (!conversationId) {
          return NextResponse.json(
            { error: 'conversationId is required for export' },
            { status: 400, headers: getCORSHeaders() }
          );
        }

        // Validate ownership
        validateOwnership(conversationId);

        const exportedJson = chatService.exportConversation(conversationId);
        return NextResponse.json(
          {
            success: true,
            data: exportedJson,
          },
          { headers: getCORSHeaders() }
        );
      }

      case 'import': {
        if (!json) {
          return NextResponse.json(
            { error: 'json is required for import' },
            { status: 400, headers: getCORSHeaders() }
          );
        }

        // Ensure imported conversation belongs to current user
        const importedConv = chatService.importConversation(json);
        if (importedConv.userId !== user.id) {
          // Override userId to prevent importing other users' conversations
          importedConv.userId = user.id;
        }

        return NextResponse.json(
          {
            success: true,
            conversation: importedConv,
          },
          { headers: getCORSHeaders() }
        );
      }

      case 'stats': {
        if (!conversationId) {
          return NextResponse.json(
            { error: 'conversationId is required for stats' },
            { status: 400, headers: getCORSHeaders() }
          );
        }

        // Validate ownership
        validateOwnership(conversationId);

        const stats = chatService.getConversationStats(conversationId);
        return NextResponse.json(
          {
            success: true,
            stats,
          },
          { headers: getCORSHeaders() }
        );
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400, headers: getCORSHeaders() }
        );
    }
  } catch (error) {
    console.error('Conversation action error:', error);

    // Handle authorization errors
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json(
        { error: error.message },
        { status: 403, headers: getCORSHeaders() }
      );
    }

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to perform action',
      },
      { status: 500, headers: getCORSHeaders() }
    );
  }
}

/**
 * DELETE - Delete conversation(s)
 * SECURED: Users can only delete their own conversations
 * Query params:
 * - conversationId: Delete specific conversation
 * - olderThan: Delete conversations older than N milliseconds
 */
export async function DELETE(request: NextRequest) {
  try {
    // 1. Authentication check
    const auth = await requireAuth(request);
    if (auth.response) {
      return auth.response;
    }
    const { user } = auth;

    // 2. Rate limiting
    const rateLimit = checkRateLimit(user.id, 100, 60000);
    if (!rateLimit.allowed) {
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

    // 3. Parse query params
    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversationId');
    const olderThan = searchParams.get('olderThan');

    const chatService = getChatService();

    // 4. Delete specific conversation (with ownership validation)
    if (conversationId) {
      const conversation = chatService.getConversation(conversationId);

      if (!conversation) {
        return NextResponse.json(
          { error: 'Conversation not found' },
          { status: 404, headers: getCORSHeaders() }
        );
      }

      // Ensure user owns this conversation
      if (conversation.userId !== user.id) {
        return NextResponse.json(
          { error: 'Unauthorized: Cannot delete other users\' conversations' },
          { status: 403, headers: getCORSHeaders() }
        );
      }

      const deleted = chatService.deleteConversation(conversationId);

      return NextResponse.json(
        {
          success: true,
          message: 'Conversation deleted',
        },
        { headers: getCORSHeaders() }
      );
    }

    // 5. Delete old conversations (only user's own)
    if (olderThan) {
      const ms = parseInt(olderThan);
      if (isNaN(ms)) {
        return NextResponse.json(
          { error: 'olderThan must be a number in milliseconds' },
          { status: 400, headers: getCORSHeaders() }
        );
      }

      // Get user's conversations first
      const userConversations = chatService.getUserConversations(user.id);
      const cutoffTime = Date.now() - ms;

      let deletedCount = 0;
      for (const conv of userConversations) {
        if (new Date(conv.createdAt).getTime() < cutoffTime) {
          chatService.deleteConversation(conv.id);
          deletedCount++;
        }
      }

      return NextResponse.json(
        {
          success: true,
          deletedCount,
          message: `Deleted ${deletedCount} old conversation(s)`,
        },
        { headers: getCORSHeaders() }
      );
    }

    // 6. No valid params provided
    return NextResponse.json(
      { error: 'conversationId or olderThan is required' },
      { status: 400, headers: getCORSHeaders() }
    );
  } catch (error) {
    console.error('Delete conversation error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to delete conversation',
      },
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
