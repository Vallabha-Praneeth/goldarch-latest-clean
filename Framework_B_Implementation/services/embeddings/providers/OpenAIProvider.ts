/**
 * Framework B - OpenAI Embeddings Provider
 * Generate embeddings using OpenAI's API
 */

import type {
  EmbeddingRequest,
  EmbeddingResponse,
  EmbeddingVector,
  EmbeddingProviderConfig,
} from '../../../types/embeddings.types';

export class OpenAIProvider {
  private config: EmbeddingProviderConfig;
  private model: string;

  constructor(config: EmbeddingProviderConfig, model: string = 'text-embedding-3-small') {
    if (!config.apiKey) {
      throw new Error('OpenAI API key is required');
    }
    this.config = config;
    this.model = model;
  }

  /**
   * Generate embeddings for single or multiple texts
   */
  async generateEmbeddings(request: EmbeddingRequest): Promise<EmbeddingResponse> {
    const startTime = Date.now();
    const texts = Array.isArray(request.text) ? request.text : [request.text];
    const model = request.model || this.model;

    try {
      const response = await this.callOpenAI(texts, model);

      const embeddings = response.data.map((item: any) => item.embedding);
      const processingTime = Date.now() - startTime;

      return {
        embeddings,
        model: response.model,
        tokensUsed: response.usage?.total_tokens || 0,
        processingTime,
        cached: false,
      };
    } catch (error) {
      console.error('OpenAI embeddings error:', error);
      throw new Error(`Failed to generate embeddings: ${(error as Error).message}`);
    }
  }

  /**
   * Generate a single embedding
   */
  async generateEmbedding(text: string, metadata?: Record<string, any>): Promise<EmbeddingVector> {
    const response = await this.generateEmbeddings({ text });

    return {
      vector: response.embeddings[0],
      text,
      metadata,
      model: response.model,
    };
  }

  /**
   * Call OpenAI API
   */
  private async callOpenAI(texts: string[], model: string): Promise<any> {
    const url = this.config.baseUrl || 'https://api.openai.com/v1/embeddings';

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.config.apiKey}`,
    };

    if (this.config.organizationId) {
      headers['OpenAI-Organization'] = this.config.organizationId;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout || 30000);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          input: texts,
          model,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error?.message ||
          `OpenAI API error: ${response.status} ${response.statusText}`
        );
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);

      if ((error as any).name === 'AbortError') {
        throw new Error('OpenAI API request timeout');
      }

      throw error;
    }
  }

  /**
   * Get embedding dimensions for a model
   */
  getDimensions(model?: string): number {
    const modelName = model || this.model;

    // OpenAI embedding model dimensions
    const dimensions: Record<string, number> = {
      'text-embedding-3-small': 1536,
      'text-embedding-3-large': 3072,
      'text-embedding-ada-002': 1536,
    };

    return dimensions[modelName] || 1536;
  }

  /**
   * Validate that texts are within token limits
   */
  validateTexts(texts: string[]): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const maxTokens = 8191; // OpenAI limit

    texts.forEach((text, index) => {
      // Rough estimation: ~4 characters per token
      const estimatedTokens = Math.ceil(text.length / 4);

      if (estimatedTokens > maxTokens) {
        errors.push(
          `Text at index ${index} exceeds token limit (estimated ${estimatedTokens} tokens, max ${maxTokens})`
        );
      }

      if (text.trim().length === 0) {
        errors.push(`Text at index ${index} is empty`);
      }
    });

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Estimate cost for embeddings
   */
  estimateCost(texts: string[], model?: string): number {
    const modelName = model || this.model;

    // Pricing per 1M tokens (as of 2024)
    const pricing: Record<string, number> = {
      'text-embedding-3-small': 0.02,  // $0.02 per 1M tokens
      'text-embedding-3-large': 0.13,  // $0.13 per 1M tokens
      'text-embedding-ada-002': 0.10,  // $0.10 per 1M tokens
    };

    const pricePerMillion = pricing[modelName] || 0.02;

    // Estimate total tokens (rough: 4 chars = 1 token)
    const totalChars = texts.reduce((sum, text) => sum + text.length, 0);
    const estimatedTokens = Math.ceil(totalChars / 4);

    return (estimatedTokens / 1_000_000) * pricePerMillion;
  }
}
