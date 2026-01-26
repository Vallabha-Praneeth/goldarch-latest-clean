/**
 * Framework B API - Analytics & Monitoring
 * GET /api/framework-b/analytics
 *
 * Returns usage analytics, performance stats, and monitoring data
 * SECURED: Requires authentication
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, handleCORSOptions, getCORSHeaders } from '@/lib/auth-helpers';
import {
  analytics,
  performanceMonitor,
  errorTracker,
  logger,
} from '@/lib/logging';

export async function GET(request: NextRequest) {
  try {
    // Authentication check
    const auth = await requireAuth(request);
    if (auth.response) {
      return auth.response;
    }
    const { user } = auth;

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const period = (searchParams.get('period') as 'hour' | 'day' | 'week' | 'month') || 'day';
    const includeErrors = searchParams.get('errors') === 'true';
    const includePerformance = searchParams.get('performance') === 'true';
    const includeLogs = searchParams.get('logs') === 'true';

    // Get user analytics
    const userAnalytics = await analytics.getUserAnalytics(user.id, period);

    // Build response based on requested data
    const response: any = {
      userId: user.id,
      period,
      analytics: userAnalytics,
    };

    // Include performance metrics if requested
    if (includePerformance) {
      const userMetrics = performanceMonitor.getUserMetrics(user.id);
      const performanceStats = performanceMonitor.getAllStats();

      response.performance = {
        userMetrics: userMetrics.slice(-20), // Last 20 operations
        stats: performanceStats,
        health: performanceMonitor.getHealthStatus(),
      };
    }

    // Include errors if requested
    if (includeErrors) {
      const userErrors = errorTracker.getErrorsByUser(user.id, 20);
      response.errors = {
        recent: userErrors,
        stats: errorTracker.getErrorStats(),
      };
    }

    // Include logs if requested (last 20 log entries)
    if (includeLogs) {
      const userLogs = logger.getLogsByUser(user.id, 20);
      response.logs = userLogs;
    }

    return NextResponse.json(response, { headers: getCORSHeaders() });
  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json(
      {
        error: 'Failed to retrieve analytics',
        message: error instanceof Error ? error.message : 'Unknown error',
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
