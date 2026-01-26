/**
 * Request Logging System for Framework B
 *
 * Provides comprehensive logging for:
 * - Request/response tracking
 * - Error logging
 * - Performance metrics
 * - Usage analytics
 */

import { NextRequest, NextResponse } from 'next/server';
import type { User } from '@supabase/supabase-js';

// Log levels
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

// Log entry interface
export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  userId?: string;
  userEmail?: string;
  method: string;
  path: string;
  statusCode?: number;
  responseTime?: number;
  error?: {
    message: string;
    stack?: string;
    code?: string;
  };
  metadata?: Record<string, any>;
}

// Performance metrics
export interface PerformanceMetrics {
  startTime: number;
  endTime?: number;
  duration?: number;
}

// Usage analytics
export interface UsageAnalytics {
  endpoint: string;
  userId: string;
  timestamp: string;
  tokensUsed?: number;
  cost?: number;
  success: boolean;
  errorType?: string;
}

/**
 * Logger class for structured logging
 */
class Logger {
  private logs: LogEntry[] = [];
  private maxLogsInMemory = 1000; // Keep last 1000 logs in memory

  /**
   * Log a request
   */
  log(entry: Omit<LogEntry, 'timestamp'>): void {
    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      ...entry,
    };

    // Add to in-memory logs
    this.logs.push(logEntry);

    // Trim if exceeding max
    if (this.logs.length > this.maxLogsInMemory) {
      this.logs.shift();
    }

    // Console output with formatting
    this.consoleLog(logEntry);
  }

  /**
   * Format and output to console
   */
  private consoleLog(entry: LogEntry): void {
    const prefix = `[${entry.timestamp}] [${entry.level.toUpperCase()}]`;
    const userInfo = entry.userId ? `[User: ${entry.userId}]` : '';
    const requestInfo = `${entry.method} ${entry.path}`;
    const statusInfo = entry.statusCode ? `[${entry.statusCode}]` : '';
    const timeInfo = entry.responseTime ? `[${entry.responseTime}ms]` : '';

    const message = `${prefix} ${userInfo} ${requestInfo} ${statusInfo} ${timeInfo}`.trim();

    switch (entry.level) {
      case LogLevel.ERROR:
        console.error(message, entry.error || entry.metadata);
        break;
      case LogLevel.WARN:
        console.warn(message, entry.metadata);
        break;
      case LogLevel.DEBUG:
        console.debug(message, entry.metadata);
        break;
      default:
        console.log(message, entry.metadata);
    }
  }

  /**
   * Get recent logs
   */
  getRecentLogs(limit: number = 100): LogEntry[] {
    return this.logs.slice(-limit);
  }

  /**
   * Get logs by user
   */
  getLogsByUser(userId: string, limit: number = 100): LogEntry[] {
    return this.logs
      .filter(log => log.userId === userId)
      .slice(-limit);
  }

  /**
   * Get error logs
   */
  getErrorLogs(limit: number = 100): LogEntry[] {
    return this.logs
      .filter(log => log.level === LogLevel.ERROR)
      .slice(-limit);
  }

  /**
   * Clear all logs
   */
  clearLogs(): void {
    this.logs = [];
  }
}

// Singleton logger instance
export const logger = new Logger();

/**
 * Request logger middleware
 * Wraps API route handlers to automatically log requests/responses
 */
export function withRequestLogging<T>(
  handler: (request: NextRequest, context?: any) => Promise<NextResponse | Response>,
  options: {
    endpoint: string;
    user?: User;
  }
) {
  return async (request: NextRequest, context?: any): Promise<NextResponse | Response> => {
    const startTime = performance.now();
    const { endpoint, user } = options;

    try {
      // Log request start
      logger.log({
        level: LogLevel.INFO,
        userId: user?.id,
        userEmail: user?.email,
        method: request.method,
        path: endpoint,
        metadata: {
          headers: Object.fromEntries(request.headers.entries()),
          query: Object.fromEntries(new URL(request.url).searchParams.entries()),
        },
      });

      // Execute handler
      const response = await handler(request, context);
      const endTime = performance.now();
      const responseTime = Math.round(endTime - startTime);

      // Log response
      logger.log({
        level: LogLevel.INFO,
        userId: user?.id,
        userEmail: user?.email,
        method: request.method,
        path: endpoint,
        statusCode: response.status,
        responseTime,
        metadata: {
          success: response.status >= 200 && response.status < 300,
        },
      });

      return response;
    } catch (error) {
      const endTime = performance.now();
      const responseTime = Math.round(endTime - startTime);

      // Log error
      logger.log({
        level: LogLevel.ERROR,
        userId: user?.id,
        userEmail: user?.email,
        method: request.method,
        path: endpoint,
        responseTime,
        error: {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
        },
      });

      // Re-throw to let error handlers deal with it
      throw error;
    }
  };
}

/**
 * Log an error
 */
export function logError(
  error: Error | unknown,
  context: {
    userId?: string;
    endpoint?: string;
    metadata?: Record<string, any>;
  }
): void {
  logger.log({
    level: LogLevel.ERROR,
    userId: context.userId,
    method: 'N/A',
    path: context.endpoint || 'unknown',
    error: {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    },
    metadata: context.metadata,
  });
}

/**
 * Log a warning
 */
export function logWarning(
  message: string,
  context: {
    userId?: string;
    endpoint?: string;
    metadata?: Record<string, any>;
  }
): void {
  logger.log({
    level: LogLevel.WARN,
    userId: context.userId,
    method: 'N/A',
    path: context.endpoint || 'unknown',
    metadata: {
      message,
      ...context.metadata,
    },
  });
}

/**
 * Log debug information
 */
export function logDebug(
  message: string,
  context: {
    userId?: string;
    endpoint?: string;
    metadata?: Record<string, any>;
  }
): void {
  logger.log({
    level: LogLevel.DEBUG,
    userId: context.userId,
    method: 'N/A',
    path: context.endpoint || 'unknown',
    metadata: {
      message,
      ...context.metadata,
    },
  });
}
