/**
 * Product Images Module - API Route
 * Phase 2 - Modular Implementation
 *
 * Installation Instructions:
 * 1. Copy this file to: app/api/quote/products/images/route.ts
 * 2. Make sure image-uploader.ts is at: lib/storage/image-uploader.ts
 * 3. Run SQL migration for products.images column
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  uploadProductImage,
  deleteProductImage,
  validateImageFile,
} from '@/lib/storage/image-uploader';
import { ProductImage } from '@/lib/storage/types';

/**
 * POST - Upload product image
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const category = formData.get('category') as string;
    const productId = formData.get('productId') as string;
    const alt = formData.get('alt') as string || file.name;
    const isPrimary = formData.get('isPrimary') === 'true';

    // Validate required fields
    if (!file) {
      return NextResponse.json(
        { error: 'File is required' },
        { status: 400 }
      );
    }

    if (!category) {
      return NextResponse.json(
        { error: 'Category is required' },
        { status: 400 }
      );
    }

    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    // Validate file
    const validation = validateImageFile(file);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    // Upload image
    const result = await uploadProductImage(file, category, productId);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Upload failed' },
        { status: 500 }
      );
    }

    // Initialize Supabase
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get current product images
    const { data: product, error: fetchError } = await supabase
      .from('products')
      .select('images')
      .eq('id', productId)
      .single();

    if (fetchError) {
      console.error('Failed to fetch product:', fetchError);
      return NextResponse.json(
        { error: 'Failed to update product' },
        { status: 500 }
      );
    }

    // Prepare new image data
    const newImage: ProductImage = {
      url: result.url!,
      alt: alt,
      isPrimary: isPrimary,
      order: (product.images || []).length,
      uploadedAt: new Date().toISOString(),
    };

    // Update images array
    let updatedImages = product.images || [];

    // If this is primary, set all others to non-primary
    if (isPrimary) {
      updatedImages = updatedImages.map((img: ProductImage) => ({
        ...img,
        isPrimary: false,
      }));
    }

    updatedImages.push(newImage);

    // Update product in database
    const { error: updateError } = await supabase
      .from('products')
      .update({ images: updatedImages })
      .eq('id', productId);

    if (updateError) {
      console.error('Failed to update product:', updateError);
      // Try to clean up uploaded file
      await deleteProductImage(result.url!);
      return NextResponse.json(
        { error: 'Failed to save image to product' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      url: result.url,
      fileName: result.fileName,
      size: result.size,
      image: newImage,
    });
  } catch (error) {
    console.error('Image upload error:', error);
    return NextResponse.json(
      {
        error: 'Failed to upload image',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Remove product image
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    const imageUrl = searchParams.get('imageUrl');

    if (!productId || !imageUrl) {
      return NextResponse.json(
        { error: 'Product ID and image URL are required' },
        { status: 400 }
      );
    }

    // Initialize Supabase
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get current product images
    const { data: product, error: fetchError } = await supabase
      .from('products')
      .select('images')
      .eq('id', productId)
      .single();

    if (fetchError) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Remove image from array
    const updatedImages = (product.images || []).filter(
      (img: ProductImage) => img.url !== imageUrl
    );

    // Update product in database
    const { error: updateError } = await supabase
      .from('products')
      .update({ images: updatedImages })
      .eq('id', productId);

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to update product' },
        { status: 500 }
      );
    }

    // Delete from storage
    const deleteResult = await deleteProductImage(imageUrl);

    if (!deleteResult.success) {
      console.error('Failed to delete from storage:', deleteResult.error);
      // Don't fail the request since DB is already updated
    }

    return NextResponse.json({
      success: true,
      message: 'Image deleted successfully',
    });
  } catch (error) {
    console.error('Image delete error:', error);
    return NextResponse.json(
      { error: 'Failed to delete image' },
      { status: 500 }
    );
  }
}

/**
 * PATCH - Update image metadata (primary, alt, order)
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { productId, imageUrl, isPrimary, alt, order } = body;

    if (!productId || !imageUrl) {
      return NextResponse.json(
        { error: 'Product ID and image URL are required' },
        { status: 400 }
      );
    }

    // Initialize Supabase
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get current product images
    const { data: product, error: fetchError } = await supabase
      .from('products')
      .select('images')
      .eq('id', productId)
      .single();

    if (fetchError) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Update images array
    let updatedImages = product.images || [];

    // If setting as primary, unset all others
    if (isPrimary === true) {
      updatedImages = updatedImages.map((img: ProductImage) => ({
        ...img,
        isPrimary: img.url === imageUrl,
      }));
    }

    // Update specific image
    updatedImages = updatedImages.map((img: ProductImage) => {
      if (img.url === imageUrl) {
        return {
          ...img,
          ...(isPrimary !== undefined && { isPrimary }),
          ...(alt !== undefined && { alt }),
          ...(order !== undefined && { order }),
        };
      }
      return img;
    });

    // Update product in database
    const { error: updateError } = await supabase
      .from('products')
      .update({ images: updatedImages })
      .eq('id', productId);

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to update product' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Image updated successfully',
      images: updatedImages,
    });
  } catch (error) {
    console.error('Image update error:', error);
    return NextResponse.json(
      { error: 'Failed to update image' },
      { status: 500 }
    );
  }
}
