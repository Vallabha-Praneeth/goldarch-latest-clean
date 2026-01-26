/**
 * Framework B - Document Types
 * Type definitions for document processing
 */

export type DocumentFormat = 'pdf' | 'docx' | 'txt' | 'gdoc' | 'html' | 'md';

export type DocumentSource = 'upload' | 'google-drive' | 'supabase-storage' | 'url';

export interface DocumentMetadata {
  /** Unique identifier for the document */
  id?: string;
  /** Document filename */
  filename: string;
  /** File format/extension */
  format: DocumentFormat;
  /** Source of the document */
  source: DocumentSource;
  /** File size in bytes */
  size?: number;
  /** MIME type */
  mimeType?: string;
  /** Upload/creation timestamp */
  uploadedAt?: string;
  /** Last modified timestamp */
  modifiedAt?: string;
  /** User who uploaded the document */
  uploadedBy?: string;
  /** Associated project ID (if applicable) */
  projectId?: string;
  /** Associated supplier ID (if applicable) */
  supplierId?: string;
  /** Custom tags */
  tags?: string[];
  /** Additional custom metadata */
  custom?: Record<string, any>;
}

export interface Document {
  /** Document metadata */
  metadata: DocumentMetadata;
  /** Raw text content extracted from the document */
  content: string;
  /** URL or path to the original file */
  url?: string;
  /** Processing status */
  status: DocumentStatus;
  /** Error message if processing failed */
  error?: string;
}

export type DocumentStatus =
  | 'pending'        // Awaiting processing
  | 'processing'     // Currently being processed
  | 'chunking'       // Being split into chunks
  | 'embedding'      // Generating embeddings
  | 'indexing'       // Being indexed in vector store
  | 'completed'      // Successfully processed and indexed
  | 'failed';        // Processing failed

export interface DocumentChunk {
  /** Unique identifier for the chunk */
  id: string;
  /** Reference to parent document */
  documentId: string;
  /** Chunk content */
  content: string;
  /** Chunk position in the original document */
  position: number;
  /** Total number of chunks in the document */
  totalChunks: number;
  /** Metadata inherited from document + chunk-specific */
  metadata: DocumentMetadata & {
    chunkIndex: number;
    startPosition?: number;
    endPosition?: number;
  };
}

export interface ProcessDocumentRequest {
  /** File to process (browser File object or path) */
  file: File | string;
  /** Document metadata */
  metadata?: Partial<DocumentMetadata>;
  /** Pinecone namespace for organizing vectors */
  namespace?: string;
  /** Custom chunking configuration */
  chunkingConfig?: ChunkingConfig;
}

export interface ProcessDocumentResponse {
  /** Processing success status */
  success: boolean;
  /** Document ID */
  documentId: string;
  /** Number of chunks created */
  chunksCreated: number;
  /** Number of vectors indexed */
  vectorsIndexed: number;
  /** Processing time in milliseconds */
  processingTime: number;
  /** Error message if failed */
  error?: string;
}

export interface ChunkingConfig {
  /** Size of each chunk in characters */
  chunkSize: number;
  /** Overlap between chunks in characters */
  chunkOverlap: number;
  /** Strategy for chunking */
  strategy: ChunkingStrategy;
  /** Preserve formatting (paragraphs, sections) */
  preserveFormatting?: boolean;
  /** Minimum chunk size */
  minChunkSize?: number;
  /** Maximum chunk size */
  maxChunkSize?: number;
}

export type ChunkingStrategy =
  | 'fixed-size'           // Fixed character count
  | 'sentence-boundary'    // Split at sentence boundaries
  | 'paragraph'            // Split by paragraphs
  | 'semantic'             // Semantic chunking (topic-based)
  | 'recursive';           // Recursive character text splitting

export interface DocumentProcessorConfig {
  /** Default chunking configuration */
  defaultChunking: ChunkingConfig;
  /** Supported file formats */
  supportedFormats: DocumentFormat[];
  /** Maximum file size in bytes (default: 10MB) */
  maxFileSize: number;
  /** Enable metadata extraction */
  extractMetadata: boolean;
  /** Temporary directory for processing */
  tempDir?: string;
}
