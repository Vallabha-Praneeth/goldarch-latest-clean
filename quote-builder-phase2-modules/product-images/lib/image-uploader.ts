/**
 * Product Images Module - Storage and Upload Library
 * Phase 2 - Modular Implementation
 *
 * Dependencies: @supabase/supabase-js (already installed)
 */

import { createClient } from '@supabase/supabase-js';
import {
  ImageUploadResult,
  ImageDeleteResult,
  ImageUploadOptions,
  IMAGE_CONFIG,
} from '../types';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Upload a product image to Supabase Storage
 */
export async function uploadProductImage(
  file: File,
  category: string,
  productId: string,
  options: ImageUploadOptions = {}
): Promise<ImageUploadResult> {
  try {
    // Validate file
    const validation = validateImageFile(file, options);
    if (!validation.valid) {
      return {
        success: false,
        error: validation.error,
      };
    }

    // Generate unique filename
    const timestamp = Date.now();
    const extension = getFileExtension(file.name);
    const sanitizedCategory = sanitizeFileName(category);
    const sanitizedProductId = sanitizeFileName(productId);
    const filename = `${sanitizedCategory}/${sanitizedProductId}-${timestamp}.${extension}`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(IMAGE_CONFIG.BUCKET_NAME)
      .upload(filename, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type,
      });

    if (error) {
      console.error('Upload error:', error);
      return {
        success: false,
        error: `Upload failed: ${error.message}`,
      };
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(IMAGE_CONFIG.BUCKET_NAME)
      .getPublicUrl(filename);

    return {
      success: true,
      url: urlData.publicUrl,
      fileName: filename,
      size: file.size,
    };
  } catch (error) {
    console.error('Image upload error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Delete a product image from Supabase Storage
 */
export async function deleteProductImage(url: string): Promise<ImageDeleteResult> {
  try {
    // Extract path from URL
    const path = extractPathFromUrl(url);
    if (!path) {
      return {
        success: false,
        error: 'Invalid image URL',
      };
    }

    const { error } = await supabase.storage
      .from(IMAGE_CONFIG.BUCKET_NAME)
      .remove([path]);

    if (error) {
      console.error('Delete error:', error);
      return {
        success: false,
        error: `Delete failed: ${error.message}`,
      };
    }

    return {
      success: true,
    };
  } catch (error) {
    console.error('Image delete error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * List all images for a product
 */
export async function listProductImages(
  category: string,
  productId: string
): Promise<{ success: boolean; files?: string[]; error?: string }> {
  try {
    const sanitizedCategory = sanitizeFileName(category);
    const sanitizedProductId = sanitizeFileName(productId);
    const prefix = `${sanitizedCategory}/${sanitizedProductId}`;

    const { data, error } = await supabase.storage
      .from(IMAGE_CONFIG.BUCKET_NAME)
      .list(sanitizedCategory, {
        search: sanitizedProductId,
      });

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    const files = data.map(file => `${sanitizedCategory}/${file.name}`);

    return {
      success: true,
      files,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Validate image file before upload
 */
export function validateImageFile(
  file: File,
  options: ImageUploadOptions = {}
): { valid: boolean; error?: string } {
  const maxSizeMB = options.maxSizeMB || IMAGE_CONFIG.MAX_SIZE_MB;
  const allowedFormats = options.allowedFormats || IMAGE_CONFIG.ALLOWED_FORMATS;

  // Check file size
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    return {
      valid: false,
      error: `File size exceeds ${maxSizeMB}MB limit`,
    };
  }

  // Check file type
  if (!allowedFormats.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed: ${allowedFormats.join(', ')}`,
    };
  }

  // Check if file is actually an image
  if (!file.type.startsWith('image/')) {
    return {
      valid: false,
      error: 'File must be an image',
    };
  }

  return { valid: true };
}

/**
 * Extract file path from storage URL
 */
function extractPathFromUrl(url: string): string | null {
  try {
    // Handle Supabase storage URLs
    const bucketMatch = url.match(/\/storage\/v1\/object\/public\/products\/(.*)/);
    if (bucketMatch) {
      return bucketMatch[1];
    }

    // Handle other formats
    const parts = url.split('/products/');
    if (parts.length > 1) {
      return parts[1];
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Get file extension from filename
 */
function getFileExtension(filename: string): string {
  const parts = filename.split('.');
  return parts[parts.length - 1].toLowerCase();
}

/**
 * Sanitize filename for safe storage
 */
function sanitizeFileName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9-_]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Get image dimensions (browser-side only)
 */
export async function getImageDimensions(
  file: File
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({
        width: img.width,
        height: img.height,
      });
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };

    img.src = url;
  });
}

/**
 * Compress image before upload (browser-side only)
 */
export async function compressImage(
  file: File,
  quality: number = IMAGE_CONFIG.DEFAULT_QUALITY
): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();

      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        ctx.drawImage(img, 0, 0);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to compress image'));
              return;
            }

            const compressedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now(),
            });

            resolve(compressedFile);
          },
          file.type,
          quality / 100
        );
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target?.result as string;
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

/**
 * Create thumbnail (browser-side only)
 */
export async function createThumbnail(
  file: File,
  maxWidth: number = 200,
  maxHeight: number = 200
): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();

      img.onload = () => {
        const canvas = document.createElement('canvas');

        // Calculate new dimensions
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to create thumbnail'));
              return;
            }

            const thumbnailFile = new File(
              [blob],
              `thumb_${file.name}`,
              { type: file.type, lastModified: Date.now() }
            );

            resolve(thumbnailFile);
          },
          file.type,
          0.8
        );
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target?.result as string;
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}
