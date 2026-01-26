/**
 * Framework B - Context Retriever
 * Retrieve relevant context from vector store
 */

import type { RetrievalResult } from '../../types/rag.types';
import type { VectorStore } from '../vector-store/VectorStore';
import type { EmbeddingsService } from '../embeddings/EmbeddingsService';

export interface RetrievalRequest {
  query: string;
  topK?: number;
  namespace?: string;
  filters?: Record<string, any>;
  minScore?: number;
}

export interface RetrievalResponse {
  results: RetrievalResult[];
  query: string;
  retrievalTime: number;
}

export class ContextRetriever {
  constructor(
    private vectorStore: VectorStore,
    private embeddingsService: EmbeddingsService
  ) {}

  /**
   * Retrieve relevant context for a query
   */
  async retrieve(request: RetrievalRequest): Promise<RetrievalResponse> {
    const startTime = Date.now();

    // Generate query embedding
    const embedding = await this.embeddingsService.generateEmbedding(request.query);

    // Search vector store
    const searchResponse = await this.vectorStore.search({
      queryEmbedding: embedding.vector,
      topK: request.topK || 5,
      namespace: request.namespace,
      filters: request.filters,
      minScore: request.minScore || 0.6,
    });

    const retrievalTime = Date.now() - startTime;

    return {
      results: searchResponse.results,
      query: request.query,
      retrievalTime,
    };
  }

  /**
   * Retrieve with query expansion
   */
  async retrieveWithExpansion(request: RetrievalRequest): Promise<RetrievalResponse> {
    // Generate embeddings for both original and expanded queries
    const originalResults = await this.retrieve(request);

    // Simple expansion: try query variations
    // In production, use proper query expansion techniques

    return originalResults;
  }

  /**
   * Retrieve and rank results
   */
  async retrieveAndRank(request: RetrievalRequest): Promise<RetrievalResponse> {
    const response = await this.retrieve(request);

    // Re-rank results based on multiple factors
    const rankedResults = this.rerank(response.results, request.query);

    return {
      ...response,
      results: rankedResults,
    };
  }

  /**
   * Re-rank results based on relevance
   */
  private rerank(results: RetrievalResult[], query: string): RetrievalResult[] {
    // Simple re-ranking based on:
    // 1. Semantic similarity (score from vector search)
    // 2. Keyword overlap
    // 3. Recency (if metadata includes date)

    const queryWords = new Set(
      query.toLowerCase().split(/\s+/).filter(w => w.length > 2)
    );

    return results
      .map(result => {
        const contentWords = new Set(
          result.content.toLowerCase().split(/\s+/)
        );

        // Calculate keyword overlap
        const overlap = [...queryWords].filter(word =>
          contentWords.has(word)
        ).length;

        const keywordScore = overlap / queryWords.size;

        // Combine scores (weighted)
        const combinedScore = result.score * 0.7 + keywordScore * 0.3;

        return {
          ...result,
          score: combinedScore,
        };
      })
      .sort((a, b) => b.score - a.score);
  }

  /**
   * Filter results by metadata
   */
  filterByMetadata(
    results: RetrievalResult[],
    filters: Record<string, any>
  ): RetrievalResult[] {
    return results.filter(result => {
      return Object.entries(filters).every(([key, value]) => {
        return result.metadata[key] === value;
      });
    });
  }

  /**
   * Deduplicate results
   */
  deduplicate(results: RetrievalResult[]): RetrievalResult[] {
    const seen = new Set<string>();

    return results.filter(result => {
      if (seen.has(result.documentId)) {
        return false;
      }

      seen.add(result.documentId);
      return true;
    });
  }
}
