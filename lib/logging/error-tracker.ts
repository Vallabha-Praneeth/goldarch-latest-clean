/**
 * Error Tracking System
 *
 * Centralized error tracking with:
 * - Structured error types
 * - Error context capture
 * - Integration ready for Sentry/similar services
 * - Error analytics
 */

import { logError } from './request-logger';
import { trackError } from './usage-analytics';

// Error categories
export enum ErrorCategory {
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  RATE_LIMIT = 'rate_limit',
  VALIDATION = 'validation',
  EXTERNAL_API = 'external_api',
  DATABASE = 'database',
  INTERNAL = 'internal',
  NETWORK = 'network',
}

// Error severity
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

// Structured error interface
export interface StructuredError {
  id: string;
  category: ErrorCategory;
  severity: ErrorSeverity;
  message: string;
  stack?: string;
  timestamp: string;
  userId?: string;
  endpoint?: string;
  metadata?: Record<string, any>;
  fingerprint?: string; // For grouping similar errors
}

/**
 * Application Error class with structured data
 */
export class AppError extends Error {
  public readonly category: ErrorCategory;
  public readonly severity: ErrorSeverity;
  public readonly userId?: string;
  public readonly endpoint?: string;
  public readonly metadata?: Record<string, any>;
  public readonly statusCode: number;

  constructor(
    message: string,
    options: {
      category: ErrorCategory;
      severity?: ErrorSeverity;
      userId?: string;
      endpoint?: string;
      metadata?: Record<string, any>;
      statusCode?: number;
    }
  ) {
    super(message);
    this.name = 'AppError';
    this.category = options.category;
    this.severity = options.severity || ErrorSeverity.MEDIUM;
    this.userId = options.userId;
    this.endpoint = options.endpoint;
    this.metadata = options.metadata;
    this.statusCode = options.statusCode || 500;

    // Maintains proper stack trace
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Specific error types for common scenarios
 */

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required', userId?: string) {
    super(message, {
      category: ErrorCategory.AUTHENTICATION,
      severity: ErrorSeverity.MEDIUM,
      userId,
      statusCode: 401,
    });
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Access denied', userId?: string, resource?: string) {
    super(message, {
      category: ErrorCategory.AUTHORIZATION,
      severity: ErrorSeverity.HIGH,
      userId,
      statusCode: 403,
      metadata: { resource },
    });
    this.name = 'AuthorizationError';
  }
}

export class RateLimitError extends AppError {
  constructor(
    message: string = 'Rate limit exceeded',
    userId?: string,
    retryAfter?: number
  ) {
    super(message, {
      category: ErrorCategory.RATE_LIMIT,
      severity: ErrorSeverity.LOW,
      userId,
      statusCode: 429,
      metadata: { retryAfter },
    });
    this.name = 'RateLimitError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string, field?: string, value?: any) {
    super(message, {
      category: ErrorCategory.VALIDATION,
      severity: ErrorSeverity.LOW,
      statusCode: 400,
      metadata: { field, value },
    });
    this.name = 'ValidationError';
  }
}

export class ExternalAPIError extends AppError {
  constructor(
    service: string,
    message: string,
    originalError?: Error
  ) {
    super(`${service}: ${message}`, {
      category: ErrorCategory.EXTERNAL_API,
      severity: ErrorSeverity.HIGH,
      statusCode: 502,
      metadata: {
        service,
        originalError: originalError?.message,
        originalStack: originalError?.stack,
      },
    });
    this.name = 'ExternalAPIError';
  }
}

export class DatabaseError extends AppError {
  constructor(operation: string, message: string, originalError?: Error) {
    super(`Database ${operation}: ${message}`, {
      category: ErrorCategory.DATABASE,
      severity: ErrorSeverity.CRITICAL,
      statusCode: 500,
      metadata: {
        operation,
        originalError: originalError?.message,
      },
    });
    this.name = 'DatabaseError';
  }
}

/**
 * Error Tracker class
 */
class ErrorTracker {
  private errors: StructuredError[] = [];
  private maxErrors = 500; // Keep last 500 errors in memory

  /**
   * Track an error
   */
  track(error: Error | AppError, context?: {
    userId?: string;
    endpoint?: string;
    metadata?: Record<string, any>;
  }): StructuredError {
    const structuredError: StructuredError = {
      id: this.generateErrorId(),
      category: error instanceof AppError ? error.category : ErrorCategory.INTERNAL,
      severity: error instanceof AppError ? error.severity : ErrorSeverity.MEDIUM,
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      userId: (error instanceof AppError ? error.userId : undefined) || context?.userId,
      endpoint: (error instanceof AppError ? error.endpoint : undefined) || context?.endpoint,
      metadata: {
        ...(error instanceof AppError ? error.metadata : {}),
        ...context?.metadata,
      },
      fingerprint: this.generateFingerprint(error),
    };

    // Store in memory
    this.errors.push(structuredError);
    if (this.errors.length > this.maxErrors) {
      this.errors.shift();
    }

    // Log to console
    logError(error, {
      userId: structuredError.userId,
      endpoint: structuredError.endpoint,
      metadata: structuredError.metadata,
    });

    // Track in analytics
    if (structuredError.userId) {
      trackError(
        structuredError.userId,
        structuredError.category,
        structuredError.endpoint || 'unknown'
      ).catch(err => console.error('Failed to track error in analytics:', err));
    }

    // TODO: Send to external error tracking service (Sentry, etc.)
    // this.sendToSentry(structuredError);

    return structuredError;
  }

  /**
   * Generate unique error ID
   */
  private generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate error fingerprint for grouping
   */
  private generateFingerprint(error: Error): string {
    // Use error type + first line of stack trace
    const stackLine = error.stack?.split('\n')[1]?.trim() || 'unknown';
    return `${error.name}:${stackLine}`;
  }

  /**
   * Get recent errors
   */
  getRecentErrors(limit: number = 50): StructuredError[] {
    return this.errors.slice(-limit);
  }

  /**
   * Get errors by category
   */
  getErrorsByCategory(category: ErrorCategory, limit: number = 50): StructuredError[] {
    return this.errors
      .filter(err => err.category === category)
      .slice(-limit);
  }

  /**
   * Get errors by user
   */
  getErrorsByUser(userId: string, limit: number = 50): StructuredError[] {
    return this.errors
      .filter(err => err.userId === userId)
      .slice(-limit);
  }

  /**
   * Get error stats
   */
  getErrorStats(): {
    total: number;
    byCategory: Record<ErrorCategory, number>;
    bySeverity: Record<ErrorSeverity, number>;
  } {
    const stats = {
      total: this.errors.length,
      byCategory: {} as Record<ErrorCategory, number>,
      bySeverity: {} as Record<ErrorSeverity, number>,
    };

    // Initialize counters
    Object.values(ErrorCategory).forEach(cat => {
      stats.byCategory[cat] = 0;
    });
    Object.values(ErrorSeverity).forEach(sev => {
      stats.bySeverity[sev] = 0;
    });

    // Count errors
    this.errors.forEach(err => {
      stats.byCategory[err.category]++;
      stats.bySeverity[err.severity]++;
    });

    return stats;
  }

  /**
   * Clear errors
   */
  clearErrors(): void {
    this.errors = [];
  }

  /**
   * Send to Sentry (placeholder for integration)
   */
  private sendToSentry(error: StructuredError): void {
    // TODO: Implement Sentry integration
    // Example:
    // import * as Sentry from '@sentry/nextjs';
    //
    // Sentry.captureException(new Error(error.message), {
    //   level: this.mapSeverityToSentryLevel(error.severity),
    //   tags: {
    //     category: error.category,
    //     endpoint: error.endpoint,
    //   },
    //   user: error.userId ? { id: error.userId } : undefined,
    //   extra: error.metadata,
    //   fingerprint: [error.fingerprint || 'unknown'],
    // });
  }

  /**
   * Map severity to Sentry level
   */
  private mapSeverityToSentryLevel(severity: ErrorSeverity): 'fatal' | 'error' | 'warning' | 'info' {
    switch (severity) {
      case ErrorSeverity.CRITICAL:
        return 'fatal';
      case ErrorSeverity.HIGH:
        return 'error';
      case ErrorSeverity.MEDIUM:
        return 'warning';
      case ErrorSeverity.LOW:
        return 'info';
      default:
        return 'error';
    }
  }
}

// Export singleton instance
export const errorTracker = new ErrorTracker();

/**
 * Utility to wrap async functions with error tracking
 */
export function withErrorTracking<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  context: {
    endpoint: string;
    userId?: string;
  }
): T {
  return (async (...args: any[]) => {
    try {
      return await fn(...args);
    } catch (error) {
      errorTracker.track(error as Error, context);
      throw error;
    }
  }) as T;
}
