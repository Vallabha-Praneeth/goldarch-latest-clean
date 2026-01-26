/**
 * Framework B - Batch Embeddings Processing
 * Utilities for processing embeddings in batches
 */

import type {
  BatchEmbeddingRequest,
  BatchEmbeddingResponse,
  EmbeddingVector,
} from '../../types/embeddings.types';

/**
 * Split array into batches
 */
export function batchArray<T>(array: T[], batchSize: number): T[][] {
  const batches: T[][] = [];

  for (let i = 0; i < array.length; i += batchSize) {
    batches.push(array.slice(i, i + batchSize));
  }

  return batches;
}

/**
 * Process batches in parallel with concurrency limit
 */
export async function processInParallel<T, R>(
  items: T[],
  processor: (item: T) => Promise<R>,
  maxConcurrent: number = 5
): Promise<R[]> {
  const results: R[] = [];
  const executing: Promise<void>[] = [];

  for (const [index, item] of items.entries()) {
    const promise = processor(item).then(result => {
      results[index] = result;
    });

    executing.push(promise);

    if (executing.length >= maxConcurrent) {
      await Promise.race(executing);
      // Remove completed promises
      executing.splice(
        executing.findIndex(p => p === promise),
        1
      );
    }
  }

  await Promise.all(executing);
  return results;
}

/**
 * Process batches sequentially with delay
 */
export async function processSequentially<T, R>(
  items: T[],
  processor: (item: T) => Promise<R>,
  delayMs: number = 0
): Promise<R[]> {
  const results: R[] = [];

  for (const item of items) {
    results.push(await processor(item));

    if (delayMs > 0 && item !== items[items.length - 1]) {
      await sleep(delayMs);
    }
  }

  return results;
}

/**
 * Rate limiter for API calls
 */
export class RateLimiter {
  private queue: Array<() => void> = [];
  private processing = false;
  private requestsThisMinute = 0;
  private minuteStart = Date.now();

  constructor(private requestsPerMinute: number) {}

  /**
   * Execute function with rate limiting
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await fn();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });

      this.processQueue();
    });
  }

  private async processQueue() {
    if (this.processing || this.queue.length === 0) {
      return;
    }

    this.processing = true;

    while (this.queue.length > 0) {
      // Reset counter if a minute has passed
      const now = Date.now();
      if (now - this.minuteStart >= 60000) {
        this.requestsThisMinute = 0;
        this.minuteStart = now;
      }

      // Wait if we've hit the rate limit
      if (this.requestsThisMinute >= this.requestsPerMinute) {
        const waitTime = 60000 - (now - this.minuteStart);
        await sleep(waitTime);
        this.requestsThisMinute = 0;
        this.minuteStart = Date.now();
      }

      const task = this.queue.shift();
      if (task) {
        this.requestsThisMinute++;
        await task();
      }
    }

    this.processing = false;
  }
}

/**
 * Retry logic with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000
): Promise<T> {
  let lastError: Error;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      if (attempt < maxRetries) {
        const delay = initialDelay * Math.pow(2, attempt);
        console.log(`Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms`);
        await sleep(delay);
      }
    }
  }

  throw lastError!;
}

/**
 * Sleep utility
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Progress tracker for batch operations
 */
export class ProgressTracker {
  private completed = 0;
  private total: number;
  private startTime: number;
  private callback?: (progress: number, total: number) => void;

  constructor(total: number, callback?: (progress: number, total: number) => void) {
    this.total = total;
    this.startTime = Date.now();
    this.callback = callback;
  }

  /**
   * Mark one item as completed
   */
  increment() {
    this.completed++;

    if (this.callback) {
      this.callback(this.completed, this.total);
    }
  }

  /**
   * Get progress percentage
   */
  getProgress(): number {
    return this.total > 0 ? (this.completed / this.total) * 100 : 0;
  }

  /**
   * Get elapsed time in seconds
   */
  getElapsedTime(): number {
    return (Date.now() - this.startTime) / 1000;
  }

  /**
   * Estimate remaining time in seconds
   */
  getEstimatedTimeRemaining(): number {
    if (this.completed === 0) return 0;

    const elapsed = this.getElapsedTime();
    const rate = this.completed / elapsed;
    const remaining = this.total - this.completed;

    return remaining / rate;
  }

  /**
   * Get progress summary
   */
  getSummary(): {
    completed: number;
    total: number;
    percentage: number;
    elapsed: number;
    remaining: number;
  } {
    return {
      completed: this.completed,
      total: this.total,
      percentage: this.getProgress(),
      elapsed: this.getElapsedTime(),
      remaining: this.getEstimatedTimeRemaining(),
    };
  }
}
