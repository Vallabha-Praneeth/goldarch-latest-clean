/**
 * PDF Generation Module - Type Definitions
 * Phase 2 - Modular Implementation
 */

export interface QuotePDFData {
  quoteNumber: string;
  createdAt: string;
  validUntil: string;
  lead: {
    name: string;
    email: string;
    phone: string;
    company?: string;
  };
  lineItems: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }>;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  currency: string;
}

export interface PDFGenerationOptions {
  format?: 'A4' | 'Letter';
  orientation?: 'portrait' | 'landscape';
  includeTerms?: boolean;
  customLogoUrl?: string;
  customColors?: {
    primary?: string;
    secondary?: string;
  };
}

export interface PDFGenerationResult {
  success: boolean;
  buffer?: Buffer;
  error?: string;
  fileName?: string;
}
