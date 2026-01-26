/**
 * Framework B - Vector Store
 * Main interface for vector storage and retrieval
 */

import type { DocumentChunk } from '../../types/document.types';
import type { RetrievalResult } from '../../types/rag.types';
import { PineconeClient, type PineconeVector, type PineconeQueryRequest } from './PineconeClient';
import { NamespaceManager } from './namespace-manager';
import { QueryBuilder } from './query-builder';
import { pineconeConfig } from '../../config/pinecone.config';

export interface UpsertDocumentChunksRequest {
  chunks: DocumentChunk[];
  embeddings: number[][];
  namespace?: string;
}

export interface SearchRequest {
  queryEmbedding: number[];
  topK?: number;
  namespace?: string;
  filters?: Record<string, any>;
  minScore?: number;
}

export interface SearchResponse {
  results: RetrievalResult[];
  namespace?: string;
  processingTime: number;
}

export class VectorStore {
  private client: PineconeClient;
  private namespaceManager: NamespaceManager;

  constructor(config = pineconeConfig) {
    this.client = new PineconeClient(config);
    this.namespaceManager = new NamespaceManager(config.namespaces);
  }

  /**
   * Upsert document chunks with embeddings
   */
  async upsertChunks(request: UpsertDocumentChunksRequest): Promise<{ success: boolean; count: number }> {
    const { chunks, embeddings, namespace } = request;

    if (chunks.length !== embeddings.length) {
      throw new Error('Number of chunks must match number of embeddings');
    }

    // Build Pinecone vectors
    const vectors: PineconeVector[] = chunks.map((chunk, index) => ({
      id: chunk.id,
      values: embeddings[index],
      metadata: {
        documentId: chunk.documentId,
        content: chunk.content,
        position: chunk.position,
        totalChunks: chunk.totalChunks,
        ...chunk.metadata,
      },
    }));

    // Upsert in batches of 100 (Pinecone recommendation)
    const batchSize = 100;
    let totalUpserted = 0;

    for (let i = 0; i < vectors.length; i += batchSize) {
      const batch = vectors.slice(i, i + batchSize);

      await this.client.upsert({
        vectors: batch,
        namespace,
      });

      totalUpserted += batch.length;
    }

    return {
      success: true,
      count: totalUpserted,
    };
  }

  /**
   * Search for similar vectors
   */
  async search(request: SearchRequest): Promise<SearchResponse> {
    const startTime = Date.now();

    const queryRequest: PineconeQueryRequest = {
      vector: request.queryEmbedding,
      topK: request.topK || 5,
      namespace: request.namespace,
      filter: request.filters,
      includeMetadata: true,
      includeValues: false,
    };

    const response = await this.client.query(queryRequest);

    // Convert to RetrievalResult format
    const results: RetrievalResult[] = response.matches
      .filter(match => !request.minScore || match.score >= request.minScore)
      .map(match => ({
        id: match.id,
        documentId: match.metadata?.documentId || '',
        content: match.metadata?.content || '',
        score: match.score,
        metadata: match.metadata || {},
      }));

    const processingTime = Date.now() - startTime;

    return {
      results,
      namespace: response.namespace,
      processingTime,
    };
  }

  /**
   * Delete document chunks
   */
  async deleteChunks(chunkIds: string[], namespace?: string): Promise<void> {
    await this.client.delete(chunkIds, namespace);
  }

  /**
   * Delete all chunks for a document
   */
  async deleteDocument(documentId: string, namespace?: string): Promise<void> {
    // Query to find all chunks for this document
    const filter = new QueryBuilder().equals('documentId', documentId).build();

    // Since Pinecone doesn't have a direct "delete by filter" we need to:
    // 1. Query for all matching IDs
    // 2. Delete by IDs
    // For now, this is a limitation - in production you'd maintain a mapping

    // Alternative: use metadata filtering in delete (if supported by your Pinecone plan)
    console.warn('deleteDocument: Consider maintaining a chunk ID mapping for efficient deletion');

    // Placeholder - would need to fetch IDs first
    throw new Error('deleteDocument requires fetching chunk IDs first - not implemented');
  }

  /**
   * Delete all vectors in a namespace
   */
  async deleteNamespace(namespace: string): Promise<void> {
    await this.client.deleteAll(namespace);
  }

  /**
   * Get index statistics
   */
  async getStats(namespace?: string): Promise<any> {
    const filter = namespace ? { namespace } : undefined;
    return await this.client.describeIndexStats(filter);
  }

  /**
   * Test connection to Pinecone
   */
  async testConnection(): Promise<boolean> {
    return await this.client.testConnection();
  }

  /**
   * Get namespace for a context
   */
  getNamespace(context: {
    projectId?: string;
    supplierId?: string;
    dealId?: string;
    category?: string;
  }): string {
    if (context.projectId) {
      return this.namespaceManager.forProject(context.projectId);
    }

    if (context.supplierId) {
      return this.namespaceManager.forSupplier(context.supplierId);
    }

    if (context.dealId) {
      return this.namespaceManager.forDeal(context.dealId);
    }

    if (context.category) {
      return this.namespaceManager.get(context.category);
    }

    return this.namespaceManager.get('general');
  }

  /**
   * Build query with filters
   */
  buildQuery(): QueryBuilder {
    return new QueryBuilder();
  }

  /**
   * Upsert a single vector
   */
  async upsertVector(
    id: string,
    embedding: number[],
    metadata: Record<string, any>,
    namespace?: string
  ): Promise<void> {
    await this.client.upsert({
      vectors: [{ id, values: embedding, metadata }],
      namespace,
    });
  }

  /**
   * Fetch vectors by IDs
   */
  async fetchVectors(ids: string[], namespace?: string): Promise<Record<string, PineconeVector>> {
    return await this.client.fetch(ids, namespace);
  }
}
