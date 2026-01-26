/**
 * Framework B - DOCX Document Extractor
 * Extract text from Microsoft Word documents
 *
 * Supports:
 * - mammoth (recommended - converts to clean HTML/text)
 * - docxtemplater (alternative)
 */

import type { DocumentFormat } from '../../../types/document.types';
import { BaseExtractor, type ExtractionResult, type ExtractorConfig } from './BaseExtractor';

export class DOCXExtractor extends BaseExtractor {
  constructor(config?: ExtractorConfig) {
    super(config);
  }

  supports(format: DocumentFormat): boolean {
    return format === 'docx';
  }

  async extract(file: File | Buffer | string): Promise<ExtractionResult> {
    const startTime = Date.now();

    try {
      this.validateFile(file);

      let buffer: Buffer;
      let metadata: any = {};

      if (file instanceof File) {
        // Browser File object
        buffer = Buffer.from(await file.arrayBuffer());
        metadata = this.extractFileMetadata(file);
      } else if (Buffer.isBuffer(file)) {
        // Node.js Buffer
        buffer = file;
      } else if (typeof file === 'string') {
        // File path
        buffer = await this.readFileFromPath(file);
      } else {
        throw new Error('Unsupported file type for DOCX extraction');
      }

      // Extract text using available library
      const text = await this.extractWithAvailableLibrary(buffer);

      // Clean the content
      const cleanedContent = this.cleanText(text);

      if (cleanedContent.length === 0) {
        throw new Error('No text content extracted from DOCX');
      }

      const wordCount = this.countWords(cleanedContent);

      return {
        content: cleanedContent,
        metadata: {
          ...metadata,
          format: 'docx',
        },
        wordCount,
        extractionTime: Date.now() - startTime,
      };
    } catch (error) {
      throw new Error(`DOCX extraction failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Extract DOCX text using available library
   */
  private async extractWithAvailableLibrary(buffer: Buffer): Promise<string> {
    // Try mammoth first (best for clean text extraction)
    try {
      return await this.extractWithMammoth(buffer);
    } catch (error) {
      console.warn('mammoth not available, trying alternative methods');
    }

    // Try pizzip + docxtemplater
    try {
      return await this.extractWithDocxtemplater(buffer);
    } catch (error) {
      console.warn('docxtemplater not available');
    }

    throw new Error(
      'No DOCX library available. Please install "mammoth": npm install mammoth'
    );
  }

  /**
   * Extract using mammoth library (recommended)
   */
  private async extractWithMammoth(buffer: Buffer): Promise<string> {
    try {
      const mammoth = await import('mammoth');

      const result = await mammoth.extractRawText({
        buffer,
      });

      if (result.messages && result.messages.length > 0) {
        console.warn('Mammoth warnings:', result.messages);
      }

      return result.value;
    } catch (error) {
      throw new Error(`Mammoth extraction failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Extract using docxtemplater + pizzip
   */
  private async extractWithDocxtemplater(buffer: Buffer): Promise<string> {
    try {
      const PizZip = await import('pizzip');
      const Docxtemplater = await import('docxtemplater');

      const zip = new PizZip.default(buffer);
      const doc = new Docxtemplater.default(zip, {
        paragraphLoop: true,
        linebreaks: true,
      });

      // Get full text from the document
      const text = doc.getFullText();

      return text;
    } catch (error) {
      throw new Error(`Docxtemplater extraction failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Read file from file system path (Node.js only)
   */
  private async readFileFromPath(path: string): Promise<Buffer> {
    try {
      const fs = await import('fs/promises');
      return await fs.readFile(path);
    } catch (error) {
      throw new Error(`Failed to read DOCX from path: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Validate DOCX buffer
   */
  private validateDOCXBuffer(buffer: Buffer): void {
    // DOCX files are ZIP archives
    // Check for ZIP signature (PK\x03\x04)
    const signature = buffer.slice(0, 4);
    if (signature[0] !== 0x50 || signature[1] !== 0x4b || signature[2] !== 0x03 || signature[3] !== 0x04) {
      throw new Error('Invalid DOCX file: not a valid ZIP archive');
    }
  }

  /**
   * Strip HTML tags from text (if mammoth returns HTML)
   */
  private stripHtmlTags(html: string): string {
    return html
      .replace(/<[^>]*>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");
  }
}
