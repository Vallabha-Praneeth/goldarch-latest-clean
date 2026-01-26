/**
 * Framework B - TXT Document Extractor
 * Extract text from plain text files
 */

import type { DocumentFormat } from '../../../types/document.types';
import { BaseExtractor, type ExtractionResult, type ExtractorConfig } from './BaseExtractor';

export class TXTExtractor extends BaseExtractor {
  constructor(config?: ExtractorConfig) {
    super(config);
  }

  supports(format: DocumentFormat): boolean {
    return format === 'txt' || format === 'md';
  }

  async extract(file: File | Buffer | string): Promise<ExtractionResult> {
    const startTime = Date.now();

    try {
      this.validateFile(file);

      let content: string;
      let metadata: any = {};

      if (file instanceof File) {
        // File object (browser or Node.js)
        // In Node.js/Next.js, File has arrayBuffer method
        const arrayBuffer = await file.arrayBuffer();
        content = Buffer.from(arrayBuffer).toString('utf-8');
        metadata = {
          filename: file.name,
          mimeType: file.type,
          size: file.size,
        };
      } else if (Buffer.isBuffer(file)) {
        // Node.js Buffer
        content = file.toString('utf-8');
      } else if (typeof file === 'string') {
        // File path or direct text content
        if (this.isFilePath(file)) {
          content = await this.readFileFromPath(file);
        } else {
          // Direct text content
          content = file;
        }
      } else {
        throw new Error('Unsupported file type for TXT extraction');
      }

      // Clean the content
      const cleanedContent = this.cleanText(content);

      if (cleanedContent.length === 0) {
        throw new Error('No text content extracted from file');
      }

      const wordCount = this.countWords(cleanedContent);

      return {
        content: cleanedContent,
        metadata: {
          ...metadata,
          format: 'txt',
        },
        wordCount,
        extractionTime: Date.now() - startTime,
      };
    } catch (error) {
      throw new Error(`TXT extraction failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Read content from File object
   */
  private async readFileContent(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (event) => {
        const content = event.target?.result;
        if (typeof content === 'string') {
          resolve(content);
        } else {
          reject(new Error('Failed to read file content as text'));
        }
      };

      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };

      reader.readAsText(file);
    });
  }

  /**
   * Check if string is a file path
   */
  private isFilePath(str: string): boolean {
    // Simple heuristic: if it contains path separators and doesn't have line breaks
    return (str.includes('/') || str.includes('\\')) && !str.includes('\n') && str.length < 500;
  }

  /**
   * Read file from file system path (Node.js only)
   */
  private async readFileFromPath(path: string): Promise<string> {
    try {
      // This will work in Node.js environment
      const fs = await import('fs/promises');
      return await fs.readFile(path, 'utf-8');
    } catch (error) {
      throw new Error(`Failed to read file from path: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
