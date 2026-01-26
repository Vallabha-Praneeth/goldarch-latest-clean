'use client';

import { useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSuppliers } from '../../../lib/use-suppliers';
import { useTheme } from '../../../lib/theme-context';
import Link from 'next/link';

function SupplierCard({ supplier }) {
  const { colors } = useTheme();

  return (
    <Link
      href={`/supplier/${supplier.id}`}
      className="block p-5 rounded-xl transition-all hover:scale-[1.02] hover:shadow-lg"
      style={{ backgroundColor: colors.surface }}
    >
      <div className="flex items-start gap-4">
        {/* Logo/Avatar */}
        <div
          className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: colors.primaryLight }}
        >
          {supplier.logoUrl ? (
            <img
              src={supplier.logoUrl}
              alt={supplier.name}
              className="w-full h-full rounded-xl object-cover"
            />
          ) : (
            <span className="text-2xl" style={{ color: colors.primary }}>
              {supplier.name.charAt(0)}
            </span>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3
              className="text-lg font-semibold truncate"
              style={{ color: colors.text }}
            >
              {supplier.name}
            </h3>
            {supplier.verified && (
              <span
                className="flex-shrink-0 px-2 py-1 rounded-md text-xs font-medium"
                style={{
                  backgroundColor: `${colors.success}20`,
                  color: colors.success,
                }}
              >
                ✓ Verified
              </span>
            )}
          </div>

          {supplier.city && (
            <p
              className="text-sm mb-1 flex items-center gap-1"
              style={{ color: colors.textSecondary }}
            >
              <span>📍</span>
              {supplier.city}
            </p>
          )}

          {supplier.products && (
            <p
              className="text-sm line-clamp-2"
              style={{ color: colors.textTertiary }}
            >
              {supplier.products}
            </p>
          )}

          {supplier.ownerRating && (
            <div className="mt-2 flex items-center gap-1">
              <span className="text-sm" style={{ color: colors.warning }}>
                {'⭐'.repeat(Math.floor(supplier.ownerRating))}
              </span>
              <span className="text-xs" style={{ color: colors.textSecondary }}>
                {supplier.ownerRating.toFixed(1)}
              </span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

export default function CategoryPage() {
  const params = useParams();
  const router = useRouter();
  const { getByCategory, loading } = useSuppliers();
  const { colors } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');

  const categoryName = decodeURIComponent(params.category);
  const suppliers = getByCategory(categoryName);

  const filteredSuppliers = useMemo(() => {
    if (!searchQuery.trim()) return suppliers;
    const lowerQuery = searchQuery.toLowerCase();
    return suppliers.filter((s) =>
      s.name.toLowerCase().includes(lowerQuery)
    );
  }, [suppliers, searchQuery]);

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: colors.background }}
      >
        <div className="text-center">
          <div className="w-12 h-12 border-4 rounded-full animate-spin mx-auto mb-4"
               style={{
                 borderColor: colors.skeleton,
                 borderTopColor: colors.primary
               }}
          />
          <p style={{ color: colors.textSecondary }}>Loading suppliers...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen transition-all"
      style={{ backgroundColor: colors.background }}
    >
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md border-b" style={{ backgroundColor: `${colors.surface}95`, borderColor: colors.border }}>
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-110"
              style={{ backgroundColor: colors.primaryLight }}
            >
              <span style={{ color: colors.primary }}>←</span>
            </button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold" style={{ color: colors.text }}>
                {categoryName}
              </h1>
              <p className="text-sm" style={{ color: colors.textSecondary }}>
                {suppliers.length} {suppliers.length === 1 ? 'supplier' : 'suppliers'}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Search */}
        <div className="mb-6">
          <div
            className="flex items-center gap-3 px-4 py-3 rounded-xl"
            style={{ backgroundColor: colors.surface }}
          >
            <span style={{ color: colors.placeholder }}>🔍</span>
            <input
              type="text"
              placeholder="Search suppliers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent outline-none text-base"
              style={{ color: colors.text }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="text-xl"
                style={{ color: colors.placeholder }}
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Suppliers List */}
        {filteredSuppliers.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🔍</div>
            <p className="text-lg mb-2" style={{ color: colors.textSecondary }}>
              No suppliers found
            </p>
            <p className="text-sm" style={{ color: colors.textTertiary }}>
              Try a different search term
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSuppliers.map((supplier) => (
              <SupplierCard key={supplier.id} supplier={supplier} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
