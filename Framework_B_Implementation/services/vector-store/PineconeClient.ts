/**
 * Framework B - Pinecone Client
 * Wrapper for Pinecone vector database operations
 */

import type { PineconeConfig } from '../../config/pinecone.config';

export interface PineconeVector {
  id: string;
  values: number[];
  metadata?: Record<string, any>;
}

export interface PineconeQueryResult {
  id: string;
  score: number;
  values?: number[];
  metadata?: Record<string, any>;
}

export interface PineconeQueryResponse {
  matches: PineconeQueryResult[];
  namespace?: string;
}

export interface PineconeUpsertRequest {
  vectors: PineconeVector[];
  namespace?: string;
}

export interface PineconeQueryRequest {
  vector: number[];
  topK: number;
  namespace?: string;
  filter?: Record<string, any>;
  includeValues?: boolean;
  includeMetadata?: boolean;
}

export class PineconeClient {
  private config: PineconeConfig;
  private baseUrl: string | null = null;
  private hostPromise: Promise<string> | null = null;

  constructor(config: PineconeConfig) {
    if (!config.apiKey) {
      throw new Error('Pinecone API key is required');
    }
    if (!config.indexName) {
      throw new Error('Pinecone index name is required');
    }

    this.config = config;
  }

  /**
   * Get the index host URL (fetches it if not cached)
   */
  private async getHost(): Promise<string> {
    if (this.baseUrl) {
      return this.baseUrl;
    }

    // If host is provided in config, use it directly
    if (this.config.host) {
      this.baseUrl = `https://${this.config.host}`;
      return this.baseUrl;
    }

    // Prevent multiple concurrent fetches
    if (this.hostPromise) {
      return await this.hostPromise;
    }

    this.hostPromise = (async () => {
      try {
        const response = await fetch(`https://api.pinecone.io/indexes/${this.config.indexName}`, {
          method: 'GET',
          headers: {
            'Api-Key': this.config.apiKey,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to get index info: ${response.statusText}`);
        }

        const data = await response.json();
        this.baseUrl = `https://${data.host}`;
        return this.baseUrl;
      } finally {
        this.hostPromise = null;
      }
    })();

    return await this.hostPromise;
  }

  /**
   * Upsert vectors to Pinecone
   */
  async upsert(request: PineconeUpsertRequest): Promise<{ upsertedCount: number }> {
    const baseUrl = await this.getHost();
    const url = `${baseUrl}/vectors/upsert`;

    const body: any = {
      vectors: request.vectors,
    };

    if (request.namespace) {
      body.namespace = request.namespace;
    }

    try {
      const response = await this.makeRequest(url, {
        method: 'POST',
        body: JSON.stringify(body),
      });

      return {
        upsertedCount: request.vectors.length,
      };
    } catch (error) {
      console.error('Pinecone upsert error:', error);
      throw new Error(`Failed to upsert vectors: ${(error as Error).message}`);
    }
  }

  /**
   * Query vectors from Pinecone
   */
  async query(request: PineconeQueryRequest): Promise<PineconeQueryResponse> {
    const baseUrl = await this.getHost();
    const url = `${baseUrl}/query`;

    const body: any = {
      vector: request.vector,
      topK: request.topK,
      includeValues: request.includeValues || false,
      includeMetadata: request.includeMetadata !== false, // Default true
    };

    if (request.namespace) {
      body.namespace = request.namespace;
    }

    if (request.filter) {
      body.filter = request.filter;
    }

    try {
      const response = await this.makeRequest(url, {
        method: 'POST',
        body: JSON.stringify(body),
      });

      return {
        matches: response.matches || [],
        namespace: request.namespace,
      };
    } catch (error) {
      console.error('Pinecone query error:', error);
      throw new Error(`Failed to query vectors: ${(error as Error).message}`);
    }
  }

  /**
   * Delete vectors by IDs
   */
  async delete(ids: string[], namespace?: string): Promise<void> {
    const baseUrl = await this.getHost();
    const url = `${baseUrl}/vectors/delete`;

    const body: any = {
      ids,
    };

    if (namespace) {
      body.namespace = namespace;
    }

    try {
      await this.makeRequest(url, {
        method: 'POST',
        body: JSON.stringify(body),
      });
    } catch (error) {
      console.error('Pinecone delete error:', error);
      throw new Error(`Failed to delete vectors: ${(error as Error).message}`);
    }
  }

  /**
   * Fetch vectors by IDs
   */
  async fetch(ids: string[], namespace?: string): Promise<Record<string, PineconeVector>> {
    const baseUrl = await this.getHost();
    const url = `${baseUrl}/vectors/fetch`;

    const params = new URLSearchParams({
      ids: ids.join(','),
    });

    if (namespace) {
      params.append('namespace', namespace);
    }

    try {
      const response = await this.makeRequest(`${url}?${params.toString()}`, {
        method: 'GET',
      });

      return response.vectors || {};
    } catch (error) {
      console.error('Pinecone fetch error:', error);
      throw new Error(`Failed to fetch vectors: ${(error as Error).message}`);
    }
  }

  /**
   * Get index stats
   */
  async describeIndexStats(filter?: Record<string, any>): Promise<any> {
    const baseUrl = await this.getHost();
    const url = `${baseUrl}/describe_index_stats`;

    const body = filter ? { filter } : {};

    try {
      const response = await this.makeRequest(url, {
        method: 'POST',
        body: JSON.stringify(body),
      });

      return response;
    } catch (error) {
      console.error('Pinecone stats error:', error);
      throw new Error(`Failed to get index stats: ${(error as Error).message}`);
    }
  }

  /**
   * Delete all vectors in a namespace
   */
  async deleteAll(namespace: string): Promise<void> {
    const baseUrl = await this.getHost();
    const url = `${baseUrl}/vectors/delete`;

    const body: any = {
      deleteAll: true,
      namespace,
    };

    try {
      await this.makeRequest(url, {
        method: 'POST',
        body: JSON.stringify(body),
      });
    } catch (error) {
      console.error('Pinecone delete all error:', error);
      throw new Error(`Failed to delete all vectors: ${(error as Error).message}`);
    }
  }

  /**
   * Make authenticated request to Pinecone
   */
  private async makeRequest(url: string, options: RequestInit): Promise<any> {
    const headers: Record<string, string> = {
      'Api-Key': this.config.apiKey,
      'Content-Type': 'application/json',
    };

    const response = await fetch(url, {
      ...options,
      headers: {
        ...headers,
        ...(options.headers || {}),
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Pinecone API error response:', JSON.stringify(errorData, null, 2));
      throw new Error(
        errorData.message ||
        `Pinecone API error: ${response.status} ${response.statusText}`
      );
    }

    // Some endpoints return empty responses
    const text = await response.text();
    return text ? JSON.parse(text) : {};
  }

  /**
   * Test connection to Pinecone
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.describeIndexStats();
      return true;
    } catch (error) {
      console.error('Pinecone connection test failed:', error);
      return false;
    }
  }
}
