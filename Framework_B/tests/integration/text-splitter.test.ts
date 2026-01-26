/**
 * Framework B - Text Splitter Integration Tests
 *
 * Run with: npm test Framework_B/tests/integration/text-splitter.test.ts
 */

import { TextSplitter, createDefaultChunkingConfig } from '../../utils/text-splitter';
import type { ChunkingConfig } from '../../types/document.types';

describe('TextSplitter', () => {
  describe('Fixed Size Chunking', () => {
    it('should split text into fixed-size chunks', () => {
      const config: ChunkingConfig = {
        chunkSize: 100,
        chunkOverlap: 20,
        strategy: 'fixed-size',
      };

      const splitter = new TextSplitter(config);
      const text = 'A'.repeat(250); // 250 characters
      const documentId = 'test-doc-1';

      const chunks = splitter.split(text, documentId);

      expect(chunks.length).toBeGreaterThan(2);
      expect(chunks[0].content.length).toBeLessThanOrEqual(100);
      expect(chunks[0].documentId).toBe(documentId);
      expect(chunks[0].totalChunks).toBe(chunks.length);
    });

    it('should apply overlap correctly', () => {
      const config: ChunkingConfig = {
        chunkSize: 100,
        chunkOverlap: 20,
        strategy: 'fixed-size',
      };

      const splitter = new TextSplitter(config);
      const text = 'ABCDEFGHIJ'.repeat(30); // 300 characters
      const chunks = splitter.split(text, 'test-doc');

      // Check that chunks overlap
      const chunk1End = chunks[0].content.slice(-20);
      const chunk2Start = chunks[1].content.slice(0, 20);
      expect(chunk1End).toBe(chunk2Start);
    });
  });

  describe('Sentence Boundary Chunking', () => {
    it('should split at sentence boundaries', () => {
      const config: ChunkingConfig = {
        chunkSize: 100,
        chunkOverlap: 10,
        strategy: 'sentence-boundary',
      };

      const splitter = new TextSplitter(config);
      const text = 'First sentence. Second sentence. Third sentence. Fourth sentence. Fifth sentence.';
      const chunks = splitter.split(text, 'test-doc');

      expect(chunks.length).toBeGreaterThan(0);
      chunks.forEach(chunk => {
        // Each chunk should end with punctuation (if not the last)
        const trimmed = chunk.content.trim();
        expect(['.', '!', '?'].some(p => trimmed.endsWith(p))).toBe(true);
      });
    });
  });

  describe('Paragraph Chunking', () => {
    it('should split at paragraph boundaries', () => {
      const config: ChunkingConfig = {
        chunkSize: 150,
        chunkOverlap: 10,
        strategy: 'paragraph',
      };

      const splitter = new TextSplitter(config);
      const text = `First paragraph with some content here.

Second paragraph with different content.

Third paragraph with even more content to make it longer.`;

      const chunks = splitter.split(text, 'test-doc');

      expect(chunks.length).toBeGreaterThan(0);
      // Chunks should preserve paragraph structure
      chunks.forEach(chunk => {
        expect(chunk.content.trim().length).toBeGreaterThan(0);
      });
    });
  });

  describe('Recursive Chunking', () => {
    it('should split using multiple separators', () => {
      const config: ChunkingConfig = {
        chunkSize: 100,
        chunkOverlap: 20,
        strategy: 'recursive',
      };

      const splitter = new TextSplitter(config);
      const text = `This is a long document.

It has multiple paragraphs. Each paragraph has multiple sentences. We want to split it intelligently.

The recursive splitter should handle this well.`;

      const chunks = splitter.split(text, 'test-doc');

      expect(chunks.length).toBeGreaterThan(0);
      chunks.forEach(chunk => {
        expect(chunk.content.length).toBeLessThanOrEqual(100 + 20); // Allow for overlap
        expect(chunk.documentId).toBe('test-doc');
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty text', () => {
      const config = createDefaultChunkingConfig();
      const splitter = new TextSplitter(config);
      const chunks = splitter.split('', 'test-doc');

      expect(chunks.length).toBe(0);
    });

    it('should handle text shorter than chunk size', () => {
      const config: ChunkingConfig = {
        chunkSize: 1000,
        chunkOverlap: 100,
        strategy: 'fixed-size',
      };

      const splitter = new TextSplitter(config);
      const text = 'Short text.';
      const chunks = splitter.split(text, 'test-doc');

      expect(chunks.length).toBe(1);
      expect(chunks[0].content).toBe(text);
    });

    it('should respect minChunkSize', () => {
      const config: ChunkingConfig = {
        chunkSize: 100,
        chunkOverlap: 0,
        strategy: 'fixed-size',
        minChunkSize: 50,
      };

      const splitter = new TextSplitter(config);
      const text = 'A'.repeat(120); // Will create one 100-char chunk and one 20-char chunk
      const chunks = splitter.split(text, 'test-doc');

      // The 20-char chunk should be rejected because it's < minChunkSize
      expect(chunks.every(c => c.content.length >= 50)).toBe(true);
    });

    it('should preserve metadata in chunks', () => {
      const config = createDefaultChunkingConfig();
      const splitter = new TextSplitter(config);
      const metadata = {
        filename: 'test.pdf',
        projectId: 'proj-123',
        supplierId: 'sup-456',
      };

      const chunks = splitter.split('Test content'.repeat(200), 'test-doc', metadata);

      chunks.forEach(chunk => {
        expect(chunk.metadata.filename).toBe('test.pdf');
        expect(chunk.metadata.projectId).toBe('proj-123');
        expect(chunk.metadata.supplierId).toBe('sup-456');
        expect(chunk.metadata.chunkIndex).toBeDefined();
      });
    });
  });

  describe('Chunk Metadata', () => {
    it('should include correct chunk positions', () => {
      const config: ChunkingConfig = {
        chunkSize: 100,
        chunkOverlap: 0,
        strategy: 'fixed-size',
      };

      const splitter = new TextSplitter(config);
      const chunks = splitter.split('A'.repeat(300), 'test-doc');

      chunks.forEach((chunk, index) => {
        expect(chunk.position).toBe(index);
        expect(chunk.metadata.chunkIndex).toBe(index);
      });
    });

    it('should set totalChunks correctly', () => {
      const config = createDefaultChunkingConfig();
      const splitter = new TextSplitter(config);
      const chunks = splitter.split('Test content '.repeat(500), 'test-doc');

      const totalChunks = chunks.length;
      chunks.forEach(chunk => {
        expect(chunk.totalChunks).toBe(totalChunks);
      });
    });

    it('should generate unique chunk IDs', () => {
      const config = createDefaultChunkingConfig();
      const splitter = new TextSplitter(config);
      const chunks = splitter.split('Test content '.repeat(200), 'test-doc');

      const ids = chunks.map(c => c.id);
      const uniqueIds = new Set(ids);

      expect(uniqueIds.size).toBe(ids.length);
    });
  });
});
