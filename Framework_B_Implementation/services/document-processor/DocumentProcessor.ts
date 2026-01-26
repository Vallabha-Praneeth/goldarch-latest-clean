/**
 * Framework B - Document Processor
 * Main orchestrator for document processing pipeline
 */

import type {
  Document,
  DocumentChunk,
  DocumentFormat,
  DocumentMetadata,
  DocumentProcessorConfig,
  ProcessDocumentRequest,
  ProcessDocumentResponse,
  ChunkingConfig,
} from '../../types/document.types';

import { TextSplitter, createDefaultChunkingConfig } from '../../utils/text-splitter';
import { TXTExtractor, PDFExtractor, DOCXExtractor, BaseExtractor } from './extractors';

export class DocumentProcessor {
  private config: DocumentProcessorConfig;
  private extractors: Map<DocumentFormat, BaseExtractor>;
  private textSplitter: TextSplitter;

  constructor(config?: Partial<DocumentProcessorConfig>) {
    this.config = {
      defaultChunking: createDefaultChunkingConfig(),
      supportedFormats: ['pdf', 'docx', 'txt', 'md', 'html'],
      maxFileSize: 50 * 1024 * 1024, // 50MB
      extractMetadata: true,
      ...config,
    };

    // Initialize extractors
    this.extractors = new Map();
    this.registerExtractor('txt', new TXTExtractor());
    this.registerExtractor('md', new TXTExtractor());
    this.registerExtractor('pdf', new PDFExtractor());
    this.registerExtractor('docx', new DOCXExtractor());

    // Initialize text splitter
    this.textSplitter = new TextSplitter(this.config.defaultChunking);
  }

  /**
   * Process a document: extract text and create chunks
   */
  async processDocument(request: ProcessDocumentRequest): Promise<ProcessDocumentResponse> {
    const startTime = Date.now();

    try {
      // 1. Validate request
      this.validateRequest(request);

      // 2. Detect document format
      const format = await this.detectFormat(request.file, request.metadata);

      // 3. Check if format is supported
      if (!this.isFormatSupported(format)) {
        throw new Error(`Unsupported document format: ${format}`);
      }

      // 4. Extract text from document
      const extraction = await this.extractText(request.file, format);

      // 5. Build complete metadata
      const metadata: DocumentMetadata = {
        id: this.generateDocumentId(),
        filename: request.metadata?.filename || 'unknown',
        format,
        source: request.metadata?.source || 'upload',
        size: extraction.metadata.size,
        uploadedAt: new Date().toISOString(),
        projectId: request.metadata?.projectId,
        supplierId: request.metadata?.supplierId,
        tags: request.metadata?.tags,
        custom: {
          ...request.metadata?.custom,
          pageCount: extraction.pageCount,
          wordCount: extraction.wordCount,
        },
      };

      // 6. Create chunks using TextSplitter
      const chunkingConfig = request.chunkingConfig || this.config.defaultChunking;
      this.textSplitter = new TextSplitter(chunkingConfig);
      const chunks = this.textSplitter.split(extraction.content, metadata.id!, metadata);

      // 7. Create document object
      const document: Document = {
        metadata,
        content: extraction.content,
        status: 'chunking',
        url: request.metadata?.custom?.url,
      };

      const processingTime = Date.now() - startTime;

      return {
        success: true,
        documentId: metadata.id!,
        chunksCreated: chunks.length,
        vectorsIndexed: 0, // Will be set by VectorStore
        processingTime,
      };
    } catch (error) {
      const processingTime = Date.now() - startTime;
      return {
        success: false,
        documentId: '',
        chunksCreated: 0,
        vectorsIndexed: 0,
        processingTime,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Extract text from document and create chunks
   */
  async extractAndChunk(
    file: File | Buffer | string,
    metadata?: Partial<DocumentMetadata>,
    chunkingConfig?: ChunkingConfig
  ): Promise<{
    document: Document;
    chunks: DocumentChunk[];
  }> {
    const response = await this.processDocument({
      file,
      metadata,
      chunkingConfig,
    });

    if (!response.success) {
      throw new Error(response.error || 'Document processing failed');
    }

    // Re-extract to get document and chunks
    const format = await this.detectFormat(file, metadata);
    const extraction = await this.extractText(file, format);

    const fullMetadata: DocumentMetadata = {
      id: response.documentId,
      filename: metadata?.filename || 'unknown',
      format,
      source: metadata?.source || 'upload',
      uploadedAt: new Date().toISOString(),
      ...metadata,
    };

    const config = chunkingConfig || this.config.defaultChunking;
    this.textSplitter = new TextSplitter(config);
    const chunks = this.textSplitter.split(extraction.content, response.documentId, fullMetadata);

    const document: Document = {
      metadata: fullMetadata,
      content: extraction.content,
      status: 'completed',
    };

    return { document, chunks };
  }

  /**
   * Extract text only (no chunking)
   */
  async extractText(file: File | Buffer | string, format?: DocumentFormat) {
    const detectedFormat = format || (await this.detectFormat(file));

    if (!this.isFormatSupported(detectedFormat)) {
      throw new Error(`Unsupported document format: ${detectedFormat}`);
    }

    const extractor = this.extractors.get(detectedFormat);
    if (!extractor) {
      throw new Error(`No extractor available for format: ${detectedFormat}`);
    }

    return await extractor.extract(file);
  }

  /**
   * Register a custom extractor
   */
  registerExtractor(format: DocumentFormat, extractor: BaseExtractor): void {
    this.extractors.set(format, extractor);
  }

  /**
   * Detect document format from file
   */
  private async detectFormat(
    file: File | Buffer | string,
    metadata?: Partial<DocumentMetadata>
  ): Promise<DocumentFormat> {
    // If format is provided in metadata, use it
    if (metadata?.format) {
      return metadata.format;
    }

    // Detect from File object
    if (file instanceof File) {
      return this.detectFormatFromFilename(file.name);
    }

    // Detect from filename in metadata
    if (metadata?.filename) {
      return this.detectFormatFromFilename(metadata.filename);
    }

    // Detect from MIME type
    if (file instanceof File && file.type) {
      return this.detectFormatFromMimeType(file.type);
    }

    // Detect from buffer signature
    if (Buffer.isBuffer(file)) {
      return this.detectFormatFromBuffer(file);
    }

    throw new Error('Unable to detect document format');
  }

  /**
   * Detect format from filename
   */
  private detectFormatFromFilename(filename: string): DocumentFormat {
    const ext = filename.split('.').pop()?.toLowerCase();

    switch (ext) {
      case 'pdf':
        return 'pdf';
      case 'docx':
      case 'doc':
        return 'docx';
      case 'txt':
        return 'txt';
      case 'md':
      case 'markdown':
        return 'md';
      case 'html':
      case 'htm':
        return 'html';
      default:
        throw new Error(`Unsupported file extension: ${ext}`);
    }
  }

  /**
   * Detect format from MIME type
   */
  private detectFormatFromMimeType(mimeType: string): DocumentFormat {
    switch (mimeType) {
      case 'application/pdf':
        return 'pdf';
      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      case 'application/msword':
        return 'docx';
      case 'text/plain':
        return 'txt';
      case 'text/markdown':
        return 'md';
      case 'text/html':
        return 'html';
      default:
        throw new Error(`Unsupported MIME type: ${mimeType}`);
    }
  }

  /**
   * Detect format from buffer signature
   */
  private detectFormatFromBuffer(buffer: Buffer): DocumentFormat {
    // Check PDF signature
    if (buffer.slice(0, 5).toString() === '%PDF-') {
      return 'pdf';
    }

    // Check ZIP signature (DOCX is ZIP-based)
    if (buffer[0] === 0x50 && buffer[1] === 0x4b && buffer[2] === 0x03 && buffer[3] === 0x04) {
      return 'docx';
    }

    // Default to text
    return 'txt';
  }

  /**
   * Check if format is supported
   */
  private isFormatSupported(format: DocumentFormat): boolean {
    return this.config.supportedFormats.includes(format);
  }

  /**
   * Validate process request
   */
  private validateRequest(request: ProcessDocumentRequest): void {
    if (!request.file) {
      throw new Error('File is required');
    }

    // Validate file size for File objects
    if (request.file instanceof File) {
      if (request.file.size > this.config.maxFileSize) {
        throw new Error(
          `File size (${(request.file.size / 1024 / 1024).toFixed(2)}MB) exceeds maximum allowed size (${(this.config.maxFileSize / 1024 / 1024).toFixed(2)}MB)`
        );
      }

      if (request.file.size === 0) {
        throw new Error('File is empty');
      }
    }
  }

  /**
   * Generate unique document ID
   */
  private generateDocumentId(): string {
    return `doc-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * Get supported formats
   */
  getSupportedFormats(): DocumentFormat[] {
    return [...this.config.supportedFormats];
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<DocumentProcessorConfig>): void {
    this.config = {
      ...this.config,
      ...config,
    };

    // Update text splitter if chunking config changed
    if (config.defaultChunking) {
      this.textSplitter = new TextSplitter(config.defaultChunking);
    }
  }
}
