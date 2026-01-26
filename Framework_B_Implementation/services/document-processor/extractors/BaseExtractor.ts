/**
 * Framework B - Base Document Extractor
 * Interface for document text extraction
 */

import type { DocumentFormat, DocumentMetadata } from '../../../types/document.types';

export interface ExtractionResult {
  content: string;
  metadata: Partial<DocumentMetadata>;
  pageCount?: number;
  wordCount?: number;
  extractionTime: number;
}

export interface ExtractorConfig {
  preserveFormatting?: boolean;
  extractImages?: boolean;
  maxPages?: number;
  timeout?: number;
}

export abstract class BaseExtractor {
  protected config: ExtractorConfig;

  constructor(config: ExtractorConfig = {}) {
    this.config = {
      preserveFormatting: true,
      extractImages: false,
      maxPages: undefined,
      timeout: 30000, // 30 seconds
      ...config,
    };
  }

  /**
   * Extract text from file
   */
  abstract extract(file: File | Buffer | string): Promise<ExtractionResult>;

  /**
   * Check if this extractor supports the file format
   */
  abstract supports(format: DocumentFormat): boolean;

  /**
   * Validate file before extraction
   */
  protected validateFile(file: File | Buffer | string): void {
    if (!file) {
      throw new Error('File is required for extraction');
    }

    // Check file size for File objects
    if (file instanceof File) {
      const maxSize = 50 * 1024 * 1024; // 50MB
      if (file.size > maxSize) {
        throw new Error(`File size exceeds maximum allowed size (${maxSize / 1024 / 1024}MB)`);
      }

      if (file.size === 0) {
        throw new Error('File is empty');
      }
    }
  }

  /**
   * Count words in text
   */
  protected countWords(text: string): number {
    return text.split(/\s+/).filter(word => word.length > 0).length;
  }

  /**
   * Clean extracted text
   */
  protected cleanText(text: string): string {
    return text
      // Remove excessive whitespace
      .replace(/\s+/g, ' ')
      // Remove null bytes
      .replace(/\0/g, '')
      // Normalize line breaks
      .replace(/\r\n/g, '\n')
      // Remove excessive line breaks
      .replace(/\n{3,}/g, '\n\n')
      // Trim
      .trim();
  }

  /**
   * Extract basic metadata from File object
   */
  protected extractFileMetadata(file: File): Partial<DocumentMetadata> {
    return {
      filename: file.name,
      mimeType: file.type,
      size: file.size,
      uploadedAt: new Date().toISOString(),
    };
  }
}
