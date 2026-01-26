import React, { useState } from 'react';
import { Search, Plus, Package } from 'lucide-react';
import { ProductImageManager } from '../quote/ProductImageManager';

export const ProductManagementDesktop: React.FC = () => {
  const [selectedProduct, setSelectedProduct] = useState<string | null>('1');

  const products = [
    {
      id: '1',
      name: 'Concrete Mix Premium',
      sku: 'CON-001',
      category: 'Foundation',
      price: 12.50,
      stock: 500,
      images: [
        { id: 'img-1', url: 'https://images.unsplash.com/photo-1578328819058-b69f3a3b0f6b?w=400', isPrimary: true },
        { id: 'img-2', url: 'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=400', isPrimary: false },
      ],
    },
    {
      id: '2',
      name: 'Rebar Steel #4',
      sku: 'STL-004',
      category: 'Foundation',
      price: 0.85,
      stock: 2000,
      images: [],
    },
    {
      id: '3',
      name: '2x4 Lumber (8ft)',
      sku: 'LMB-204',
      category: 'Framing',
      price: 5.25,
      stock: 800,
      images: [
        { id: 'img-3', url: 'https://images.unsplash.com/photo-1601106541922-dd8840fc3a8e?w=400', isPrimary: true },
      ],
    },
    {
      id: '4',
      name: '2x6 Lumber (10ft)',
      sku: 'LMB-206',
      category: 'Framing',
      price: 8.50,
      stock: 450,
      images: [],
    },
  ];

  const selectedProductData = products.find(p => p.id === selectedProduct);

  return (
    <div className="p-8">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-h2 text-navy mb-2">Product Management</h1>
            <p className="text-sm text-navy-light">
              Manage your product catalog and images
            </p>
          </div>
          <button className="inline-flex items-center gap-2 px-4 h-10 bg-navy text-gold-light font-medium rounded-lg hover:bg-navy-light hover:shadow-gold-subtle transition-all">
            <Plus className="h-4 w-4" />
            Add Product
          </button>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search products..."
            className="w-full h-10 pl-10 pr-4 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-brand focus:ring-opacity-50"
          />
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Product List - Left Panel */}
        <div className="col-span-7">
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Product</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">SKU</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Category</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Price</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Stock</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => {
                  const isSelected = selectedProduct === product.id;
                  return (
                    <tr
                      key={product.id}
                      onClick={() => setSelectedProduct(product.id)}
                      className={`
                        border-b border-gray-100 cursor-pointer transition-all
                        hover:border hover:border-gold-brand
                        ${isSelected
                          ? 'bg-gold-light bg-opacity-5 border-l-3 border-l-gold-brand'
                          : 'hover:bg-gray-50'
                        }
                      `}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {product.images.length > 0 ? (
                            <img
                              src={product.images[0].url}
                              alt={product.name}
                              className="w-10 h-10 rounded object-cover border border-gray-200"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center">
                              <Package className="h-5 w-5 text-gray-400" />
                            </div>
                          )}
                          <span className="text-sm font-medium text-navy">{product.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-navy-light">{product.sku}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded">
                          {product.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-sm font-medium text-navy">${product.price.toFixed(2)}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className={`text-sm font-medium ${product.stock > 100 ? 'text-green-600' : 'text-amber-600'}`}>
                          {product.stock}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Product Detail - Right Panel */}
        <div className="col-span-5">
          {selectedProductData ? (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="mb-6">
                <div className="h-0.5 w-16 bg-gold-brand mb-4 rounded-full"></div>
                <h2 className="text-h3 text-navy mb-2">{selectedProductData.name}</h2>
                <p className="text-sm text-navy-light">SKU: {selectedProductData.sku}</p>
              </div>

              {/* Product Info */}
              <div className="mb-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-navy mb-1">Category</label>
                  <input
                    type="text"
                    value={selectedProductData.category}
                    className="w-full h-10 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-brand focus:ring-opacity-50"
                    readOnly
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-navy mb-1">Price</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">$</span>
                      <input
                        type="number"
                        value={selectedProductData.price}
                        className="w-full h-10 pl-7 pr-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-brand focus:ring-opacity-50"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-navy mb-1">Stock</label>
                    <input
                      type="number"
                      value={selectedProductData.stock}
                      className="w-full h-10 px-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-brand focus:ring-opacity-50"
                    />
                  </div>
                </div>
              </div>

              {/* Image Manager */}
              <div className="mb-6">
                <ProductImageManager images={selectedProductData.images} />
              </div>

              {/* Save Button */}
              <button className="w-full h-10 bg-navy text-gold-light font-medium rounded-lg hover:bg-navy-light hover:shadow-gold-glow transition-all">
                Save Changes
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
              <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-sm text-gray-500">Select a product to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
