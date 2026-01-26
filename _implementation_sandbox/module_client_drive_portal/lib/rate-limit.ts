import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

let redisClient: Redis | null = null;

function getRedis(): Redis {
  if (!redisClient) {
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;
    if (!url || !token) {
      throw new Error('Upstash Redis env vars missing');
    }
    redisClient = new Redis({ url, token });
  }
  return redisClient;
}

export function createRateLimiter(maxRequests: number, window: string): Ratelimit {
  return new Ratelimit({
    redis: getRedis(),
    limiter: Ratelimit.slidingWindow(maxRequests, window),
  });
}
