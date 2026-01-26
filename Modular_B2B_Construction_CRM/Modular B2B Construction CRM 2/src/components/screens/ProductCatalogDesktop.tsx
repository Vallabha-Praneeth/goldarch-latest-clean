import React from 'react';
import { Search, Filter, Package, Star } from 'lucide-react';

export const ProductCatalogDesktop: React.FC = () => {
  const products = [
    {
      id: '1',
      name: 'Concrete Mix Premium',
      sku: 'CON-001',
      category: 'Foundation',
      price: 12.50,
      unit: 'bag',
      images: [
        'https://images.unsplash.com/photo-1578328819058-b69f3a3b0f6b?w=400',
        'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=400',
        'https://images.unsplash.com/photo-1581094271901-8022df4466f9?w=400',
        'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=400',
      ],
    },
    {
      id: '2',
      name: 'Rebar Steel #4',
      sku: 'STL-004',
      category: 'Foundation',
      price: 0.85,
      unit: 'ft',
      images: [],
    },
    {
      id: '3',
      name: '2x4 Lumber (8ft)',
      sku: 'LMB-204',
      category: 'Framing',
      price: 5.25,
      unit: 'pc',
      images: [
        'https://images.unsplash.com/photo-1601106541922-dd8840fc3a8e?w=400',
      ],
    },
    {
      id: '4',
      name: '2x6 Lumber (10ft)',
      sku: 'LMB-206',
      category: 'Framing',
      price: 8.50,
      unit: 'pc',
      images: [
        'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=400',
        'https://images.unsplash.com/photo-1585128792652-c8b26e1da4f2?w=400',
      ],
    },
    {
      id: '5',
      name: 'Drywall Sheets 4x8',
      sku: 'DRY-048',
      category: 'Interior',
      price: 15.75,
      unit: 'sheet',
      images: [
        'https://images.unsplash.com/photo-1513467535987-fd81bc7d62f8?w=400',
        'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=400',
        'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=400',
      ],
    },
    {
      id: '6',
      name: 'Insulation Roll R-13',
      sku: 'INS-R13',
      category: 'Insulation',
      price: 42.00,
      unit: 'roll',
      images: [],
    },
  ];

  return (
    <div className="p-8">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-h2 text-navy mb-2">Product Catalog</h1>
            <p className="text-sm text-navy-light">
              Browse and manage construction materials
            </p>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="flex items-center gap-3 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search products..."
              className="w-full h-10 pl-10 pr-4 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-brand focus:ring-opacity-50"
            />
          </div>
          <button className="inline-flex items-center gap-2 px-4 h-10 border border-gray-300 text-navy-light rounded-lg hover:bg-gray-50 transition-colors">
            <Filter className="h-4 w-4" />
            <span className="text-sm font-medium">Category</span>
          </button>
          <button className="inline-flex items-center gap-2 px-4 h-10 border border-gray-300 text-navy-light rounded-lg hover:bg-gray-50 transition-colors">
            <Filter className="h-4 w-4" />
            <span className="text-sm font-medium">Price Range</span>
          </button>
        </div>
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-3 gap-6">
        {products.map((product) => (
          <div
            key={product.id}
            className="
              bg-white rounded-lg overflow-hidden 
              border border-gold-brand border-opacity-18
              hover:border-gold-brand hover:border-opacity-30 
              hover:shadow-gold-subtle hover:-translate-y-0.5
              transition-all duration-200 cursor-pointer
              group
            "
          >
            {/* Image Area */}
            <div className="relative aspect-square bg-gray-50">
              {product.images.length > 0 ? (
                <>
                  <img
                    src={product.images[0]}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Primary Indicator Dot */}
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1">
                    {product.images.map((_, idx) => (
                      <div
                        key={idx}
                        className={`
                          w-1.5 h-1.5 rounded-full transition-all
                          ${idx === 0 ? 'bg-gold-brand w-2 h-2' : 'bg-white bg-opacity-50'}
                        `}
                      />
                    ))}
                  </div>

                  {/* Multiple Images Overlay */}
                  {product.images.length > 1 && (
                    <div className="absolute top-3 right-3 px-2 py-1 bg-gold-light text-navy rounded text-xs font-medium">
                      +{product.images.length - 1} more
                    </div>
                  )}
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="h-20 w-20 text-gold-brand text-opacity-30" />
                </div>
              )}
            </div>

            {/* Content */}
            <div className="p-4">
              <div className="mb-3">
                <div className="flex items-start justify-between mb-1">
                  <h3 className="text-sm font-semibold text-navy line-clamp-2 flex-1">
                    {product.name}
                  </h3>
                  {product.images.length > 0 && (
                    <button className="flex-shrink-0 p-1 text-gray-400 hover:text-gold-brand transition-colors">
                      <Star className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <p className="text-xs text-navy-light">{product.sku}</p>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded">
                    {product.category}
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-navy">
                    ${product.price.toFixed(2)}
                  </p>
                  <p className="text-xs text-navy-light">per {product.unit}</p>
                </div>
              </div>

              {/* Add to Quote Button */}
              <button className="
                mt-4 w-full h-9 
                border border-gold-brand border-opacity-30 
                text-sm font-medium text-navy rounded-lg
                hover:bg-gold-light hover:bg-opacity-10 hover:border-gold-brand
                transition-all
                opacity-0 group-hover:opacity-100
              ">
                Add to Quote
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
