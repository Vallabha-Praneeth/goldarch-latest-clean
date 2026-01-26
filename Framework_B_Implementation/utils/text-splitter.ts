/**
 * Framework B - Text Splitter Utility
 * Utilities for splitting text into chunks
 */

import type { ChunkingConfig, DocumentChunk } from '../types/document.types';

export class TextSplitter {
  private config: ChunkingConfig;

  constructor(config: ChunkingConfig) {
    this.config = config;
  }

  /**
   * Split text into chunks based on configuration
   */
  split(text: string, documentId: string, metadata: any = {}): DocumentChunk[] {
    switch (this.config.strategy) {
      case 'fixed-size':
        return this.fixedSizeSplit(text, documentId, metadata);
      case 'sentence-boundary':
        return this.sentenceBoundarySplit(text, documentId, metadata);
      case 'paragraph':
        return this.paragraphSplit(text, documentId, metadata);
      case 'recursive':
        return this.recursiveSplit(text, documentId, metadata);
      case 'semantic':
        // Semantic chunking would require AI, so fall back to sentence boundary
        return this.sentenceBoundarySplit(text, documentId, metadata);
      default:
        return this.fixedSizeSplit(text, documentId, metadata);
    }
  }

  /**
   * Fixed-size chunking
   */
  private fixedSizeSplit(text: string, documentId: string, metadata: any): DocumentChunk[] {
    const chunks: DocumentChunk[] = [];
    const { chunkSize, chunkOverlap } = this.config;
    let position = 0;
    let chunkIndex = 0;

    while (position < text.length) {
      const endPosition = Math.min(position + chunkSize, text.length);
      const chunkContent = text.substring(position, endPosition);

      if (chunkContent.trim().length >= (this.config.minChunkSize || 50)) {
        chunks.push(this.createChunk(
          chunkContent,
          documentId,
          chunkIndex,
          position,
          endPosition,
          metadata
        ));
        chunkIndex++;
      }

      position += chunkSize - chunkOverlap;
    }

    return this.updateTotalChunks(chunks);
  }

  /**
   * Sentence boundary chunking
   */
  private sentenceBoundarySplit(text: string, documentId: string, metadata: any): DocumentChunk[] {
    const chunks: DocumentChunk[] = [];
    const { chunkSize, chunkOverlap } = this.config;

    // Split into sentences
    const sentences = this.splitIntoSentences(text);
    let currentChunk = '';
    let chunkIndex = 0;
    let startPosition = 0;

    for (let i = 0; i < sentences.length; i++) {
      const sentence = sentences[i];

      if ((currentChunk + sentence).length > chunkSize && currentChunk.length > 0) {
        // Save current chunk
        chunks.push(this.createChunk(
          currentChunk.trim(),
          documentId,
          chunkIndex,
          startPosition,
          startPosition + currentChunk.length,
          metadata
        ));
        chunkIndex++;

        // Start new chunk with overlap
        const overlapText = this.getOverlapText(currentChunk, chunkOverlap);
        currentChunk = overlapText + sentence;
        startPosition += currentChunk.length - overlapText.length;
      } else {
        currentChunk += sentence;
      }
    }

    // Add remaining chunk
    if (currentChunk.trim().length >= (this.config.minChunkSize || 50)) {
      chunks.push(this.createChunk(
        currentChunk.trim(),
        documentId,
        chunkIndex,
        startPosition,
        startPosition + currentChunk.length,
        metadata
      ));
    }

    return this.updateTotalChunks(chunks);
  }

  /**
   * Paragraph-based chunking
   */
  private paragraphSplit(text: string, documentId: string, metadata: any): DocumentChunk[] {
    const chunks: DocumentChunk[] = [];
    const { chunkSize, chunkOverlap } = this.config;

    // Split into paragraphs
    const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);
    let currentChunk = '';
    let chunkIndex = 0;
    let startPosition = 0;

    for (const paragraph of paragraphs) {
      if ((currentChunk + paragraph).length > chunkSize && currentChunk.length > 0) {
        // Save current chunk
        chunks.push(this.createChunk(
          currentChunk.trim(),
          documentId,
          chunkIndex,
          startPosition,
          startPosition + currentChunk.length,
          metadata
        ));
        chunkIndex++;

        // Start new chunk with overlap
        const overlapText = this.getOverlapText(currentChunk, chunkOverlap);
        currentChunk = overlapText + '\n\n' + paragraph;
        startPosition += currentChunk.length - overlapText.length;
      } else {
        if (currentChunk.length > 0) {
          currentChunk += '\n\n';
        }
        currentChunk += paragraph;
      }
    }

    // Add remaining chunk
    if (currentChunk.trim().length >= (this.config.minChunkSize || 50)) {
      chunks.push(this.createChunk(
        currentChunk.trim(),
        documentId,
        chunkIndex,
        startPosition,
        startPosition + currentChunk.length,
        metadata
      ));
    }

    return this.updateTotalChunks(chunks);
  }

  /**
   * Recursive chunking (character-based with multiple separators)
   */
  private recursiveSplit(text: string, documentId: string, metadata: any): DocumentChunk[] {
    const separators = ['\n\n', '\n', '. ', ' ', ''];
    return this.recursiveSplitHelper(text, documentId, metadata, separators, 0);
  }

  private recursiveSplitHelper(
    text: string,
    documentId: string,
    metadata: any,
    separators: string[],
    depth: number
  ): DocumentChunk[] {
    const chunks: DocumentChunk[] = [];
    const { chunkSize, chunkOverlap } = this.config;

    if (text.length <= chunkSize) {
      if (text.trim().length >= (this.config.minChunkSize || 50)) {
        chunks.push(this.createChunk(text, documentId, 0, 0, text.length, metadata));
      }
      return this.updateTotalChunks(chunks);
    }

    const separator = separators[Math.min(depth, separators.length - 1)];
    const splits = text.split(separator);

    let currentChunk = '';
    let chunkIndex = 0;
    let startPosition = 0;

    for (const split of splits) {
      if ((currentChunk + separator + split).length > chunkSize && currentChunk.length > 0) {
        chunks.push(this.createChunk(
          currentChunk.trim(),
          documentId,
          chunkIndex,
          startPosition,
          startPosition + currentChunk.length,
          metadata
        ));
        chunkIndex++;

        const overlapText = this.getOverlapText(currentChunk, chunkOverlap);
        currentChunk = overlapText + split;
        startPosition += currentChunk.length - overlapText.length;
      } else {
        if (currentChunk.length > 0) {
          currentChunk += separator;
        }
        currentChunk += split;
      }
    }

    if (currentChunk.trim().length >= (this.config.minChunkSize || 50)) {
      chunks.push(this.createChunk(
        currentChunk.trim(),
        documentId,
        chunkIndex,
        startPosition,
        startPosition + currentChunk.length,
        metadata
      ));
    }

    return this.updateTotalChunks(chunks);
  }

  /**
   * Helper: Split text into sentences
   */
  private splitIntoSentences(text: string): string[] {
    // Simple sentence splitting (can be improved with NLP)
    return text.match(/[^.!?]+[.!?]+/g) || [text];
  }

  /**
   * Helper: Get overlap text from end of chunk
   */
  private getOverlapText(text: string, overlapSize: number): string {
    if (overlapSize === 0 || text.length <= overlapSize) {
      return '';
    }
    return text.substring(text.length - overlapSize);
  }

  /**
   * Helper: Create chunk object
   */
  private createChunk(
    content: string,
    documentId: string,
    chunkIndex: number,
    startPosition: number,
    endPosition: number,
    metadata: any
  ): DocumentChunk {
    return {
      id: `${documentId}-chunk-${chunkIndex}`,
      documentId,
      content: content.trim(),
      position: chunkIndex,
      totalChunks: 0, // Will be updated later
      metadata: {
        ...metadata,
        chunkIndex,
        startPosition,
        endPosition,
      },
    };
  }

  /**
   * Helper: Update total chunks count
   */
  private updateTotalChunks(chunks: DocumentChunk[]): DocumentChunk[] {
    const total = chunks.length;
    return chunks.map(chunk => ({
      ...chunk,
      totalChunks: total,
    }));
  }
}

/**
 * Create default chunking config
 */
export function createDefaultChunkingConfig(): ChunkingConfig {
  return {
    chunkSize: 1000,
    chunkOverlap: 200,
    strategy: 'recursive',
    preserveFormatting: true,
    minChunkSize: 50,
    maxChunkSize: 2000,
  };
}
