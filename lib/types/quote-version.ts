/**
 * Quote Versioning - Type Definitions
 * Phase 3 - Feature 3
 */

export interface QuoteVersion {
  id: string;
  original_quotation_id: string;
  version: number;
  quotation_snapshot: any;
  created_by?: string;
  created_at: string;
  reason?: string;
}

export interface VersionComparison {
  version1: number;
  version2: number;
  changes: {
    field: string;
    oldValue: any;
    newValue: any;
  }[];
}
