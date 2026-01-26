import { Redis } from '@upstash/redis';

let redisClient: Redis | null = null;

export function getRedisClient(): Redis {
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

export async function getCachedJson<T>(key: string): Promise<T | null> {
  const redis = getRedisClient();
  const value = await redis.get<T>(key);
  return value ?? null;
}

export async function setCachedJson<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
  const redis = getRedisClient();
  await redis.set(key, value, { ex: ttlSeconds });
}
