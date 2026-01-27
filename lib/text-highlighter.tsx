/**
 * Text Highlighting Utilities
 * Highlight search terms in text content
 */

import React from 'react';

export interface HighlightOptions {
  caseSensitive?: boolean;
  wholeWord?: boolean;
  className?: string;
}

/**
 * Extract keywords from a search query
 */
export function extractKeywords(query: string): string[] {
  // Remove common words and split by spaces
  const commonWords = ['what', 'when', 'where', 'who', 'why', 'how', 'is', 'are', 'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'about'];

  return query
    .toLowerCase()
    .split(/\s+/)
    .filter(word => word.length > 2 && !commonWords.includes(word))
    .map(word => word.replace(/[^\w\s]/g, ''));
}

/**
 * Highlight matching text in a string
 */
export function highlightText(
  text: string,
  searchTerms: string[],
  options: HighlightOptions = {}
): React.ReactNode {
  if (!text || searchTerms.length === 0) {
    return text;
  }

  const {
    caseSensitive = false,
    wholeWord = false,
    className = 'bg-yellow-200 dark:bg-yellow-800 font-medium',
  } = options;

  // Escape special regex characters
  const escapeRegex = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  // Build regex pattern
  const pattern = searchTerms
    .filter(term => term && term.trim().length > 0)
    .map(term => {
      const escaped = escapeRegex(term.trim());
      return wholeWord ? `\\b${escaped}\\b` : escaped;
    })
    .join('|');

  if (!pattern) {
    return text;
  }

  const flags = caseSensitive ? 'g' : 'gi';
  const regex = new RegExp(`(${pattern})`, flags);

  const parts = text.split(regex);

  return (
    <>
      {parts.map((part, index) => {
        const isMatch = regex.test(part);
        regex.lastIndex = 0; // Reset regex state

        if (isMatch) {
          return (
            <mark key={index} className={className}>
              {part}
            </mark>
          );
        }
        return <React.Fragment key={index}>{part}</React.Fragment>;
      })}
    </>
  );
}

/**
 * Get highlight-safe excerpt with context
 */
export function getHighlightedExcerpt(
  text: string,
  searchTerms: string[],
  maxLength: number = 200,
  options: HighlightOptions = {}
): React.ReactNode {
  if (!text || searchTerms.length === 0) {
    return text.substring(0, maxLength) + (text.length > maxLength ? '...' : '');
  }

  // Find the first match position
  const lowerText = text.toLowerCase();
  let firstMatchIndex = -1;

  for (const term of searchTerms) {
    const index = lowerText.indexOf(term.toLowerCase());
    if (index !== -1 && (firstMatchIndex === -1 || index < firstMatchIndex)) {
      firstMatchIndex = index;
    }
  }

  if (firstMatchIndex === -1) {
    // No match found, return start of text
    const excerpt = text.substring(0, maxLength);
    return excerpt + (text.length > maxLength ? '...' : '');
  }

  // Calculate excerpt window
  const contextBefore = Math.floor(maxLength / 2);
  const start = Math.max(0, firstMatchIndex - contextBefore);
  const end = Math.min(text.length, start + maxLength);

  const excerpt = text.substring(start, end);
  const prefix = start > 0 ? '...' : '';
  const suffix = end < text.length ? '...' : '';

  return (
    <>
      {prefix}
      {highlightText(excerpt, searchTerms, options)}
      {suffix}
    </>
  );
}

/**
 * Count matches in text
 */
export function countMatches(text: string, searchTerms: string[]): number {
  if (!text || searchTerms.length === 0) {
    return 0;
  }

  const lowerText = text.toLowerCase();
  let count = 0;

  for (const term of searchTerms) {
    const regex = new RegExp(term.toLowerCase(), 'g');
    const matches = lowerText.match(regex);
    count += matches ? matches.length : 0;
  }

  return count;
}
