/**
 * Customer Quote View - Type Definitions
 * Phase 3 - Feature 1
 */

export interface PublicQuoteLink {
  id: string;
  quotation_id: string;
  share_token: string;
  expires_at: string;
  view_count: number;
  last_viewed_at?: string;
  created_at: string;
}

export interface PublicQuoteData {
  quote_number: string;
  created_at: string;
  valid_until: string;
  status: string;
  lead: {
    name: string;
    company?: string;
  };
  lineItems: Array<{
    category: string;
    description: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    lineTotal: number;
  }>;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  currency: string;
  isExpired: boolean;
  canRespond: boolean;
}

export interface ShareLinkResponse {
  success: boolean;
  shareUrl?: string;
  token?: string;
  expiresAt?: string;
  error?: string;
}
