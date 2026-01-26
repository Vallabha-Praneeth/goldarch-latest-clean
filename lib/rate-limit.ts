/**
 * Production-Grade Rate Limiting with Upstash Redis
 *
 * Benefits over in-memory:
 * - Persistent across server restarts
 * - Works in serverless/edge environments
 * - Scales across multiple server instances
 * - Sliding window algorithm (more accurate)
 */

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Initialize Redis client (singleton)
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Rate limiter instances for different endpoints
// Using sliding window algorithm for smooth rate limiting

/**
 * Document Upload - 50 requests per minute
 * More restrictive because uploads are resource-intensive
 */
export const uploadRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(50, "1 m"),
  analytics: true,
  prefix: "ratelimit:upload",
});

/**
 * Document Search - 100 requests per minute
 * Higher limit for search operations
 */
export const searchRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, "1 m"),
  analytics: true,
  prefix: "ratelimit:search",
});

/**
 * Document Summarize - 20 requests per minute
 * Lower limit because summarization is expensive (uses OpenAI heavily)
 */
export const summarizeRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(20, "1 m"),
  analytics: true,
  prefix: "ratelimit:summarize",
});

/**
 * Chat Send - 60 requests per minute
 * Balanced limit for chat interactions
 */
export const chatRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(60, "1 m"),
  analytics: true,
  prefix: "ratelimit:chat",
});

/**
 * Conversations - 100 requests per minute
 * Higher limit for conversation management
 */
export const conversationsRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, "1 m"),
  analytics: true,
  prefix: "ratelimit:conversations",
});

/**
 * Generic rate limiter factory
 * Use this for custom rate limits
 */
export function createRateLimit(
  limit: number,
  window: string,
  prefix: string
) {
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(limit, window),
    analytics: true,
    prefix: `ratelimit:${prefix}`,
  });
}

/**
 * Check rate limit and return standardized response
 */
export async function checkRateLimit(
  rateLimiter: Ratelimit,
  identifier: string
): Promise<{
  allowed: boolean;
  limit: number;
  remaining: number;
  reset: number;
  retryAfter?: number;
}> {
  const { success, limit, remaining, reset } = await rateLimiter.limit(
    identifier
  );

  return {
    allowed: success,
    limit,
    remaining,
    reset,
    retryAfter: success ? undefined : Math.ceil((reset - Date.now()) / 1000),
  };
}

/**
 * Get rate limit analytics for a specific identifier
 */
export async function getRateLimitAnalytics(identifier: string) {
  try {
    // Get current counts for all rate limiters
    const [upload, search, summarize, chat, conversations] = await Promise.all([
      redis.get(`ratelimit:upload:${identifier}`),
      redis.get(`ratelimit:search:${identifier}`),
      redis.get(`ratelimit:summarize:${identifier}`),
      redis.get(`ratelimit:chat:${identifier}`),
      redis.get(`ratelimit:conversations:${identifier}`),
    ]);

    return {
      upload: upload || 0,
      search: search || 0,
      summarize: summarize || 0,
      chat: chat || 0,
      conversations: conversations || 0,
    };
  } catch (error) {
    console.error("Failed to get rate limit analytics:", error);
    return null;
  }
}

/**
 * Reset rate limit for a specific user (admin function)
 */
export async function resetRateLimit(
  rateLimiter: Ratelimit,
  identifier: string
): Promise<boolean> {
  try {
    await rateLimiter.resetUsage(identifier);
    return true;
  } catch (error) {
    console.error("Failed to reset rate limit:", error);
    return false;
  }
}

// Export Redis instance for direct access if needed
export { redis };
