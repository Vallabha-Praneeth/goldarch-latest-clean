/**
 * Framework B - Embeddings Service
 * Main service for generating vector embeddings
 */

import type {
  EmbeddingRequest,
  EmbeddingResponse,
  BatchEmbeddingRequest,
  BatchEmbeddingResponse,
  EmbeddingVector,
  EmbeddingServiceConfig,
  EmbeddingProvider,
} from '../../types/embeddings.types';

import { OpenAIProvider } from './providers/OpenAIProvider';
import { InMemoryEmbeddingCache, generateTextHash, generateTextHashes } from './cache';
import {
  batchArray,
  processInParallel,
  RateLimiter,
  retryWithBackoff,
  ProgressTracker,
} from './batch';

export class EmbeddingsService {
  private provider: OpenAIProvider;
  private cache: InMemoryEmbeddingCache | null;
  private rateLimiter: RateLimiter | null;
  private config: EmbeddingServiceConfig;

  constructor(config: EmbeddingServiceConfig) {
    this.config = config;

    // Initialize provider
    const providerConfig = this.getProviderConfig(config.embedding.provider);
    this.provider = this.initializeProvider(config.embedding.provider, providerConfig, config.embedding.model);

    // Initialize cache if enabled
    this.cache = config.cache?.enabled
      ? new InMemoryEmbeddingCache(
          config.cache.maxSize || 10000,
          config.cache.ttl || 86400
        )
      : null;

    // Initialize rate limiter if configured
    const rateLimit = providerConfig.rateLimit;
    this.rateLimiter = rateLimit ? new RateLimiter(rateLimit) : null;
  }

  /**
   * Generate embeddings for single or multiple texts
   */
  async generateEmbeddings(request: EmbeddingRequest): Promise<EmbeddingResponse> {
    const texts = Array.isArray(request.text) ? request.text : [request.text];

    // Check cache first
    if (this.cache && texts.length === 1) {
      const hash = generateTextHash(texts[0], request.model);
      const cached = await this.cache.get(hash);

      if (cached) {
        return {
          embeddings: [cached],
          model: request.model || this.config.embedding.model,
          tokensUsed: 0,
          processingTime: 0,
          cached: true,
        };
      }
    }

    // Generate embeddings with retry logic
    const generateFn = () => this.provider.generateEmbeddings(request);

    const response = await retryWithBackoff(
      this.rateLimiter
        ? () => this.rateLimiter!.execute(generateFn)
        : generateFn,
      this.config.embedding.retryAttempts,
      this.config.embedding.retryDelay
    );

    // Cache results
    if (this.cache && texts.length === 1) {
      const hash = generateTextHash(texts[0], request.model);
      await this.cache.set(hash, response.embeddings[0], request.metadata);
    }

    return response;
  }

  /**
   * Generate embedding for a single text
   */
  async generateEmbedding(text: string, metadata?: Record<string, any>): Promise<EmbeddingVector> {
    const response = await this.generateEmbeddings({ text, metadata });

    return {
      vector: response.embeddings[0],
      text,
      metadata,
      model: response.model,
    };
  }

  /**
   * Generate embeddings for multiple texts in batches
   */
  async generateBatchEmbeddings(request: BatchEmbeddingRequest): Promise<BatchEmbeddingResponse> {
    const { texts, metadata, options } = request;
    const batchSize = this.config.embedding.batchSize;

    const startTime = Date.now();
    const results: EmbeddingVector[] = [];
    const errors: Array<{ index: number; text: string; error: string }> = [];
    let totalTokens = 0;
    let cacheHits = 0;

    // Check cache for all texts
    const hashes = generateTextHashes(texts, this.config.embedding.model);
    const cachePromises = this.cache
      ? await Promise.all(hashes.map(hash => this.cache!.get(hash)))
      : Array(texts.length).fill(null);

    // Separate cached and uncached texts
    const uncachedIndices: number[] = [];
    const uncachedTexts: string[] = [];

    texts.forEach((text, index) => {
      const cachedEmbedding = cachePromises[index];

      if (cachedEmbedding) {
        results[index] = {
          vector: cachedEmbedding,
          text,
          metadata,
          model: this.config.embedding.model,
        };
        cacheHits++;
      } else {
        uncachedIndices.push(index);
        uncachedTexts.push(text);
      }
    });

    // Process uncached texts in batches
    if (uncachedTexts.length > 0) {
      const batches = batchArray(uncachedTexts, batchSize);
      const progress = options?.onProgress
        ? new ProgressTracker(uncachedTexts.length, options.onProgress)
        : null;

      const processBatch = async (batch: string[]): Promise<void> => {
        try {
          const response = await this.generateEmbeddings({ text: batch, metadata });

          // Store results
          batch.forEach((text, batchIndex) => {
            const originalIndex = uncachedIndices[batchIndex];
            const embedding = response.embeddings[batchIndex];

            results[originalIndex] = {
              vector: embedding,
              text,
              metadata,
              model: response.model,
            };

            // Cache the embedding
            if (this.cache) {
              const hash = generateTextHash(text, response.model);
              this.cache.set(hash, embedding, metadata);
            }

            if (progress) {
              progress.increment();
            }
          });

          totalTokens += response.tokensUsed;
        } catch (error) {
          // Record errors for this batch
          batch.forEach((text, batchIndex) => {
            const originalIndex = uncachedIndices[batchIndex];
            errors.push({
              index: originalIndex,
              text,
              error: (error as Error).message,
            });
          });
        }
      };

      // Process batches
      if (options?.parallel !== false) {
        await processInParallel(
          batches,
          processBatch,
          options?.maxConcurrent || 5
        );
      } else {
        for (const batch of batches) {
          await processBatch(batch);
        }
      }
    }

    const totalTime = Date.now() - startTime;

    return {
      embeddings: results.filter(r => r !== undefined),
      totalTokens,
      totalTime,
      cacheHits,
      failures: errors.length,
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  /**
   * Get provider configuration
   */
  private getProviderConfig(provider: EmbeddingProvider): any {
    switch (provider) {
      case 'openai':
        return this.config.providers.openai;
      case 'claude':
        return this.config.providers.claude;
      case 'gemini':
        return this.config.providers.gemini;
      default:
        throw new Error(`Unknown provider: ${provider}`);
    }
  }

  /**
   * Initialize embedding provider
   */
  private initializeProvider(provider: EmbeddingProvider, config: any, model: string): any {
    switch (provider) {
      case 'openai':
        return new OpenAIProvider(config, model);
      case 'claude':
        throw new Error('Claude provider not yet implemented');
      case 'gemini':
        throw new Error('Gemini provider not yet implemented');
      default:
        throw new Error(`Unknown provider: ${provider}`);
    }
  }

  /**
   * Get cache statistics
   */
  async getCacheStats() {
    if (!this.cache) {
      return null;
    }

    return await this.cache.stats();
  }

  /**
   * Clear cache
   */
  async clearCache() {
    if (this.cache) {
      await this.cache.clear();
    }
  }

  /**
   * Get embedding dimensions for current model
   */
  getDimensions(): number {
    return this.provider.getDimensions(this.config.embedding.model);
  }

  /**
   * Estimate cost for embedding texts
   */
  estimateCost(texts: string[]): number {
    return this.provider.estimateCost(texts, this.config.embedding.model);
  }
}
