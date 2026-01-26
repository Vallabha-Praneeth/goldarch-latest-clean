/**
 * Framework B - Citation Tracker
 * Track and format citations/sources
 */

import type { Citation, RetrievalResult } from '../../types/rag.types';

export class CitationTracker {
  /**
   * Build citations from retrieval results
   */
  buildCitations(results: RetrievalResult[]): Citation[] {
    return results.map(result => ({
      source: this.extractSource(result),
      excerpt: this.createExcerpt(result.content),
      metadata: result.metadata,
      score: result.score,
    }));
  }

  /**
   * Extract source name from result
   */
  private extractSource(result: RetrievalResult): string {
    const metadata = result.metadata;

    // Priority order for source name
    if (metadata.filename) {
      return metadata.filename;
    }

    if (metadata.documentName) {
      return metadata.documentName;
    }

    if (metadata.title) {
      return metadata.title;
    }

    if (result.documentId) {
      return `Document ${result.documentId}`;
    }

    return 'Unknown Source';
  }

  /**
   * Create excerpt from content
   */
  private createExcerpt(content: string, maxLength: number = 200): string {
    if (content.length <= maxLength) {
      return content;
    }

    // Try to cut at sentence boundary
    const truncated = content.substring(0, maxLength);
    const lastPeriod = truncated.lastIndexOf('.');
    const lastSpace = truncated.lastIndexOf(' ');

    if (lastPeriod > maxLength * 0.7) {
      return truncated.substring(0, lastPeriod + 1);
    }

    if (lastSpace > maxLength * 0.8) {
      return truncated.substring(0, lastSpace) + '...';
    }

    return truncated + '...';
  }

  /**
   * Format citations for display
   */
  formatCitations(citations: Citation[]): string {
    if (citations.length === 0) {
      return '';
    }

    return citations
      .map((citation, index) => {
        return `[${index + 1}] ${citation.source}${citation.score ? ` (relevance: ${(citation.score * 100).toFixed(0)}%)` : ''}`;
      })
      .join('\n');
  }

  /**
   * Add inline citations to answer
   */
  addInlineCitations(answer: string, citations: Citation[]): string {
    // Simple approach: add citations at the end
    if (citations.length === 0) {
      return answer;
    }

    const citationText = this.formatCitations(citations);

    return `${answer}\n\n**Sources:**\n${citationText}`;
  }

  /**
   * Deduplicate citations
   */
  deduplicate(citations: Citation[]): Citation[] {
    const seen = new Set<string>();

    return citations.filter(citation => {
      if (seen.has(citation.source)) {
        return false;
      }

      seen.add(citation.source);
      return true;
    });
  }

  /**
   * Sort citations by relevance
   */
  sortByRelevance(citations: Citation[]): Citation[] {
    return citations.sort((a, b) => {
      const scoreA = a.score || 0;
      const scoreB = b.score || 0;
      return scoreB - scoreA;
    });
  }

  /**
   * Filter low-confidence citations
   */
  filterByConfidence(citations: Citation[], minScore: number = 0.7): Citation[] {
    return citations.filter(c => !c.score || c.score >= minScore);
  }

  /**
   * Build structured citations with metadata
   */
  buildStructured(results: RetrievalResult[]): Array<{
    source: string;
    excerpt: string;
    url?: string;
    date?: string;
    type?: string;
    relevance: number;
  }> {
    return results.map(result => ({
      source: this.extractSource(result),
      excerpt: this.createExcerpt(result.content),
      url: result.metadata.url,
      date: result.metadata.createdAt || result.metadata.uploadedAt,
      type: result.metadata.documentType || result.metadata.type,
      relevance: result.score,
    }));
  }
}
