/**
 * Framework B - useDocumentProcessor Hook
 * React hook for processing and indexing documents
 */

'use client';

import { useState, useCallback } from 'react';
import type {
  ProcessDocumentRequest,
  ProcessDocumentResponse,
  DocumentStatus,
} from '../types/document.types';

interface UseDocumentProcessorReturn {
  /** Process a document */
  processDocument: (request: ProcessDocumentRequest) => Promise<ProcessDocumentResponse>;
  /** Current processing status */
  status: DocumentStatus | null;
  /** Processing progress (0-100) */
  progress: number;
  /** Whether processing is in progress */
  isProcessing: boolean;
  /** Error message if failed */
  error: string | null;
  /** Reset state */
  reset: () => void;
}

export function useDocumentProcessor(): UseDocumentProcessorReturn {
  const [status, setStatus] = useState<DocumentStatus | null>(null);
  const [progress, setProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processDocument = useCallback(async (
    request: ProcessDocumentRequest
  ): Promise<ProcessDocumentResponse> => {
    setIsProcessing(true);
    setError(null);
    setProgress(0);
    setStatus('pending');

    try {
      // Prepare form data
      const formData = new FormData();

      if (request.file instanceof File) {
        formData.append('file', request.file);
      } else {
        formData.append('fileUrl', request.file);
      }

      if (request.metadata) {
        formData.append('metadata', JSON.stringify(request.metadata));
      }

      if (request.namespace) {
        formData.append('namespace', request.namespace);
      }

      if (request.chunkingConfig) {
        formData.append('chunkingConfig', JSON.stringify(request.chunkingConfig));
      }

      setStatus('processing');
      setProgress(10);

      // Call Framework B API
      const response = await fetch('/api/framework-b/documents/process', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(errorData.error || 'Failed to process document');
      }

      setProgress(50);
      setStatus('chunking');

      const result: ProcessDocumentResponse = await response.json();

      setProgress(100);
      setStatus('completed');
      setIsProcessing(false);

      return result;
    } catch (err: any) {
      const errorMessage = err.message || 'Unknown error occurred';
      setError(errorMessage);
      setStatus('failed');
      setIsProcessing(false);
      setProgress(0);

      return {
        success: false,
        documentId: '',
        chunksCreated: 0,
        vectorsIndexed: 0,
        processingTime: 0,
        error: errorMessage,
      };
    }
  }, []);

  const reset = useCallback(() => {
    setStatus(null);
    setProgress(0);
    setIsProcessing(false);
    setError(null);
  }, []);

  return {
    processDocument,
    status,
    progress,
    isProcessing,
    error,
    reset,
  };
}
