'use client';

import { useState, useMemo } from 'react';
import { useSuppliers } from '../lib/use-suppliers';
import { useTheme } from '../lib/theme-context';
import Link from 'next/link';

const categoryIcons = {
  'Kitchen/Wardrobe Cabinets': '🏠',
  'Canton Fair': '🏢',
  'Door and Wall Panels': '🚪',
  'Personal Preferences': '⭐',
  'Main Doors': '🔐',
  'LED Lighting': '💡',
};

function CategoryCard({ name, count, index }) {
  const icon = categoryIcons[name] || '📦';

  return (
    <Link href={`/category/${encodeURIComponent(name)}`}>
      <div className="card-surface rounded-2xl p-6 border border-transparent hover:border-amber-200/70 dark:hover:border-amber-200/30 transition-all duration-300 hover:-translate-y-1">
        <div className="flex items-start justify-between gap-3 pb-4">
          <div>
            <p className="pill inline-flex text-[11px] font-mono uppercase tracking-[0.3em] text-gray-500 dark:text-muted-foreground">
              Category
            </p>
            <h3 className="mt-3 text-lg font-semibold text-gray-900 dark:text-foreground">
              {name}
            </h3>
          </div>
          <div className="text-2xl">{icon}</div>
        </div>
        <div className="space-y-2">
          <div className="text-3xl font-display font-semibold text-gray-900 dark:text-foreground">
            {count}
          </div>
          <p className="text-xs text-gray-500 dark:text-muted-foreground">
            {count === 1 ? 'supplier' : 'suppliers'}
          </p>
        </div>
      </div>
    </Link>
  );
}

function StatCard({ title, value, subtitle, icon }) {
  return (
    <div className="card-surface rounded-2xl p-6 border border-transparent">
      <div className="flex items-center justify-between gap-3 pb-4">
        <h3 className="text-xs font-mono uppercase tracking-[0.35em] text-gray-500 dark:text-muted-foreground">
          {title}
        </h3>
        <div className="text-xl">{icon}</div>
      </div>
      <div className="space-y-2">
        <div className="text-3xl font-display font-semibold text-gray-900 dark:text-foreground">
          {value}
        </div>
        {subtitle && (
          <p className="text-xs text-gray-500 dark:text-muted-foreground">{subtitle}</p>
        )}
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="card-surface rounded-2xl p-6 border border-transparent animate-pulse">
      <div className="h-4 w-24 bg-gray-200/80 dark:bg-muted rounded-full mb-4" />
      <div className="h-10 w-20 bg-gray-200/80 dark:bg-muted rounded-xl mb-2" />
      <div className="h-3 w-28 bg-gray-200/80 dark:bg-muted rounded-full" />
    </div>
  );
}

export default function HomePage() {
  const { categories, loading, error, suppliers } = useSuppliers();
  const { isDark, toggleTheme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return categories;
    const lowerQuery = searchQuery.toLowerCase();
    return categories.filter((cat) =>
      cat.name.toLowerCase().includes(lowerQuery)
    );
  }, [categories, searchQuery]);

  const totalSuppliers = suppliers.length;
  const verifiedSuppliers = suppliers.filter(s => s.verified).length;
  const ratedSuppliers = suppliers.filter(s => s.ownerRating && s.ownerRating > 0).length;

  return (
    <div className="min-h-screen bg-aurora relative overflow-hidden">
      <div className="absolute inset-0 bg-grid opacity-40 pointer-events-none" />
      <div className="absolute top-20 right-10 w-72 h-72 rounded-full bg-amber-200/40 blur-3xl animate-float" />
      <div className="absolute bottom-10 left-10 w-72 h-72 rounded-full bg-sky-200/40 blur-3xl animate-float" />
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/70 dark:bg-black/20 border-b border-white/40 dark:border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-2xl bg-gray-900 dark:bg-primary text-white flex items-center justify-center shadow-soft">
                🏗️
              </div>
              <div>
                <p className="text-xs font-mono uppercase tracking-[0.45em] text-gray-500 dark:text-muted-foreground">
                  Gold.Arch
                </p>
                <h1 className="text-xl font-semibold text-gray-900 dark:text-foreground">
                  Supplier Atlas
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/dashboard"
                className="px-5 py-2.5 bg-gray-900 dark:bg-primary text-white rounded-full text-sm font-semibold hover:bg-gray-800 dark:hover:bg-primary/90 transition-colors ring-gold"
              >
                Open Dashboard
              </Link>
              <button
                onClick={toggleTheme}
                className="w-10 h-10 rounded-full bg-white/70 dark:bg-secondary flex items-center justify-center hover:bg-white dark:hover:bg-secondary/80 transition-colors shadow-soft"
              >
                <span className="text-lg">{isDark ? '☀️' : '🌙'}</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 relative">
        {/* Hero Section */}
        <section className="grid lg:grid-cols-[1.1fr_0.9fr] gap-10 items-center mb-12">
          <div className="space-y-6 animate-fade-up">
            <span className="pill inline-flex text-xs font-mono uppercase tracking-[0.35em] text-gray-500 dark:text-muted-foreground">
              Trusted Supply Network
            </span>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-display font-semibold text-gray-900 dark:text-foreground">
              Build smarter supply chains with <span className="text-amber-700 dark:text-amber-200">Gold.Arch</span>
            </h2>
            <p className="text-base text-gray-600 dark:text-muted-foreground max-w-xl">
              A curated view of your construction partners, insights, and performance. Navigate {categories.length} categories with precision and speed.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/dashboard"
                className="px-6 py-3 rounded-full bg-gray-900 dark:bg-primary text-white text-sm font-semibold shadow-soft hover:bg-gray-800 dark:hover:bg-primary/90 transition-colors"
              >
                Launch Analytics
              </Link>
              <button className="px-6 py-3 rounded-full border border-gray-300/70 dark:border-white/10 text-sm font-semibold text-gray-900 dark:text-foreground hover:bg-white/70 dark:hover:bg-white/10 transition-colors">
                See Supplier Map
              </button>
            </div>
          </div>
          <div className="card-surface rounded-[28px] p-6 lg:p-8 animate-fade-up-delay">
            <p className="text-xs font-mono uppercase tracking-[0.4em] text-gray-500 dark:text-muted-foreground mb-4">
              Live Pulse
            </p>
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-muted-foreground">Active suppliers</span>
                <span className="text-2xl font-display font-semibold text-gray-900 dark:text-foreground">
                  {totalSuppliers}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-muted-foreground">Verification rate</span>
                <span className="text-2xl font-display font-semibold text-gray-900 dark:text-foreground">
                  {totalSuppliers > 0 ? ((verifiedSuppliers / totalSuppliers) * 100).toFixed(0) : 0}%
                </span>
              </div>
              <div className="h-2 rounded-full bg-amber-100 dark:bg-amber-200/20 overflow-hidden">
                <div
                  className="h-full bg-amber-500 dark:bg-amber-200 rounded-full transition-all duration-700"
                  style={{ width: `${totalSuppliers > 0 ? (verifiedSuppliers / totalSuppliers) * 100 : 0}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 dark:text-muted-foreground">
                Updated in real time as supplier data comes in.
              </p>
            </div>
          </div>
        </section>
        <section className="grid lg:grid-cols-[0.9fr_1.1fr] gap-10 items-center mb-12">
          <div className="space-y-5 animate-fade-up">
            <p className="pill inline-flex text-xs font-mono uppercase tracking-[0.35em] text-gray-500 dark:text-muted-foreground">
              Curated Visuals
            </p>
            <h3 className="text-3xl sm:text-4xl font-display font-semibold text-gray-900 dark:text-foreground">
              See the supply chain in a single glance.
            </h3>
            <p className="text-sm text-gray-600 dark:text-muted-foreground">
              Highlighted sourcing materials, vetted partners, and market-ready inventories.
              Keep stakeholders aligned with one shared view.
            </p>
          </div>
          <div className="card-surface rounded-[32px] p-4 animate-fade-up-delay">
            <div className="relative overflow-hidden rounded-[24px]">
              <img
                src="/placeholder.jpg"
                alt="Construction materials overview"
                className="w-full h-[260px] sm:h-[320px] object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 text-white">
                <p className="text-xs font-mono uppercase tracking-[0.35em] text-white/80 mb-2">
                  Live Catalog
                </p>
                <p className="text-lg font-semibold">Materials & partner highlights</p>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Overview */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 mb-10 animate-fade-up-late">
          <StatCard
            title="Total Suppliers"
            value={totalSuppliers}
            subtitle={`Across ${categories.length} categories`}
            icon="👥"
          />
          <StatCard
            title="Categories"
            value={categories.length}
            subtitle="Product categories"
            icon="📦"
          />
          <StatCard
            title="Verified"
            value={verifiedSuppliers}
            subtitle={`${totalSuppliers > 0 ? ((verifiedSuppliers / totalSuppliers) * 100).toFixed(0) : 0}% verified`}
            icon="✓"
          />
          <StatCard
            title="Rated"
            value={ratedSuppliers}
            subtitle={`${totalSuppliers > 0 ? ((ratedSuppliers / totalSuppliers) * 100).toFixed(0) : 0}% have ratings`}
            icon="⭐"
          />
        </div>

        {/* Search */}
        <div className="mb-8">
          <div className="relative card-surface rounded-full px-4 py-2.5 flex items-center gap-3">
            <span className="text-lg">🔍</span>
            <input
              type="text"
              placeholder="Search categories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent focus:outline-none text-sm text-gray-900 dark:text-foreground placeholder:text-gray-500 dark:placeholder:text-muted-foreground"
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

        {/* Categories Grid */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-foreground">Categories</h3>
            <span className="text-sm text-gray-600 dark:text-muted-foreground font-mono">
              {filteredCategories.length} {filteredCategories.length === 1 ? 'category' : 'categories'}
            </span>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-12 card-surface rounded-2xl border border-transparent">
              <div className="text-4xl mb-3">⚠️</div>
              <p className="text-lg font-semibold text-red-600 mb-2">Error Loading Data</p>
              <p className="text-sm text-gray-600 dark:text-muted-foreground">{error}</p>
            </div>
          ) : filteredCategories.length === 0 ? (
            <div className="text-center py-12 card-surface rounded-2xl border border-transparent">
              <div className="text-4xl mb-3">📁</div>
              <p className="text-lg font-semibold text-gray-900 dark:text-foreground mb-2">No categories found</p>
              <p className="text-sm text-gray-600 dark:text-muted-foreground">Try a different search term</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredCategories.map((category, index) => (
                <CategoryCard
                  key={category.name}
                  name={category.name}
                  count={category.count}
                  index={index}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-20 py-10 border-t border-white/40 dark:border-white/10 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm text-gray-600 dark:text-muted-foreground font-mono">
            © 2024 Gold.Arch Construction. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
