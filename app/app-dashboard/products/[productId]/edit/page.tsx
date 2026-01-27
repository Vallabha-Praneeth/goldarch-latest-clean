// FILE: app/app-dashboard/products/[productId]/edit/page.tsx
'use client';

import { use, useState, useEffect } from 'react';
import { ProductImageManager } from '@/components/phase2/quote/ProductImageManager';
import { ArrowLeft, Save } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface PageProps {
  params: Promise<{ productId: string }>;
}

interface ProductImage {
  url: string;
  alt: string;
  isPrimary: boolean;
  order: number;
  uploadedAt: string;
}

export default function ProductEditPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const productId = resolvedParams.productId;
  const router = useRouter();

  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [images, setImages] = useState<ProductImage[]>([]);

  useEffect(() => {
    let cancelled = false;

    const fetchProduct = async () => {
      try {
        // TODO: Replace with actual API call
        // For now, using mock data
        const mockProduct = {
          id: productId,
          name: 'Interior 6-Panel Door',
          category: 'doors',
          description: 'Standard 6-panel interior door, primed and ready for paint',
          price: 129.99,
          images: [
            {
              url: 'https://example.com/door-1.jpg',
              alt: 'Interior door front view',
              isPrimary: true,
              order: 0,
              uploadedAt: new Date().toISOString(),
            },
          ],
        };

        if (cancelled) return;
        setProduct(mockProduct);
        if (cancelled) return;
        setImages(mockProduct.images);
      } catch (error) {
        console.error('Failed to fetch product:', error);
      } finally {
        if (cancelled) return;
        setLoading(false);
      }
    };

    fetchProduct();

    return () => {
      cancelled = true;
    };
  }, [productId]);

  const handleImageUpload = async (file: File) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('productId', productId);
      formData.append('category', product.category);
      formData.append('alt', file.name);
      formData.append('isPrimary', images.length === 0 ? 'true' : 'false');

      const response = await fetch('/api/quote/products/images', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
      }

      const result = await response.json();
      setImages((prev) => [...prev, result.image]);

      return {
        success: true,
        url: result.url,
      };
    } catch (error) {
      console.error('Image upload failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed',
      };
    }
  };

  const handleSetPrimary = async (url: string) => {
    try {
      const response = await fetch('/api/quote/products/images', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          imageUrl: url,
          isPrimary: true,
        }),
      });

      if (!response.ok) throw new Error('Failed to set primary image');

      const result = await response.json();
      setImages(result.images);
    } catch (error) {
      console.error('Failed to set primary image:', error);
      alert('Failed to set primary image. Please try again.');
    }
  };

  const handleDelete = async (url: string) => {
    try {
      const response = await fetch(
        `/api/quote/products/images?productId=${productId}&imageUrl=${encodeURIComponent(url)}`,
        { method: 'DELETE' }
      );

      if (!response.ok) throw new Error('Failed to delete image');

      setImages((prev) => prev.filter((img) => img.url !== url));
    } catch (error) {
      console.error('Failed to delete image:', error);
      alert('Failed to delete image. Please try again.');
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // TODO: Implement product update API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      alert('Product saved successfully!');
    } catch (error) {
      console.error('Failed to save product:', error);
      alert('Failed to save product. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold-brand mx-auto mb-4"></div>
          <p className="text-navy-light">Loading product...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-navy text-lg">Product not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-navy-light hover:text-navy mb-4 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Products
        </button>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-navy mb-2">Edit Product</h1>
            <p className="text-sm text-navy-light">
              Category: {product.category}
            </p>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-navy text-gold-light rounded-lg hover:bg-navy-light disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <Save className="h-4 w-4" />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Product Form */}
      <div className="bg-white rounded-lg border border-gold-brand border-opacity-18 p-6 mb-6">
        <div className="grid grid-cols-1 gap-6">
          {/* Product Name */}
          <div>
            <label className="block text-sm font-medium text-navy mb-2">
              Product Name
            </label>
            <input
              type="text"
              value={product.name}
              onChange={(e) =>
                setProduct({ ...product, name: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-brand focus:border-transparent"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-navy mb-2">
              Description
            </label>
            <textarea
              value={product.description}
              onChange={(e) =>
                setProduct({ ...product, description: e.target.value })
              }
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-brand focus:border-transparent resize-none"
            />
          </div>

          {/* Price */}
          <div>
            <label className="block text-sm font-medium text-navy mb-2">
              Price (USD)
            </label>
            <input
              type="number"
              value={product.price}
              onChange={(e) =>
                setProduct({ ...product, price: parseFloat(e.target.value) })
              }
              step="0.01"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-brand focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Product Images */}
      <div className="bg-white rounded-lg border border-gold-brand border-opacity-18 p-6">
        <h2 className="text-xl font-bold text-navy mb-4">Product Images</h2>
        <p className="text-sm text-navy-light mb-6">
          Upload product images. The first image will be set as primary. You can
          reorder images by setting a different primary image.
        </p>

        <ProductImageManager
          images={images}
          maxImages={5}
          onUpload={handleImageUpload}
          onSetPrimary={handleSetPrimary}
          onDelete={handleDelete}
        />
      </div>
    </div>
  );
}
