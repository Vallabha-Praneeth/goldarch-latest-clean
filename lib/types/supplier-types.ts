/**
 * Supplier Types and Access Control
 */

export type UserRole = 'Admin' | 'Manager' | 'Viewer' | 'Procurement';

export interface SupplierAccessRule {
  id: string;
  user_id: string;
  rule_data?: {
    categories?: string[];
    regions?: string[];
    priceMin?: number | null;
    priceMax?: number | null;
  };
  category_id?: string | null;  // Legacy field
  region?: string | null;        // Legacy field
  created_by: string;
  created_at: string;
  updated_at?: string;
  notes?: string | null;
}

export interface Supplier {
  id: string;
  name: string;
  category_id?: string | null;
  region?: string | null;
  city?: string | null;
  contact_person?: string | null;
  email?: string | null;
  phone?: string | null;
  website?: string | null;
  address?: string | null;
  products?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at?: string;
}

export interface SupplierFilterParams {
  search?: string;
  categoryId?: string;
  region?: string;
  sortBy?: 'name' | 'created_at' | 'city';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface SupplierQueryResult {
  suppliers: Supplier[];
  total: number;
  filtered: boolean;
  accessRules: SupplierAccessRule[];
}
