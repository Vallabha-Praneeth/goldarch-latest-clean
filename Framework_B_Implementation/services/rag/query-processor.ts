/**
 * Framework B - Query Processor
 * Process and understand user queries
 */

export interface ProcessedQuery {
  original: string;
  cleaned: string;
  keywords: string[];
  intent?: 'question' | 'command' | 'statement';
  expanded?: string;
}

export class QueryProcessor {
  /**
   * Process a user query
   */
  process(query: string): ProcessedQuery {
    const cleaned = this.clean(query);
    const keywords = this.extractKeywords(cleaned);
    const intent = this.detectIntent(cleaned);

    return {
      original: query,
      cleaned,
      keywords,
      intent,
    };
  }

  /**
   * Clean and normalize query
   */
  private clean(query: string): string {
    return query
      .trim()
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/[^\w\s?!.,'-]/g, ''); // Remove special characters
  }

  /**
   * Extract keywords from query
   */
  private extractKeywords(query: string): string[] {
    // Simple keyword extraction - remove stop words
    const stopWords = new Set([
      'a', 'an', 'the', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
      'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
      'should', 'may', 'might', 'can', 'what', 'when', 'where', 'who', 'why',
      'how', 'which', 'this', 'that', 'these', 'those', 'i', 'you', 'he',
      'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them',
    ]);

    const words = query
      .toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.has(word));

    return [...new Set(words)]; // Remove duplicates
  }

  /**
   * Detect query intent
   */
  private detectIntent(query: string): 'question' | 'command' | 'statement' {
    const lowerQuery = query.toLowerCase();

    // Check for question patterns
    const questionWords = ['what', 'when', 'where', 'who', 'why', 'how', 'which', 'whose'];
    const startsWithQuestion = questionWords.some(word =>
      lowerQuery.startsWith(word)
    );
    const hasQuestionMark = query.includes('?');

    if (startsWithQuestion || hasQuestionMark) {
      return 'question';
    }

    // Check for command patterns
    const commandWords = ['show', 'find', 'get', 'list', 'tell', 'give', 'explain'];
    const startsWithCommand = commandWords.some(word =>
      lowerQuery.startsWith(word)
    );

    if (startsWithCommand) {
      return 'command';
    }

    return 'statement';
  }

  /**
   * Expand query with synonyms (simplified)
   */
  expandQuery(query: string): string {
    // In production, use a proper NLP library or thesaurus API
    // This is a simplified example

    const synonyms: Record<string, string[]> = {
      'quote': ['quotation', 'estimate', 'bid', 'proposal'],
      'supplier': ['vendor', 'provider', 'contractor'],
      'project': ['job', 'work', 'contract'],
      'price': ['cost', 'rate', 'fee', 'charge'],
      'delivery': ['shipment', 'shipping', 'transport'],
    };

    let expanded = query;

    Object.entries(synonyms).forEach(([word, syns]) => {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      if (regex.test(expanded)) {
        // Add synonyms
        expanded += ' ' + syns.join(' ');
      }
    });

    return expanded;
  }

  /**
   * Validate query
   */
  validate(query: string): { valid: boolean; error?: string } {
    if (!query || query.trim().length === 0) {
      return { valid: false, error: 'Query is empty' };
    }

    if (query.length < 3) {
      return { valid: false, error: 'Query is too short' };
    }

    if (query.length > 1000) {
      return { valid: false, error: 'Query is too long (max 1000 characters)' };
    }

    return { valid: true };
  }
}
