/**
 * Unified Monitoring & Logging Module
 *
 * Exports all logging, analytics, error tracking, and performance monitoring utilities
 */

// Request Logging
export {
  logger,
  LogLevel,
  withRequestLogging,
  logError,
  logWarning,
  logDebug,
  type LogEntry,
  type PerformanceMetrics,
  type UsageAnalytics as RequestUsageAnalytics,
} from './request-logger';

// Usage Analytics
export {
  analytics,
  AnalyticsEvent,
  trackDocumentUpload,
  trackDocumentSearch,
  trackSummarization,
  trackChatMessage,
  trackError,
  type UsageRecord,
  type AggregatedAnalytics,
} from './usage-analytics';

// Error Tracking
export {
  errorTracker,
  ErrorCategory,
  ErrorSeverity,
  AppError,
  AuthenticationError,
  AuthorizationError,
  RateLimitError,
  ValidationError,
  ExternalAPIError,
  DatabaseError,
  withErrorTracking,
  type StructuredError,
} from './error-tracker';

// Performance Monitoring
export {
  performanceMonitor,
  MetricType,
  PerformanceTimer,
  timed,
  withPerformanceMonitoring,
  type PerformanceMetric,
  type PerformanceStats,
} from './performance-monitor';

/**
 * Unified monitoring context for API routes
 */
export interface MonitoringContext {
  userId?: string;
  endpoint: string;
  startTime: number;
}

/**
 * Helper to create monitoring context
 */
export function createMonitoringContext(endpoint: string, userId?: string): MonitoringContext {
  return {
    endpoint,
    userId,
    startTime: performance.now(),
  };
}

/**
 * Get all monitoring stats (for admin dashboard)
 */
export async function getAllMonitoringStats(userId?: string) {
  const [performanceStats, errorStats, userAnalytics] = await Promise.all([
    Promise.resolve(performanceMonitor.getAllStats()),
    Promise.resolve(errorTracker.getErrorStats()),
    userId ? analytics.getUserAnalytics(userId, 'day') : Promise.resolve(null),
  ]);

  return {
    performance: performanceStats,
    errors: errorStats,
    analytics: userAnalytics,
    health: performanceMonitor.getHealthStatus(),
    recentErrors: errorTracker.getRecentErrors(10),
    slowOperations: performanceMonitor.getSlowOperations(10),
  };
}

/**
 * Monitoring summary for a specific user
 */
export async function getUserMonitoringSummary(userId: string) {
  const [analytics, errors, performanceMetrics] = await Promise.all([
    analytics.getUserAnalytics(userId, 'day'),
    Promise.resolve(errorTracker.getErrorsByUser(userId, 20)),
    Promise.resolve(performanceMonitor.getUserMetrics(userId)),
  ]);

  return {
    analytics,
    recentErrors: errors,
    performance: performanceMetrics,
  };
}

/**
 * Health check for monitoring system
 */
export function getMonitoringHealth() {
  return {
    logging: {
      status: 'operational',
      recentLogs: logger.getRecentLogs(5),
    },
    analytics: {
      status: 'operational',
    },
    errorTracking: {
      status: 'operational',
      recentErrors: errorTracker.getRecentErrors(5),
    },
    performance: performanceMonitor.getHealthStatus(),
  };
}
