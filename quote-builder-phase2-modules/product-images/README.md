# Product Images Module - Phase 2

**Status:** Ready for Integration
**Priority:** ⭐⭐ High
**Estimated Integration Time:** 2 hours

---

## 📋 Overview

This module adds image support to products, including upload, storage, display, and management capabilities. Images are stored in Supabase Storage with automatic optimization and management features.

## 🎯 Features

- ✅ Multiple images per product
- ✅ Primary image designation
- ✅ Drag-and-drop upload support
- ✅ Image validation (size, format)
- ✅ Automatic file naming and organization
- ✅ Image compression utilities
- ✅ Thumbnail generation
- ✅ Secure storage with RLS policies
- ✅ React component included

---

## 📦 Installation

### Step 1: Set Up Supabase Storage

1. **Create Storage Bucket:**
   - Go to Supabase Dashboard → Storage
   - Click "New Bucket"
   - Name: `products`
   - Public: ✅ Yes
   - File size limit: 5MB
   - Allowed MIME types: `image/jpeg, image/png, image/webp`

2. **Run SQL Migration:**

```bash
# Copy migration file
cp quote-builder-phase2-modules/product-images/sql/product-images-migration.sql \
   supabase/migrations/$(date +%Y%m%d%H%M%S)_add_product_images.sql

# Apply via Supabase CLI
supabase db push

# Or run directly in Supabase SQL Editor
```

3. **Set Up Storage Policies:**
   - Run the policy SQL from the migration file in Supabase SQL Editor
   - Or use the Supabase Dashboard → Storage → products → Policies

### Step 2: Copy Module Files

```bash
# Create directories
mkdir -p lib/storage

# Copy type definitions
cp quote-builder-phase2-modules/product-images/types/index.ts \
   lib/storage/types.ts

# Copy image uploader library
cp quote-builder-phase2-modules/product-images/lib/image-uploader.ts \
   lib/storage/image-uploader.ts

# Copy React component
cp quote-builder-phase2-modules/product-images/lib/ImageUploadComponent.tsx \
   lib/storage/ImageUploadComponent.tsx

# Copy API route
mkdir -p app/api/quote/products/images
cp quote-builder-phase2-modules/product-images/api/route.ts \
   app/api/quote/products/images/route.ts
```

### Step 3: Update Imports

In files that import from the module, update paths:

```typescript
// lib/storage/image-uploader.ts
import { ImageUploadResult, ImageDeleteResult, /* ... */ } from './types';

// lib/storage/ImageUploadComponent.tsx
import { ProductImage } from './types';
```

---

## 🚀 Usage

### Admin Product Management

Add to your product form (e.g., `app/admin/quote/suppliers/page.tsx`):

```typescript
import { ImageUploadComponent } from '@/lib/storage/ImageUploadComponent';
import { ProductImage } from '@/lib/storage/types';

function ProductDialog() {
  const [images, setImages] = useState<ProductImage[]>([]);
  const [productId] = useState(generateId()); // or existing product ID

  return (
    <Dialog>
      <DialogContent>
        <form>
          {/* Other product fields... */}

          <ImageUploadComponent
            productId={productId}
            category={formData.category}
            images={images}
            onImagesChange={setImages}
            maxImages={5}
          />

          <Button onClick={handleSave}>Save Product</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

### Displaying Images in Catalog

```typescript
function ProductCard({ product }: { product: ProductWithImages }) {
  // Get primary image or first image
  const primaryImage = product.images?.find(img => img.isPrimary) || product.images?.[0];

  return (
    <div className="product-card">
      {primaryImage ? (
        <img
          src={primaryImage.url}
          alt={primaryImage.alt}
          className="w-full h-48 object-cover rounded-t-lg"
        />
      ) : (
        <div className="w-full h-48 bg-gray-200 flex items-center justify-center rounded-t-lg">
          <Package className="h-12 w-12 text-gray-400" />
          <span className="ml-2 text-gray-500">No image</span>
        </div>
      )}

      <div className="p-4">
        <h3>{product.name}</h3>
        <p>{product.description}</p>

        {/* Show image count */}
        {product.images && product.images.length > 1 && (
          <span className="text-sm text-gray-500">
            +{product.images.length - 1} more images
          </span>
        )}
      </div>
    </div>
  );
}
```

### Image Gallery (Product Detail Page)

```typescript
function ProductImageGallery({ images }: { images: ProductImage[] }) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  if (!images || images.length === 0) {
    return <div>No images available</div>;
  }

  return (
    <div className="space-y-4">
      {/* Main image */}
      <div className="aspect-square rounded-lg overflow-hidden">
        <img
          src={images[selectedIndex].url}
          alt={images[selectedIndex].alt}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="grid grid-cols-4 gap-2">
          {images.map((image, index) => (
            <button
              key={image.url}
              onClick={() => setSelectedIndex(index)}
              className={`aspect-square rounded overflow-hidden border-2 ${
                index === selectedIndex ? 'border-blue-500' : 'border-gray-200'
              }`}
            >
              <img
                src={image.url}
                alt={image.alt}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
```

---

## 📐 API Endpoints

### Upload Image

```bash
POST /api/quote/products/images
Content-Type: multipart/form-data

Body:
  file: [image file]
  category: "doors"
  productId: "product-123"
  alt: "6-panel interior door"
  isPrimary: "true"

Response:
{
  "success": true,
  "url": "https://...supabase.co/storage/v1/object/public/products/doors/product-123-1234567890.jpg",
  "fileName": "doors/product-123-1234567890.jpg",
  "size": 245678,
  "image": {
    "url": "...",
    "alt": "...",
    "isPrimary": true,
    "order": 0,
    "uploadedAt": "2026-01-18T..."
  }
}
```

### Delete Image

```bash
DELETE /api/quote/products/images?productId=product-123&imageUrl=https://...

Response:
{
  "success": true,
  "message": "Image deleted successfully"
}
```

### Update Image Metadata

```bash
PATCH /api/quote/products/images
Content-Type: application/json

Body:
{
  "productId": "product-123",
  "imageUrl": "https://...",
  "isPrimary": true,
  "alt": "Updated alt text"
}

Response:
{
  "success": true,
  "message": "Image updated successfully",
  "images": [...]
}
```

---

## 🎨 Customization

### Change Max File Size

In `lib/storage/types.ts`:

```typescript
export const IMAGE_CONFIG = {
  MAX_SIZE_MB: 10, // Change from 5MB to 10MB
  // ...
};
```

### Add More Image Formats

```typescript
export const IMAGE_CONFIG = {
  ALLOWED_FORMATS: [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif', // Add GIF support
    'image/svg+xml', // Add SVG support
  ],
  // ...
};
```

### Customize Storage Path

In `lib/storage/image-uploader.ts`:

```typescript
const filename = `${sanitizedCategory}/${sanitizedProductId}/${timestamp}.${extension}`;
// Results in: doors/product-123/1234567890.jpg
```

### Enable Image Compression

```typescript
import { compressImage } from '@/lib/storage/image-uploader';

const handleFileSelect = async (file: File) => {
  // Compress before upload
  const compressed = await compressImage(file, 80); // 80% quality

  // Then upload compressed file
  uploadProductImage(compressed, category, productId);
};
```

---

## ✅ Testing

### Manual Testing

1. **Upload Test:**
   - Go to admin product management
   - Click upload button
   - Select 2-3 images
   - Verify they upload successfully
   - Check Supabase Storage bucket to confirm files exist

2. **Primary Image Test:**
   - Upload multiple images
   - Click star icon on second image
   - Verify it becomes primary
   - Check product in database - `isPrimary` should update

3. **Delete Test:**
   - Click X button on an image
   - Verify it's removed from UI
   - Check Supabase Storage - file should be deleted
   - Check database - images array should be updated

4. **Display Test:**
   - Go to product catalog
   - Verify primary image displays
   - Check image loads correctly
   - Test on mobile view

### API Testing

```bash
# Test upload
curl -X POST http://localhost:3000/api/quote/products/images \
  -F "file=@test-image.jpg" \
  -F "category=doors" \
  -F "productId=test-123" \
  -F "alt=Test image" \
  -F "isPrimary=true"

# Test delete
curl -X DELETE "http://localhost:3000/api/quote/products/images?productId=test-123&imageUrl=https://..."

# Test update
curl -X PATCH http://localhost:3000/api/quote/products/images \
  -H "Content-Type: application/json" \
  -d '{"productId":"test-123","imageUrl":"https://...","isPrimary":true}'
```

---

## 🐛 Troubleshooting

### Images Not Uploading

**Check:**
1. Supabase Storage bucket exists and is public
2. Storage RLS policies are configured
3. File size is under limit (5MB default)
4. File format is allowed (JPEG, PNG, WebP)
5. Network tab in browser for actual error

### Images Not Displaying

**Check:**
1. Image URL is public
2. Bucket is set to public in Supabase
3. Correct storage policy for SELECT operation
4. Image URL is valid (visit in browser)

### Upload Fails with 401/403

**Solution:**
- Check SUPABASE_SERVICE_ROLE_KEY is set correctly
- Verify RLS policies allow INSERT for authenticated users
- Check user has admin role (for RLS policy)

### Storage Quota Exceeded

**Free Tier Limits:**
- 1GB storage
- 2GB bandwidth per month

**Solutions:**
1. Upgrade Supabase plan
2. Use external CDN (Cloudinary, ImageKit)
3. Implement image compression
4. Delete old unused images

---

## 🔐 Security Notes

- ✅ Images stored in Supabase Storage
- ✅ RLS policies restrict upload to admins
- ✅ Public read access for product images
- ✅ File type validation
- ✅ File size validation
- ⚠️ Consider adding virus scanning for production
- ⚠️ Monitor storage usage and costs

---

## 💾 Database Schema

```sql
-- products table - images column
{
  "images": [
    {
      "url": "https://...supabase.co/storage/v1/object/public/products/doors/product-123-1234567890.jpg",
      "alt": "6-panel interior door",
      "isPrimary": true,
      "order": 0,
      "uploadedAt": "2026-01-18T12:00:00Z"
    },
    {
      "url": "https://...supabase.co/storage/v1/object/public/products/doors/product-123-1234567891.jpg",
      "alt": "Door hardware detail",
      "isPrimary": false,
      "order": 1,
      "uploadedAt": "2026-01-18T12:00:01Z"
    }
  ]
}
```

---

## 📝 Integration Checklist

- [ ] Create Supabase Storage bucket named `products`
- [ ] Set bucket to public
- [ ] Run SQL migration to add `images` column
- [ ] Configure RLS policies for storage
- [ ] Copy type definitions to `lib/storage/types.ts`
- [ ] Copy image uploader to `lib/storage/image-uploader.ts`
- [ ] Copy React component to `lib/storage/ImageUploadComponent.tsx`
- [ ] Copy API route to `app/api/quote/products/images/route.ts`
- [ ] Update imports in copied files
- [ ] Add ImageUploadComponent to product form
- [ ] Update catalog to display images
- [ ] Test image upload
- [ ] Test image deletion
- [ ] Test primary image setting
- [ ] Test on mobile devices
- [ ] Verify storage policies work
- [ ] Document any customizations

---

## 🎉 Success Criteria

- ✅ Can upload images from admin panel
- ✅ Images save to Supabase Storage
- ✅ Images display in product catalog
- ✅ Primary image shows correctly
- ✅ Can delete images
- ✅ Multiple images per product work
- ✅ Mobile view looks good
- ✅ No console errors
- ✅ Storage policies secure

---

**Module Complete!** Ready to add visual appeal to your product catalog.
