const crypto = require('crypto');

let RedisClient = null;
try {
  // Optional dependency (matches repo pattern)
  const { Redis } = require('@upstash/redis');
  RedisClient = Redis;
} catch (err) {
  RedisClient = null;
}

class CacheWrapper {
  constructor(options = {}) {
    this.ttlSeconds = options.ttlSeconds || 300;
    this.memoryCache = new Map();

    if (RedisClient && process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
      this.redis = new RedisClient({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      });
    } else {
      this.redis = null;
    }
  }

  buildKey(jurisdictionId, itemCategory, attributes) {
    const hash = crypto
      .createHash('sha256')
      .update(JSON.stringify(attributes || {}))
      .digest('hex');
    return `compliance:${jurisdictionId}:${itemCategory}:${hash}`;
  }

  async get(key) {
    if (this.redis) {
      return this.redis.get(key);
    }

    const entry = this.memoryCache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.memoryCache.delete(key);
      return null;
    }

    return entry.value;
  }

  async set(key, value) {
    if (this.redis) {
      await this.redis.set(key, value, { ex: this.ttlSeconds });
      return;
    }

    this.memoryCache.set(key, {
      value,
      expiresAt: Date.now() + this.ttlSeconds * 1000,
    });
  }
}

module.exports = { CacheWrapper };
