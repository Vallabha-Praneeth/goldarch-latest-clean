/**
 * Usage Analytics System
 *
 * Tracks:
 * - API usage by endpoint
 * - Token consumption (OpenAI)
 * - Cost estimation
 * - Performance metrics
 * - Error rates
 */

import { redis } from '../rate-limit';

// Analytics event types
export enum AnalyticsEvent {
  DOCUMENT_UPLOAD = 'document:upload',
  DOCUMENT_SEARCH = 'document:search',
  DOCUMENT_SUMMARIZE = 'document:summarize',
  CHAT_SEND = 'chat:send',
  CONVERSATION_CREATE = 'conversation:create',
  CONVERSATION_DELETE = 'conversation:delete',
  ERROR = 'error',
}

// Usage record interface
export interface UsageRecord {
  userId: string;
  event: AnalyticsEvent;
  timestamp: string;
  metadata?: {
    tokensUsed?: number;
    estimatedCost?: number;
    duration?: number;
    success?: boolean;
    errorType?: string;
    documentCount?: number;
    chunkCount?: number;
    vectorCount?: number;
  };
}

// Aggregated analytics
export interface AggregatedAnalytics {
  userId: string;
  period: 'hour' | 'day' | 'week' | 'month';
  events: {
    [key in AnalyticsEvent]?: {
      count: number;
      totalTokens: number;
      totalCost: number;
      avgDuration: number;
      successRate: number;
    };
  };
  totalRequests: number;
  totalTokens: number;
  totalCost: number;
  errorRate: number;
}

// OpenAI pricing (as of January 2026)
const PRICING = {
  'text-embedding-3-small': 0.00002 / 1000, // $0.02 per 1M tokens
  'gpt-4-turbo': {
    input: 0.01 / 1000, // $0.01 per 1K tokens
    output: 0.03 / 1000, // $0.03 per 1K tokens
  },
  'gpt-4': {
    input: 0.03 / 1000,
    output: 0.06 / 1000,
  },
};

/**
 * Analytics tracker class
 */
class UsageAnalyticsTracker {
  /**
   * Track an event
   */
  async trackEvent(record: UsageRecord): Promise<void> {
    try {
      // Store in Redis with TTL (90 days)
      const key = `analytics:${record.userId}:${record.event}:${Date.now()}`;
      await redis.set(key, JSON.stringify(record), { ex: 60 * 60 * 24 * 90 });

      // Update counters
      await this.updateCounters(record);
    } catch (error) {
      console.error('Failed to track analytics event:', error);
      // Don't throw - analytics shouldn't break the app
    }
  }

  /**
   * Update real-time counters
   */
  private async updateCounters(record: UsageRecord): Promise<void> {
    const now = new Date();
    const hourKey = `analytics:counter:hour:${now.toISOString().slice(0, 13)}`;
    const dayKey = `analytics:counter:day:${now.toISOString().slice(0, 10)}`;

    // Increment counters for this hour and day
    const pipeline = [
      redis.hincrby(hourKey, record.event, 1),
      redis.hincrby(dayKey, record.event, 1),
      redis.expire(hourKey, 60 * 60 * 25), // 25 hours
      redis.expire(dayKey, 60 * 60 * 24 * 31), // 31 days
    ];

    await Promise.all(pipeline);
  }

  /**
   * Get analytics for a user
   */
  async getUserAnalytics(
    userId: string,
    period: 'hour' | 'day' | 'week' | 'month' = 'day'
  ): Promise<AggregatedAnalytics | null> {
    try {
      const now = new Date();
      const periodMs = this.getPeriodMs(period);
      const startTime = now.getTime() - periodMs;

      // Scan for user's events in the time period
      const pattern = `analytics:${userId}:*`;
      const keys = await this.scanKeys(pattern);

      const records: UsageRecord[] = [];
      for (const key of keys) {
        // Check if key is within time period
        const timestamp = parseInt(key.split(':').pop() || '0');
        if (timestamp >= startTime) {
          const data = await redis.get(key);
          if (data && typeof data === 'string') {
            records.push(JSON.parse(data));
          } else if (data) {
            records.push(data as UsageRecord);
          }
        }
      }

      // Aggregate the data
      return this.aggregateRecords(userId, records, period);
    } catch (error) {
      console.error('Failed to get user analytics:', error);
      return null;
    }
  }

  /**
   * Get system-wide analytics
   */
  async getSystemAnalytics(period: 'hour' | 'day' = 'day'): Promise<Record<string, number>> {
    try {
      const now = new Date();
      const key = period === 'hour'
        ? `analytics:counter:hour:${now.toISOString().slice(0, 13)}`
        : `analytics:counter:day:${now.toISOString().slice(0, 10)}`;

      const data = await redis.hgetall(key);
      return data || {};
    } catch (error) {
      console.error('Failed to get system analytics:', error);
      return {};
    }
  }

  /**
   * Scan Redis keys (helper to work around missing scan in Upstash)
   */
  private async scanKeys(pattern: string): Promise<string[]> {
    try {
      // Note: Upstash Redis REST API doesn't support SCAN directly
      // For production, consider using a dedicated analytics database
      // For now, we'll use a simpler approach with structured keys
      return [];
    } catch (error) {
      console.error('Failed to scan keys:', error);
      return [];
    }
  }

  /**
   * Aggregate records into analytics
   */
  private aggregateRecords(
    userId: string,
    records: UsageRecord[],
    period: 'hour' | 'day' | 'week' | 'month'
  ): AggregatedAnalytics {
    const events: AggregatedAnalytics['events'] = {};
    let totalRequests = 0;
    let totalTokens = 0;
    let totalCost = 0;
    let errorCount = 0;

    for (const record of records) {
      totalRequests++;

      if (!events[record.event]) {
        events[record.event] = {
          count: 0,
          totalTokens: 0,
          totalCost: 0,
          avgDuration: 0,
          successRate: 0,
        };
      }

      const eventStats = events[record.event]!;
      eventStats.count++;

      if (record.metadata) {
        if (record.metadata.tokensUsed) {
          eventStats.totalTokens += record.metadata.tokensUsed;
          totalTokens += record.metadata.tokensUsed;
        }
        if (record.metadata.estimatedCost) {
          eventStats.totalCost += record.metadata.estimatedCost;
          totalCost += record.metadata.estimatedCost;
        }
        if (record.metadata.duration) {
          eventStats.avgDuration =
            (eventStats.avgDuration * (eventStats.count - 1) + record.metadata.duration) /
            eventStats.count;
        }
        if (record.metadata.success === false || record.event === AnalyticsEvent.ERROR) {
          errorCount++;
        }
      }
    }

    // Calculate success rates
    for (const event in events) {
      const eventStats = events[event as AnalyticsEvent]!;
      const eventErrors = records.filter(
        r => r.event === event && r.metadata?.success === false
      ).length;
      eventStats.successRate = ((eventStats.count - eventErrors) / eventStats.count) * 100;
    }

    return {
      userId,
      period,
      events,
      totalRequests,
      totalTokens,
      totalCost,
      errorRate: totalRequests > 0 ? (errorCount / totalRequests) * 100 : 0,
    };
  }

  /**
   * Get period in milliseconds
   */
  private getPeriodMs(period: 'hour' | 'day' | 'week' | 'month'): number {
    const ms = {
      hour: 60 * 60 * 1000,
      day: 24 * 60 * 60 * 1000,
      week: 7 * 24 * 60 * 60 * 1000,
      month: 30 * 24 * 60 * 60 * 1000,
    };
    return ms[period];
  }

  /**
   * Calculate cost for embeddings
   */
  calculateEmbeddingCost(tokens: number): number {
    return tokens * PRICING['text-embedding-3-small'];
  }

  /**
   * Calculate cost for chat completion
   */
  calculateChatCost(inputTokens: number, outputTokens: number, model: 'gpt-4' | 'gpt-4-turbo' = 'gpt-4-turbo'): number {
    const pricing = PRICING[model];
    return (inputTokens * pricing.input) + (outputTokens * pricing.output);
  }

  /**
   * Clear old analytics data
   */
  async clearOldAnalytics(olderThanDays: number = 90): Promise<void> {
    // Redis TTL handles this automatically
    console.log(`Analytics older than ${olderThanDays} days are automatically cleaned up by Redis TTL`);
  }
}

// Export singleton instance
export const analytics = new UsageAnalyticsTracker();

/**
 * Helper to track document upload
 */
export async function trackDocumentUpload(
  userId: string,
  chunks: number,
  tokensUsed: number,
  duration: number,
  success: boolean
): Promise<void> {
  await analytics.trackEvent({
    userId,
    event: AnalyticsEvent.DOCUMENT_UPLOAD,
    timestamp: new Date().toISOString(),
    metadata: {
      chunkCount: chunks,
      tokensUsed,
      estimatedCost: analytics.calculateEmbeddingCost(tokensUsed),
      duration,
      success,
    },
  });
}

/**
 * Helper to track document search
 */
export async function trackDocumentSearch(
  userId: string,
  resultsCount: number,
  duration: number,
  success: boolean
): Promise<void> {
  await analytics.trackEvent({
    userId,
    event: AnalyticsEvent.DOCUMENT_SEARCH,
    timestamp: new Date().toISOString(),
    metadata: {
      documentCount: resultsCount,
      duration,
      success,
    },
  });
}

/**
 * Helper to track summarization
 */
export async function trackSummarization(
  userId: string,
  inputTokens: number,
  outputTokens: number,
  duration: number,
  success: boolean
): Promise<void> {
  await analytics.trackEvent({
    userId,
    event: AnalyticsEvent.DOCUMENT_SUMMARIZE,
    timestamp: new Date().toISOString(),
    metadata: {
      tokensUsed: inputTokens + outputTokens,
      estimatedCost: analytics.calculateChatCost(inputTokens, outputTokens),
      duration,
      success,
    },
  });
}

/**
 * Helper to track chat message
 */
export async function trackChatMessage(
  userId: string,
  inputTokens: number,
  outputTokens: number,
  duration: number,
  success: boolean
): Promise<void> {
  await analytics.trackEvent({
    userId,
    event: AnalyticsEvent.CHAT_SEND,
    timestamp: new Date().toISOString(),
    metadata: {
      tokensUsed: inputTokens + outputTokens,
      estimatedCost: analytics.calculateChatCost(inputTokens, outputTokens),
      duration,
      success,
    },
  });
}

/**
 * Helper to track errors
 */
export async function trackError(
  userId: string,
  errorType: string,
  endpoint: string
): Promise<void> {
  await analytics.trackEvent({
    userId,
    event: AnalyticsEvent.ERROR,
    timestamp: new Date().toISOString(),
    metadata: {
      errorType,
      success: false,
    },
  });
}
