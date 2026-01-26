/**
 * Construction Plan Intelligence - TypeScript Types
 * Defines the structure for AI extraction results
 */

// ============================================================================
// CONFIDENCE LEVELS
// ============================================================================

export type ConfidenceLevel = 'low' | 'medium' | 'high';

// ============================================================================
// EVIDENCE POINTERS
// ============================================================================

export interface Evidence {
  page_no: number;
  artifact_id: string;
  source: 'schedule' | 'legend' | 'plan_symbols' | 'ocr_text';
  note: string;
}

// ============================================================================
// EXTRACTION RESULTS (JSON Schema)
// ============================================================================

export interface PlanMetadata {
  floors_detected: number;
  plan_type: 'residential' | 'commercial' | 'mixed' | 'unknown';
  units: 'imperial' | 'metric' | 'unknown';
  notes: string;
}

export interface DoorAnalysis {
  total: number;
  by_type: {
    entry: number;
    interior: number;
    sliding: number;
    bifold: number;
    other: number;
  };
  confidence: ConfidenceLevel;
  evidence: Evidence[];
}

export interface WindowAnalysis {
  total: number;
  by_type?: {
    fixed: number;
    casement: number;
    sliding: number;
    other: number;
  };
  confidence: ConfidenceLevel;
  evidence: Evidence[];
}

export interface KitchenAnalysis {
  cabinets_count_est: number;
  linear_ft_est: number;
  confidence: ConfidenceLevel;
  evidence: Evidence[];
}

export interface BathroomAnalysis {
  bathroom_count: number;
  toilets: number;
  sinks: number;
  showers: number;
  bathtubs: number;
  confidence: ConfidenceLevel;
  evidence: Evidence[];
}

export interface OtherFixturesAnalysis {
  wardrobes: number;
  closets: number;
  shelving_units: number;
  confidence: ConfidenceLevel;
  evidence: Evidence[];
}

export interface ReviewFlags {
  needs_review: boolean;
  flags: string[];
  assumptions: string[];
}

export interface PlanExtractionResult {
  meta: PlanMetadata;
  doors: DoorAnalysis;
  windows: WindowAnalysis;
  kitchen: KitchenAnalysis;
  bathrooms: BathroomAnalysis;
  other_fixtures: OtherFixturesAnalysis;
  review: ReviewFlags;
}

// ============================================================================
// DATABASE MODELS
// ============================================================================

export interface PlanJob {
  id: string;
  user_id: string;
  file_path: string;
  file_type: 'pdf' | 'image';
  status: 'queued' | 'processing' | 'needs_review' | 'completed' | 'failed';
  error?: string;
  created_at: string;
  updated_at: string;
}

export interface PlanJobArtifact {
  id: string;
  job_id: string;
  kind: 'page_image' | 'crop' | 'debug' | 'ocr_text' | 'embedding_ref';
  page_no?: number;
  artifact_path: string;
  meta: Record<string, any>;
  created_at: string;
}

export interface PlanAnalysis {
  id: string;
  job_id: string;
  model: string;
  quantities: PlanExtractionResult;
  confidence: Record<string, any>;
  evidence: Record<string, any>;
  needs_review: boolean;
  created_at: string;
}

export interface PriceBook {
  id: string;
  name: string;
  currency: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PriceItem {
  id: string;
  price_book_id: string;
  sku: string;
  category: 'door' | 'window' | 'cabinet' | 'toilet' | 'sink' | 'shower' | 'fixture';
  variant: string;
  unit: 'each' | 'sqft' | 'linear_ft';
  unit_price: number;
  meta: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface Quote {
  id: string;
  user_id: string;
  job_id?: string;
  price_book_id: string;
  status: 'draft' | 'sent' | 'accepted' | 'rejected';
  subtotal: number;
  tax: number;
  total: number;
  currency: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface QuoteLine {
  id: string;
  quote_id: string;
  sku: string;
  description: string;
  qty: number;
  unit: string;
  unit_price: number;
  line_total: number;
  selections: Record<string, any>;
  created_at: string;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  material?: string;
  brand?: string;
  base_price?: number;
  attributes: Record<string, any>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductAsset {
  id: string;
  product_id: string;
  kind: 'image' | 'pdf' | 'spec' | 'catalog_page';
  asset_path: string;
  meta: Record<string, any>;
  created_at: string;
}

// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

export interface UploadPlanRequest {
  file: File;
}

export interface UploadPlanResponse {
  jobId: string;
  filePath: string;
  status: string;
}

export interface JobStatusResponse {
  job: PlanJob;
  progress?: {
    stage: string;
    percentage: number;
  };
  analysisId?: string;
}

export interface JobResultResponse {
  job: PlanJob;
  analysis: PlanAnalysis;
  quoteId?: string;
}

export interface GenerateQuoteRequest {
  jobId: string;
  priceBookId?: string; // Optional, use active if not provided
}

export interface GenerateQuoteResponse {
  quoteId: string;
  quote: Quote;
  lines: QuoteLine[];
}

export interface SelectProductsRequest {
  quoteId: string;
  selections: {
    lineId: string;
    productSku: string;
  }[];
}

export interface SelectProductsResponse {
  quote: Quote;
  lines: QuoteLine[];
  recalculated: boolean;
}

// ============================================================================
// QUOTE MAPPING RULES
// ============================================================================

export interface QuoteMappingRule {
  category: string;
  variant: string;
  unit: string;
  extractionPath: string; // e.g., "doors.total", "bathrooms.toilets"
  fallbackPath?: string;  // e.g., "kitchen.linear_ft_est" OR "kitchen.cabinets_count_est"
}

export const DEFAULT_QUOTE_MAPPING: QuoteMappingRule[] = [
  {
    category: 'door',
    variant: 'standard',
    unit: 'each',
    extractionPath: 'doors.total'
  },
  {
    category: 'window',
    variant: 'standard',
    unit: 'each',
    extractionPath: 'windows.total'
  },
  {
    category: 'cabinet',
    variant: 'standard',
    unit: 'linear_ft',
    extractionPath: 'kitchen.linear_ft_est',
    fallbackPath: 'kitchen.cabinets_count_est'
  },
  {
    category: 'toilet',
    variant: 'standard',
    unit: 'each',
    extractionPath: 'bathrooms.toilets'
  },
  {
    category: 'sink',
    variant: 'standard',
    unit: 'each',
    extractionPath: 'bathrooms.sinks'
  },
  {
    category: 'shower',
    variant: 'standard',
    unit: 'each',
    extractionPath: 'bathrooms.showers'
  }
];
