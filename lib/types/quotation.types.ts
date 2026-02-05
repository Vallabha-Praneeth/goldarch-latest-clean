/**
 * TypeScript types for Quotation and QuotationLine
 * Matches the production Supabase schema
 */

export interface QuotationLine {
  id: string;
  quotation_id: string;
  line_number: number;
  product_id: string | null;
  category: string | null;
  title: string | null;
  description: string | null;
  quantity: number;
  unit: string | null;
  unit_of_measure: string | null;
  unit_price: number;
  line_total: number;
  extraction_evidence: Record<string, unknown> | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Quotation {
  id: string;
  quote_number: string;
  user_id: string;
  extraction_job_id: string | null;
  lead_id: string | null;
  lead_name: string | null;
  lead_email: string | null;
  lead_phone: string | null;
  lead_company: string | null;
  supplier_id: string | null;
  deal_id: string | null;
  status: string;
  subtotal: number;
  tax_placeholder: number;
  discount_amount: number;
  total: number;
  currency: string;
  valid_until: string | null;
  internal_notes: string | null;
  customer_notes: string | null;
  terms_and_conditions: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  quotation_lines?: QuotationLine[];
}

/** Props for the BOM preview component */
export interface QuoteBOMData {
  quoteNumber: string;
  createdAt: string;
  validUntil: string | null;
  lead: {
    name: string;
    email: string;
    phone?: string;
    company?: string;
  };
  lineItems: Array<{
    lineNumber: number;
    description: string;
    category?: string;
    quantity: number;
    unit?: string;
    unitPrice: number;
    lineTotal: number;
  }>;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  currency: string;
  termsAndConditions?: string | null;
}
