/**
 * Performance Monitoring System
 *
 * Tracks:
 * - Response times
 * - Throughput
 * - Resource usage
 * - Slow queries/operations
 */

import { redis } from '../rate-limit';

// Performance metric types
export enum MetricType {
  API_RESPONSE_TIME = 'api:response_time',
  EMBEDDING_GENERATION = 'embedding:generation',
  VECTOR_SEARCH = 'vector:search',
  VECTOR_UPSERT = 'vector:upsert',
  CHAT_COMPLETION = 'chat:completion',
  DOCUMENT_PROCESSING = 'document:processing',
  DATABASE_QUERY = 'database:query',
}

// Performance thresholds (in milliseconds)
const THRESHOLDS = {
  [MetricType.API_RESPONSE_TIME]: 2000, // 2 seconds
  [MetricType.EMBEDDING_GENERATION]: 5000, // 5 seconds
  [MetricType.VECTOR_SEARCH]: 1000, // 1 second
  [MetricType.VECTOR_UPSERT]: 3000, // 3 seconds
  [MetricType.CHAT_COMPLETION]: 10000, // 10 seconds
  [MetricType.DOCUMENT_PROCESSING]: 15000, // 15 seconds
  [MetricType.DATABASE_QUERY]: 500, // 500ms
};

// Performance metric interface
export interface PerformanceMetric {
  type: MetricType;
  duration: number;
  timestamp: string;
  userId?: string;
  endpoint?: string;
  metadata?: Record<string, any>;
  isSlow?: boolean;
}

// Aggregated performance stats
export interface PerformanceStats {
  metric: MetricType;
  count: number;
  avg: number;
  min: number;
  max: number;
  p50: number; // Median
  p95: number;
  p99: number;
  slowCount: number;
  slowRate: number; // Percentage of slow requests
}

/**
 * Performance Monitor class
 */
class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private maxMetrics = 1000; // Keep last 1000 metrics in memory

  /**
   * Record a performance metric
   */
  record(metric: Omit<PerformanceMetric, 'timestamp' | 'isSlow'>): void {
    const threshold = THRESHOLDS[metric.type] || 5000;
    const isSlow = metric.duration > threshold;

    const fullMetric: PerformanceMetric = {
      ...metric,
      timestamp: new Date().toISOString(),
      isSlow,
    };

    // Store in memory
    this.metrics.push(fullMetric);
    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift();
    }

    // Log slow operations
    if (isSlow) {
      console.warn(
        `⚠️ SLOW OPERATION: ${metric.type} took ${metric.duration}ms (threshold: ${threshold}ms)`,
        {
          endpoint: metric.endpoint,
          userId: metric.userId,
          metadata: metric.metadata,
        }
      );
    }

    // Store in Redis for persistent tracking
    this.storeInRedis(fullMetric).catch(err =>
      console.error('Failed to store performance metric:', err)
    );
  }

  /**
   * Store metric in Redis
   */
  private async storeInRedis(metric: PerformanceMetric): Promise<void> {
    try {
      const key = `perf:${metric.type}:${Date.now()}`;
      await redis.set(key, JSON.stringify(metric), { ex: 60 * 60 * 24 * 7 }); // 7 days TTL
    } catch (error) {
      // Don't throw - monitoring shouldn't break the app
      console.error('Redis performance storage error:', error);
    }
  }

  /**
   * Get performance stats for a metric type
   */
  getStats(metricType: MetricType): PerformanceStats {
    const relevantMetrics = this.metrics.filter(m => m.type === metricType);

    if (relevantMetrics.length === 0) {
      return {
        metric: metricType,
        count: 0,
        avg: 0,
        min: 0,
        max: 0,
        p50: 0,
        p95: 0,
        p99: 0,
        slowCount: 0,
        slowRate: 0,
      };
    }

    const durations = relevantMetrics.map(m => m.duration).sort((a, b) => a - b);
    const slowCount = relevantMetrics.filter(m => m.isSlow).length;

    return {
      metric: metricType,
      count: relevantMetrics.length,
      avg: durations.reduce((a, b) => a + b, 0) / durations.length,
      min: durations[0],
      max: durations[durations.length - 1],
      p50: this.percentile(durations, 50),
      p95: this.percentile(durations, 95),
      p99: this.percentile(durations, 99),
      slowCount,
      slowRate: (slowCount / relevantMetrics.length) * 100,
    };
  }

  /**
   * Get all performance stats
   */
  getAllStats(): Record<MetricType, PerformanceStats> {
    const stats = {} as Record<MetricType, PerformanceStats>;

    Object.values(MetricType).forEach(type => {
      stats[type] = this.getStats(type);
    });

    return stats;
  }

  /**
   * Get slow operations
   */
  getSlowOperations(limit: number = 50): PerformanceMetric[] {
    return this.metrics
      .filter(m => m.isSlow)
      .slice(-limit);
  }

  /**
   * Get metrics for a specific user
   */
  getUserMetrics(userId: string): PerformanceMetric[] {
    return this.metrics.filter(m => m.userId === userId);
  }

  /**
   * Calculate percentile
   */
  private percentile(sortedArray: number[], percentile: number): number {
    if (sortedArray.length === 0) return 0;
    const index = Math.ceil((percentile / 100) * sortedArray.length) - 1;
    return sortedArray[Math.max(0, index)];
  }

  /**
   * Clear all metrics
   */
  clearMetrics(): void {
    this.metrics = [];
  }

  /**
   * Get health status based on performance
   */
  getHealthStatus(): {
    status: 'healthy' | 'degraded' | 'unhealthy';
    issues: string[];
  } {
    const stats = this.getAllStats();
    const issues: string[] = [];
    let unhealthyCount = 0;

    Object.entries(stats).forEach(([type, stat]) => {
      if (stat.count === 0) return; // Skip if no data

      // Check if slow rate is too high
      if (stat.slowRate > 20) {
        issues.push(`${type}: ${stat.slowRate.toFixed(1)}% of requests are slow`);
        unhealthyCount++;
      }

      // Check if P95 is above threshold
      const threshold = THRESHOLDS[type as MetricType] || 5000;
      if (stat.p95 > threshold * 1.5) {
        issues.push(`${type}: P95 response time (${stat.p95.toFixed(0)}ms) exceeds threshold`);
        unhealthyCount++;
      }
    });

    if (unhealthyCount === 0) {
      return { status: 'healthy', issues: [] };
    } else if (unhealthyCount <= 2) {
      return { status: 'degraded', issues };
    } else {
      return { status: 'unhealthy', issues };
    }
  }
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor();

/**
 * Timer utility for measuring operation duration
 */
export class PerformanceTimer {
  private startTime: number;
  private type: MetricType;
  private context: {
    userId?: string;
    endpoint?: string;
    metadata?: Record<string, any>;
  };

  constructor(
    type: MetricType,
    context: {
      userId?: string;
      endpoint?: string;
      metadata?: Record<string, any>;
    } = {}
  ) {
    this.type = type;
    this.context = context;
    this.startTime = performance.now();
  }

  /**
   * Stop timer and record metric
   */
  stop(): number {
    const duration = Math.round(performance.now() - this.startTime);

    performanceMonitor.record({
      type: this.type,
      duration,
      userId: this.context.userId,
      endpoint: this.context.endpoint,
      metadata: this.context.metadata,
    });

    return duration;
  }

  /**
   * Get elapsed time without stopping
   */
  elapsed(): number {
    return Math.round(performance.now() - this.startTime);
  }
}

/**
 * Decorator for timing async functions
 */
export function timed<T extends (...args: any[]) => Promise<any>>(
  metricType: MetricType,
  getContext?: (...args: Parameters<T>) => { userId?: string; endpoint?: string; metadata?: Record<string, any> }
) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ): PropertyDescriptor {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const context = getContext ? getContext(...args) : {};
      const timer = new PerformanceTimer(metricType, context);

      try {
        const result = await originalMethod.apply(this, args);
        timer.stop();
        return result;
      } catch (error) {
        timer.stop();
        throw error;
      }
    };

    return descriptor;
  };
}

/**
 * Utility to wrap async functions with performance monitoring
 */
export async function withPerformanceMonitoring<T>(
  metricType: MetricType,
  fn: () => Promise<T>,
  context?: {
    userId?: string;
    endpoint?: string;
    metadata?: Record<string, any>;
  }
): Promise<T> {
  const timer = new PerformanceTimer(metricType, context);
  try {
    const result = await fn();
    timer.stop();
    return result;
  } catch (error) {
    timer.stop();
    throw error;
  }
}
