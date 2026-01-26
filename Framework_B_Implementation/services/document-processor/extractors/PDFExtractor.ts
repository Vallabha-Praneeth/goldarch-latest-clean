/**
 * Framework B - PDF Document Extractor
 * Extract text from PDF files
 *
 * Supports multiple PDF libraries:
 * - pdf-parse (Node.js)
 * - pdfjs-dist (Browser/Node.js)
 */

import type { DocumentFormat } from '../../../types/document.types';
import { BaseExtractor, type ExtractionResult, type ExtractorConfig } from './BaseExtractor';

export class PDFExtractor extends BaseExtractor {
  constructor(config?: ExtractorConfig) {
    super(config);
  }

  supports(format: DocumentFormat): boolean {
    return format === 'pdf';
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
        throw new Error('Unsupported file type for PDF extraction');
      }

      // Try to extract using available PDF library
      const result = await this.extractWithAvailableLibrary(buffer);

      // Clean the content
      const cleanedContent = this.cleanText(result.text);

      if (cleanedContent.length === 0) {
        throw new Error('No text content extracted from PDF');
      }

      const wordCount = this.countWords(cleanedContent);

      return {
        content: cleanedContent,
        metadata: {
          ...metadata,
          format: 'pdf',
        },
        pageCount: result.pageCount,
        wordCount,
        extractionTime: Date.now() - startTime,
      };
    } catch (error) {
      throw new Error(`PDF extraction failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Extract PDF text using available library
   */
  private async extractWithAvailableLibrary(buffer: Buffer): Promise<{ text: string; pageCount: number }> {
    // Try pdf-parse first (most common Node.js library)
    try {
      return await this.extractWithPdfParse(buffer);
    } catch (error) {
      console.warn('pdf-parse not available, trying pdfjs-dist');
    }

    // Try pdfjs-dist
    try {
      return await this.extractWithPdfJs(buffer);
    } catch (error) {
      console.warn('pdfjs-dist not available');
    }

    throw new Error(
      'No PDF library available. Please install either "pdf-parse" or "pdfjs-dist": ' +
      'npm install pdf-parse OR npm install pdfjs-dist'
    );
  }

  /**
   * Extract using pdf-parse library
   */
  private async extractWithPdfParse(buffer: Buffer): Promise<{ text: string; pageCount: number }> {
    try {
      const pdfParse = await import('pdf-parse');
      const data = await pdfParse.default(buffer, {
        max: this.config.maxPages,
      });

      return {
        text: data.text,
        pageCount: data.numpages,
      };
    } catch (error) {
      throw new Error(`pdf-parse extraction failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Extract using pdfjs-dist library
   */
  private async extractWithPdfJs(buffer: Buffer): Promise<{ text: string; pageCount: number }> {
    try {
      const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');

      // Load PDF document
      const loadingTask = pdfjsLib.getDocument({
        data: new Uint8Array(buffer),
      });

      const pdf = await loadingTask.promise;
      const pageCount = pdf.numPages;
      const maxPages = this.config.maxPages || pageCount;
      const pagesToProcess = Math.min(pageCount, maxPages);

      // Extract text from each page
      const textPages: string[] = [];

      for (let i = 1; i <= pagesToProcess; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');
        textPages.push(pageText);
      }

      return {
        text: textPages.join('\n\n'),
        pageCount,
      };
    } catch (error) {
      throw new Error(`pdfjs-dist extraction failed: ${error instanceof Error ? error.message : String(error)}`);
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
      throw new Error(`Failed to read PDF from path: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Validate PDF buffer
   */
  private validatePDFBuffer(buffer: Buffer): void {
    // Check PDF signature
    const signature = buffer.slice(0, 5).toString('utf-8');
    if (signature !== '%PDF-') {
      throw new Error('Invalid PDF file: missing PDF signature');
    }
  }
}
