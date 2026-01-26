'use client';

import { useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSuppliers } from '../../../lib/use-suppliers';
import Link from 'next/link';

function SupplierCard({ supplier }) {
  return (
    <Link
      href={`/supplier/${supplier.id}`}
      className="block p-5 rounded-2xl transition-all duration-300 hover:-translate-y-1 card-surface"
    >
      <div className="flex items-start gap-4">
        {/* Logo/Avatar */}
        <div
          className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 bg-white/70 dark:bg-secondary border border-white/60 dark:border-white/10"
        >
          {supplier.logoUrl ? (
            <img
              src={supplier.logoUrl}
              alt={supplier.name}
              className="w-full h-full rounded-xl object-cover"
            />
          ) : (
            <span className="text-2xl text-amber-700 dark:text-amber-200">
              {supplier.name.charAt(0)}
            </span>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="text-lg font-semibold truncate text-gray-900 dark:text-foreground">
              {supplier.name}
            </h3>
            {supplier.verified && (
              <span className="flex-shrink-0 px-2.5 py-1 rounded-full text-[11px] font-mono uppercase tracking-[0.2em] bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200">
                ✓ Verified
              </span>
            )}
          </div>

          {supplier.city && (
            <p className="text-sm mb-1 flex items-center gap-1 text-gray-600 dark:text-muted-foreground">
              <span>📍</span>
              {supplier.city}
            </p>
          )}

          {supplier.products && (
            <p className="text-sm line-clamp-2 text-gray-500 dark:text-muted-foreground">
              {supplier.products}
            </p>
          )}

          {supplier.ownerRating && (
            <div className="mt-2 flex items-center gap-1">
              <span className="text-sm text-amber-500">
                {'⭐'.repeat(Math.floor(supplier.ownerRating))}
              </span>
              <span className="text-xs text-gray-500 dark:text-muted-foreground">
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
      <div className="min-h-screen bg-aurora flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-amber-200 dark:border-muted border-t-amber-600 dark:border-t-amber-200 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-muted-foreground font-mono">Loading suppliers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-aurora relative overflow-hidden">
      <div className="absolute inset-0 bg-grid opacity-40 pointer-events-none" />
      <div className="absolute top-16 right-10 w-64 h-64 rounded-full bg-amber-200/30 blur-3xl animate-float" />
      <div className="absolute bottom-10 left-10 w-64 h-64 rounded-full bg-sky-200/30 blur-3xl animate-float" />
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/70 dark:bg-black/20 border-b border-white/40 dark:border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-4 relative">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-110 bg-white/70 dark:bg-secondary shadow-soft"
            >
              <span className="text-gray-900 dark:text-foreground">←</span>
            </button>
            <div className="flex-1">
              <p className="text-xs font-mono uppercase tracking-[0.4em] text-gray-500 dark:text-muted-foreground">
                Category Focus
              </p>
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-foreground">
                {categoryName}
              </h1>
              <p className="text-sm text-gray-600 dark:text-muted-foreground">
                {suppliers.length} {suppliers.length === 1 ? 'supplier' : 'suppliers'}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-10 relative">
        {/* Search */}
        <div className="mb-8">
          <div className="flex items-center gap-3 px-4 py-3 rounded-full card-surface">
            <span className="text-gray-500">🔍</span>
            <input
              type="text"
              placeholder="Search suppliers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent outline-none text-sm text-gray-900 dark:text-foreground placeholder:text-gray-500 dark:placeholder:text-muted-foreground"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"
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
            <p className="text-lg mb-2 text-gray-600 dark:text-muted-foreground">
              No suppliers found
            </p>
            <p className="text-sm text-gray-500 dark:text-muted-foreground">
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
