/**
 * Framework B API - Health Check
 * GET /api/framework-b/health
 */

import { NextResponse } from 'next/server';
import { healthCheck } from '@/Framework_B_Implementation/lib/services';

export async function GET() {
  try {
    const health = await healthCheck();

    const statusCode = health.status === 'healthy' ? 200 : 503;

    return NextResponse.json(
      {
        status: health.status,
        services: health.services,
        errors: health.errors,
        timestamp: new Date().toISOString(),
        endpoints: {
          documents: {
            upload: '/api/framework-b/documents/upload',
            search: '/api/framework-b/documents/search',
          },
          chat: {
            send: '/api/framework-b/chat/send',
            conversations: '/api/framework-b/chat/conversations',
          },
          health: '/api/framework-b/health',
        },
      },
      { status: statusCode }
    );
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Health check failed',
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}
