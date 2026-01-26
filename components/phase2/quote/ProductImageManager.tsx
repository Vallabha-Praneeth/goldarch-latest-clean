import React, { useState } from 'react';
import { UploadCloud, Star, X, Loader2 } from 'lucide-react';

interface ProductImage {
  id: string;
  url: string;
  isPrimary?: boolean;
}

interface ProductImageManagerProps {
  images?: ProductImage[];
  maxImages?: number;
  onUpload?: (files: File[]) => void;
  onSetPrimary?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export const ProductImageManager: React.FC<ProductImageManagerProps> = ({
  images = [],
  maxImages = 5,
  onUpload,
  onSetPrimary,
  onDelete,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFiles(Array.from(e.target.files));
    }
  };

  const handleFiles = (files: File[]) => {
    setUploading(true);
    setUploadProgress(0);

    // Simulate upload progress
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setUploading(false);
            setUploadProgress(0);
          }, 500);
          return 100;
        }
        return prev + 10;
      });
    }, 200);

    onUpload?.(files);
  };

  return (
    <div className="w-full max-w-md bg-white rounded-lg border border-gold-brand border-opacity-18 p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-h4 text-navy">Product Images</h3>
        <div className="px-3 py-1 rounded-full bg-gold-light bg-opacity-20 border border-gold-brand border-opacity-30">
          <span className="text-xs font-medium text-gold-dark">
            {images.length}/{maxImages} Images
          </span>
        </div>
      </div>

      {/* Upload Zone */}
      {images.length < maxImages && (
        <div
          className={`
            relative mb-6 border-2 border-dashed rounded-lg p-8 text-center transition-all
            ${dragActive
              ? 'border-gold-brand bg-gold-light bg-opacity-10'
              : 'border-gold-brand border-opacity-30 hover:border-gold-brand hover:bg-gold-light hover:bg-opacity-5'
            }
          `}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            disabled={uploading}
          />

          <div className="flex flex-col items-center gap-3">
            <UploadCloud className="h-8 w-8 text-gold-brand" />
            <div>
              <p className="text-sm font-medium text-navy mb-1">
                Drop images here or click to upload
              </p>
              <p className="text-xs text-navy-light">
                PNG, JPG up to 5MB
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Upload Progress */}
      {uploading && (
        <div className="mb-6 p-4 bg-gold-light bg-opacity-5 rounded-lg border border-gold-brand border-opacity-18">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-navy">Uploading...</span>
            <span className="text-sm text-gold-dark">{uploadProgress}%</span>
          </div>
          <div className="h-1 bg-neutral-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-gold-brand to-gold-light transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Image Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          {images.map((image) => (
            <div
              key={image.id}
              className="relative group aspect-square rounded-lg overflow-hidden border border-gold-brand border-opacity-18 hover:border-gold-brand hover:border-opacity-30 transition-all"
            >
              <img
                src={image.url}
                alt="Product"
                className="w-full h-full object-cover"
              />

              {/* Overlay */}
              <div className="absolute inset-0 bg-navy bg-opacity-0 group-hover:bg-opacity-40 transition-all flex items-center justify-center gap-2">
                {/* Set Primary Button */}
                <button
                  onClick={() => onSetPrimary?.(image.id)}
                  className={`
                    p-2 rounded-full transition-all opacity-0 group-hover:opacity-100
                    ${image.isPrimary
                      ? 'bg-gold-brand text-white'
                      : 'bg-white text-navy hover:bg-gold-light'
                    }
                  `}
                  title={image.isPrimary ? 'Primary image' : 'Set as primary'}
                >
                  <Star className={`h-4 w-4 ${image.isPrimary ? 'fill-current' : ''}`} />
                </button>

                {/* Delete Button */}
                <button
                  onClick={() => onDelete?.(image.id)}
                  className="p-2 rounded-full bg-white text-red-600 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
                  title="Delete image"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Primary Badge */}
              {image.isPrimary && (
                <div className="absolute top-2 left-2 px-2 py-1 bg-gold-brand rounded text-xs font-medium text-white flex items-center gap-1">
                  <Star className="h-3 w-3 fill-current" />
                  Primary
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
