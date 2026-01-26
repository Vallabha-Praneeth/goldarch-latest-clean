/**
 * Document Indexer - Auto-index documents to Framework B
 */

export interface IndexDocumentParams {
  file: File;
  documentId: string;
  projectId?: string;
  supplierId?: string;
  dealId?: string;
  metadata?: Record<string, any>;
}

export interface IndexDocumentResult {
  success: boolean;
  documentId: string;
  chunksCreated: number;
  vectorsIndexed: number;
  namespace: string;
  error?: string;
}

/**
 * Index a document to Framework B for AI search
 */
export async function indexDocument(
  params: IndexDocumentParams
): Promise<IndexDocumentResult> {
  try {
    const formData = new FormData();
    formData.append('file', params.file);

    if (params.projectId) {
      formData.append('projectId', params.projectId);
    }

    if (params.supplierId) {
      formData.append('supplierId', params.supplierId);
    }

    if (params.dealId) {
      formData.append('dealId', params.dealId);
    }

    if (params.metadata) {
      formData.append('metadata', JSON.stringify(params.metadata));
    }

    const response = await fetch('/api/framework-b/documents/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to index document');
    }

    const data = await response.json();

    return {
      success: true,
      documentId: data.documentId,
      chunksCreated: data.chunksCreated,
      vectorsIndexed: data.vectorsIndexed,
      namespace: data.namespace,
    };
  } catch (error: any) {
    return {
      success: false,
      documentId: params.documentId,
      chunksCreated: 0,
      vectorsIndexed: 0,
      namespace: '',
      error: error.message || 'Failed to index document',
    };
  }
}

/**
 * Check if a file type is supported for indexing
 */
export function isIndexableFileType(filename: string): boolean {
  const supportedExtensions = ['.pdf', '.txt', '.doc', '.docx', '.md'];
  const ext = filename.toLowerCase().substring(filename.lastIndexOf('.'));
  return supportedExtensions.includes(ext);
}

/**
 * Get a user-friendly message for indexing status
 */
export function getIndexingStatusMessage(result: IndexDocumentResult): string {
  if (result.success) {
    return `Document indexed: ${result.chunksCreated} chunks created, ${result.vectorsIndexed} vectors stored`;
  }
  return result.error || 'Failed to index document';
}
