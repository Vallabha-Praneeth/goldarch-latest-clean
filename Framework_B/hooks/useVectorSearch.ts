/**
 * Framework B - useVectorSearch Hook
 * React hook for semantic vector search
 */

'use client';

import { useState, useCallback } from 'react';
import type { RetrievalResult } from '../types/rag.types';

interface VectorSearchRequest {
  /** Search query */
  query: string;
  /** Filters to apply */
  filters?: {
    projectId?: string;
    supplierId?: string;
    tags?: string[];
    dateFrom?: string;
    dateTo?: string;
    [key: string]: any;
  };
  /** Number of results to return */
  topK?: number;
  /** Minimum similarity score (0-1) */
  minScore?: number;
  /** Pinecone namespace */
  namespace?: string;
}

interface VectorSearchResponse {
  /** Search results */
  results: RetrievalResult[];
  /** Query used */
  query: string;
  /** Processing time in ms */
  processingTime: number;
}

interface UseVectorSearchReturn {
  /** Perform semantic search */
  search: (request: VectorSearchRequest) => Promise<VectorSearchResponse>;
  /** Search results */
  results: RetrievalResult[];
  /** Whether a search is in progress */
  isSearching: boolean;
  /** Error message if failed */
  error: string | null;
  /** Clear results */
  clearResults: () => void;
}

export function useVectorSearch(): UseVectorSearchReturn {
  const [results, setResults] = useState<RetrievalResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (
    request: VectorSearchRequest
  ): Promise<VectorSearchResponse> => {
    setIsSearching(true);
    setError(null);

    try {
      // Call Framework B API
      const response = await fetch('/api/framework-b/search/vector', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(errorData.error || 'Failed to perform search');
      }

      const result: VectorSearchResponse = await response.json();

      setResults(result.results);
      setIsSearching(false);

      return result;
    } catch (err: any) {
      const errorMessage = err.message || 'Unknown error occurred';
      setError(errorMessage);
      setIsSearching(false);
      setResults([]);
      throw err;
    }
  }, []);

  const clearResults = useCallback(() => {
    setResults([]);
    setError(null);
  }, []);

  return {
    search,
    results,
    isSearching,
    error,
    clearResults,
  };
}
