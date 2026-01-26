/**
 * Framework B - Embeddings Cache
 * Cache embeddings to avoid redundant API calls
 */

import type { EmbeddingCache } from '../../types/embeddings.types';
import { createHash } from 'crypto';

/**
 * In-memory cache implementation
 */
export class InMemoryEmbeddingCache implements EmbeddingCache {
  private cache: Map<string, { embedding: number[]; metadata?: any; timestamp: number }>;
  private stats: {
    hits: number;
    misses: number;
    size: number;
  };
  private maxSize: number;
  private ttl: number; // Time to live in milliseconds

  constructor(maxSize: number = 10000, ttlSeconds: number = 86400) {
    this.cache = new Map();
    this.stats = { hits: 0, misses: 0, size: 0 };
    this.maxSize = maxSize;
    this.ttl = ttlSeconds * 1000; // Convert to ms
  }

  /**
   * Get cached embedding by text hash
   */
  async get(textHash: string): Promise<number[] | null> {
    const entry = this.cache.get(textHash);

    if (!entry) {
      this.stats.misses++;
      return null;
    }

    // Check if expired
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(textHash);
      this.stats.misses++;
      this.stats.size = this.cache.size;
      return null;
    }

    this.stats.hits++;
    return entry.embedding;
  }

  /**
   * Store embedding in cache
   */
  async set(textHash: string, embedding: number[], metadata?: Record<string, any>): Promise<void> {
    // Enforce max size - remove oldest entries
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }

    this.cache.set(textHash, {
      embedding,
      metadata,
      timestamp: Date.now(),
    });

    this.stats.size = this.cache.size;
  }

  /**
   * Check if embedding exists in cache
   */
  async has(textHash: string): Promise<boolean> {
    const entry = this.cache.get(textHash);

    if (!entry) {
      return false;
    }

    // Check if expired
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(textHash);
      this.stats.size = this.cache.size;
      return false;
    }

    return true;
  }

  /**
   * Clear all cached embeddings
   */
  async clear(): Promise<void> {
    this.cache.clear();
    this.stats = { hits: 0, misses: 0, size: 0 };
  }

  /**
   * Get cache statistics
   */
  async stats(): Promise<{
    size: number;
    hits: number;
    misses: number;
    hitRate: number;
  }> {
    const total = this.stats.hits + this.stats.misses;
    const hitRate = total > 0 ? this.stats.hits / total : 0;

    return {
      size: this.stats.size,
      hits: this.stats.hits,
      misses: this.stats.misses,
      hitRate,
    };
  }

  /**
   * Remove expired entries
   */
  async cleanup(): Promise<number> {
    let removed = 0;
    const now = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.ttl) {
        this.cache.delete(key);
        removed++;
      }
    }

    this.stats.size = this.cache.size;
    return removed;
  }
}

/**
 * Generate hash for text (for cache key)
 */
export function generateTextHash(text: string, model?: string): string {
  const content = model ? `${model}:${text}` : text;
  return createHash('sha256').update(content).digest('hex');
}

/**
 * Batch hash generation
 */
export function generateTextHashes(texts: string[], model?: string): string[] {
  return texts.map(text => generateTextHash(text, model));
}
