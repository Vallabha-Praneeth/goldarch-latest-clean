/**
 * Framework B - Embeddings Types
 * Type definitions for vector embeddings generation
 */

export type EmbeddingProvider = 'openai' | 'claude' | 'gemini' | 'custom';

export type OpenAIEmbeddingModel =
  | 'text-embedding-3-small'
  | 'text-embedding-3-large'
  | 'text-embedding-ada-002';

export type ClaudeEmbeddingModel =
  | 'claude-3-opus'    // If Claude supports embeddings
  | 'claude-3-sonnet';

export type GeminiEmbeddingModel =
  | 'embedding-001'
  | 'text-embedding-004';

export type EmbeddingModel =
  | OpenAIEmbeddingModel
  | ClaudeEmbeddingModel
  | GeminiEmbeddingModel
  | string; // For custom models

export interface EmbeddingConfig {
  /** Provider to use for embeddings */
  provider: EmbeddingProvider;
  /** Model name */
  model: EmbeddingModel;
  /** Embedding dimensions */
  dimensions: number;
  /** Batch size for processing multiple texts */
  batchSize: number;
  /** Enable caching of embeddings */
  enableCache: boolean;
  /** Number of retry attempts on failure */
  retryAttempts: number;
  /** Retry delay in milliseconds */
  retryDelay: number;
}

export interface EmbeddingRequest {
  /** Text(s) to embed */
  text: string | string[];
  /** Optional metadata to attach */
  metadata?: Record<string, any>;
  /** Override default model */
  model?: EmbeddingModel;
}

export interface EmbeddingResponse {
  /** Generated embedding vector(s) */
  embeddings: number[][];
  /** Model used for generation */
  model: string;
  /** Number of tokens used */
  tokensUsed: number;
  /** Processing time in milliseconds */
  processingTime: number;
  /** Whether result was from cache */
  cached: boolean;
}

export interface EmbeddingVector {
  /** The vector embedding */
  vector: number[];
  /** Text that was embedded */
  text: string;
  /** Metadata associated with the embedding */
  metadata?: Record<string, any>;
  /** Model used */
  model: string;
}

export interface BatchEmbeddingRequest {
  /** Array of texts to embed */
  texts: string[];
  /** Common metadata for all embeddings */
  metadata?: Record<string, any>;
  /** Batch processing options */
  options?: {
    /** Process in parallel (default: true) */
    parallel?: boolean;
    /** Maximum concurrent requests */
    maxConcurrent?: number;
    /** Progress callback */
    onProgress?: (completed: number, total: number) => void;
  };
}

export interface BatchEmbeddingResponse {
  /** Array of embedding vectors */
  embeddings: EmbeddingVector[];
  /** Total tokens used */
  totalTokens: number;
  /** Total processing time */
  totalTime: number;
  /** Number of cache hits */
  cacheHits: number;
  /** Number of failed embeddings */
  failures: number;
  /** Error details for failed embeddings */
  errors?: Array<{
    index: number;
    text: string;
    error: string;
  }>;
}

export interface EmbeddingCache {
  /** Get cached embedding by text hash */
  get(textHash: string): Promise<number[] | null>;
  /** Store embedding in cache */
  set(textHash: string, embedding: number[], metadata?: Record<string, any>): Promise<void>;
  /** Check if embedding exists in cache */
  has(textHash: string): Promise<boolean>;
  /** Clear cache */
  clear(): Promise<void>;
  /** Get cache statistics */
  stats(): Promise<{
    size: number;
    hits: number;
    misses: number;
    hitRate: number;
  }>;
}

export interface EmbeddingProviderConfig {
  /** API key for the provider */
  apiKey: string;
  /** API base URL (for custom providers) */
  baseUrl?: string;
  /** Organization ID (if applicable) */
  organizationId?: string;
  /** Rate limit (requests per minute) */
  rateLimit?: number;
  /** Timeout in milliseconds */
  timeout?: number;
}

export interface EmbeddingServiceConfig {
  /** Embedding generation configuration */
  embedding: EmbeddingConfig;
  /** Provider-specific configurations */
  providers: {
    openai?: EmbeddingProviderConfig;
    claude?: EmbeddingProviderConfig;
    gemini?: EmbeddingProviderConfig;
    custom?: EmbeddingProviderConfig;
  };
  /** Cache configuration */
  cache?: {
    enabled: boolean;
    type: 'memory' | 'redis' | 'file';
    ttl?: number; // Time to live in seconds
    maxSize?: number; // Maximum cache size
  };
}
