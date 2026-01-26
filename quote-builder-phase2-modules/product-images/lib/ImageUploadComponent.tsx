/**
 * Product Images Module - React Upload Component
 * Phase 2 - Modular Implementation
 *
 * Example component for uploading and managing product images
 * Integrate this into your admin product management page
 */

'use client';

import React, { useState } from 'react';
import { Upload, X, Star, Image as ImageIcon } from 'lucide-react';
import { ProductImage } from '../types';

interface ImageUploadComponentProps {
  productId: string;
  category: string;
  images: ProductImage[];
  onImagesChange: (images: ProductImage[]) => void;
  maxImages?: number;
}

export function ImageUploadComponent({
  productId,
  category,
  images,
  onImagesChange,
  maxImages = 5,
}: ImageUploadComponentProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    if (files.length === 0) return;

    // Check max images limit
    if (images.length + files.length > maxImages) {
      setError(`Maximum ${maxImages} images allowed`);
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const uploadedImages: ProductImage[] = [];

      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('category', category);
        formData.append('productId', productId);
        formData.append('alt', file.name);
        formData.append('isPrimary', (images.length === 0 && uploadedImages.length === 0).toString());

        const response = await fetch('/api/quote/products/images', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Upload failed');
        }

        const result = await response.json();
        uploadedImages.push(result.image);
      }

      // Update images array
      onImagesChange([...images, ...uploadedImages]);
    } catch (err) {
      console.error('Upload error:', err);
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
      // Reset file input
      e.target.value = '';
    }
  };

  const handleRemoveImage = async (imageUrl: string) => {
    try {
      const response = await fetch(
        `/api/quote/products/images?productId=${productId}&imageUrl=${encodeURIComponent(imageUrl)}`,
        { method: 'DELETE' }
      );

      if (!response.ok) {
        throw new Error('Failed to delete image');
      }

      // Update local state
      onImagesChange(images.filter(img => img.url !== imageUrl));
    } catch (err) {
      console.error('Delete error:', err);
      setError('Failed to delete image');
    }
  };

  const handleSetPrimary = async (imageUrl: string) => {
    try {
      const response = await fetch('/api/quote/products/images', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          imageUrl,
          isPrimary: true,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to set primary image');
      }

      const result = await response.json();
      onImagesChange(result.images);
    } catch (err) {
      console.error('Update error:', err);
      setError('Failed to update image');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">
          Product Images ({images.length}/{maxImages})
        </label>

        {images.length < maxImages && (
          <label className="cursor-pointer">
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={handleFileSelect}
              disabled={uploading}
              className="hidden"
            />
            <div className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50">
              {uploading ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Upload Images
                </>
              )}
            </div>
          </label>
        )}
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
          {error}
        </div>
      )}

      {images.length === 0 ? (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500">No images uploaded yet</p>
          <p className="text-sm text-gray-400 mt-1">
            Upload up to {maxImages} images for this product
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images
            .sort((a, b) => (a.order || 0) - (b.order || 0))
            .map((image, index) => (
              <div
                key={image.url}
                className="relative group aspect-square rounded-lg overflow-hidden border-2 border-gray-200 hover:border-blue-500 transition-colors"
              >
                <img
                  src={image.url}
                  alt={image.alt}
                  className="w-full h-full object-cover"
                />

                {/* Primary badge */}
                {image.isPrimary && (
                  <div className="absolute top-2 left-2 bg-yellow-500 text-white px-2 py-1 rounded text-xs font-semibold flex items-center gap-1">
                    <Star className="h-3 w-3 fill-current" />
                    Primary
                  </div>
                )}

                {/* Actions overlay */}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity flex items-center justify-center gap-2">
                  {!image.isPrimary && (
                    <button
                      onClick={() => handleSetPrimary(image.url)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity bg-white text-gray-900 p-2 rounded-full hover:bg-gray-100"
                      title="Set as primary"
                    >
                      <Star className="h-4 w-4" />
                    </button>
                  )}

                  <button
                    onClick={() => handleRemoveImage(image.url)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity bg-red-600 text-white p-2 rounded-full hover:bg-red-700"
                    title="Remove image"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Image index */}
                <div className="absolute bottom-2 right-2 bg-gray-900 bg-opacity-75 text-white px-2 py-1 rounded text-xs">
                  {index + 1}
                </div>
              </div>
            ))}
        </div>
      )}

      <p className="text-xs text-gray-500">
        Supported formats: JPEG, PNG, WebP • Max size: 5MB per image
        {images.length > 0 && ' • Click star icon to set primary image'}
      </p>
    </div>
  );
}

/**
 * Example usage in admin product page:
 *
 * import { ImageUploadComponent } from '@/lib/storage/ImageUploadComponent';
 *
 * function ProductForm() {
 *   const [images, setImages] = useState<ProductImage[]>([]);
 *
 *   return (
 *     <ImageUploadComponent
 *       productId="product-123"
 *       category="doors"
 *       images={images}
 *       onImagesChange={setImages}
 *       maxImages={5}
 *     />
 *   );
 * }
 */
