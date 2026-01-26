/**
 * Product Images Module - Type Definitions
 * Phase 2 - Modular Implementation
 */

export interface ProductImage {
  url: string;
  alt: string;
  isPrimary: boolean;
  order?: number;
  uploadedAt?: string;
}

export interface ImageUploadOptions {
  maxSizeMB?: number;
  allowedFormats?: string[];
  quality?: number;
}

export interface ImageUploadResult {
  success: boolean;
  url?: string;
  error?: string;
  fileName?: string;
  size?: number;
}

export interface ImageDeleteResult {
  success: boolean;
  error?: string;
}

export interface StorageConfig {
  bucket: string;
  basePath?: string;
  publicUrl?: string;
}

export interface ProductWithImages {
  id: string;
  name: string;
  description?: string;
  images: ProductImage[];
  // ... other product fields
}

export const IMAGE_CONFIG = {
  MAX_SIZE_MB: 5,
  ALLOWED_FORMATS: ['image/jpeg', 'image/png', 'image/webp'],
  BUCKET_NAME: 'products',
  DEFAULT_QUALITY: 85,
} as const;
