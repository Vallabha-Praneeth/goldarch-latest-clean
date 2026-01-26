'use client';

import { useRouter } from 'next/navigation';
import { useSuppliers } from '../../lib/use-suppliers';
import { useTheme } from '../../lib/theme-context';
import Link from 'next/link';

function MetricCard({ title, value, subtitle, icon, changeType, change }) {
  return (
    <div className="card-surface rounded-2xl p-6 border border-transparent hover:-translate-y-1 transition-all duration-300">
      <div className="flex items-center justify-between gap-3 pb-4">
        <h3 className="text-xs font-mono uppercase tracking-[0.35em] text-gray-500 dark:text-muted-foreground">
          {title}
        </h3>
        <div className="text-2xl">{icon}</div>
      </div>
      <div className="space-y-2">
        <div className="text-3xl font-display font-semibold text-gray-900 dark:text-foreground">
          {value}
        </div>
        {subtitle && (
          <p className="text-xs text-gray-500 dark:text-muted-foreground flex items-center gap-2">
            {changeType && change && (
              <span className={`font-mono ${changeType === 'increase' ? 'text-emerald-600' : 'text-rose-500'}`}>
                {changeType === 'increase' ? '↗' : '↘'} {change}
              </span>
            )}
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}

function CategoryProgress({ name, count, total, index }) {
  const percentage = (count / total) * 100;

  return (
    <div className="mb-5">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold text-gray-900 dark:text-foreground">{name}</span>
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-gray-600 dark:text-muted-foreground">{count}</span>
          <span className="text-xs text-gray-500 dark:text-muted-foreground">
            ({percentage.toFixed(0)}%)
          </span>
        </div>
      </div>
      <div className="w-full h-2 bg-amber-100 dark:bg-amber-200/20 rounded-full overflow-hidden">
        <div
          className="h-full bg-amber-500 dark:bg-amber-200 rounded-full transition-all duration-1000"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function TopSupplierCard({ supplier, index }) {
  return (
    <Link
      href={`/supplier/${supplier.id}`}
      className="group block"
    >
      <div className="flex items-center gap-4 p-4 card-surface rounded-2xl border border-transparent hover:-translate-y-1 transition-all duration-300">
        {/* Rank Badge */}
        <div className="w-10 h-10 rounded-xl bg-gray-900 dark:bg-primary flex items-center justify-center font-bold text-white flex-shrink-0">
          #{index + 1}
        </div>

        {/* Logo */}
        <div className="w-12 h-12 rounded-xl bg-white/70 dark:bg-secondary flex items-center justify-center flex-shrink-0 overflow-hidden border border-gray-200/60 dark:border-border">
          {supplier.logoUrl ? (
            <img
              src={supplier.logoUrl}
              alt={supplier.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-lg font-bold text-gray-600 dark:text-muted-foreground">
              {supplier.name.charAt(0)}
            </span>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 dark:text-foreground truncate">
            {supplier.name}
          </p>
          <p className="text-xs text-gray-500 dark:text-muted-foreground truncate">
            {supplier.category}
          </p>
        </div>

        {/* Rating */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <span>⭐</span>
          <span className="text-sm font-bold text-gray-900 dark:text-foreground">
            {supplier.ownerRating.toFixed(1)}
          </span>
        </div>
      </div>
    </Link>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const { suppliers, categories, loading } = useSuppliers();
  const { isDark, toggleTheme } = useTheme();

  // Calculate metrics
  const verifiedSuppliers = suppliers.filter(s => s.verified).length;
  const ratedSuppliers = suppliers.filter(s => s.ownerRating && s.ownerRating > 0);
  const avgRating = ratedSuppliers.length > 0
    ? (ratedSuppliers.reduce((sum, s) => sum + s.ownerRating, 0) / ratedSuppliers.length)
    : 0;

  // Top categories
  const topCategories = categories.slice(0, 5);
  const totalSuppliers = suppliers.length;

  // Top rated suppliers
  const topRatedSuppliers = suppliers
    .filter(s => s.ownerRating && s.ownerRating > 0)
    .sort((a, b) => b.ownerRating - a.ownerRating)
    .slice(0, 5);

  if (loading) {
    return (
      <div className="min-h-screen bg-aurora flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-amber-200 dark:border-muted border-t-amber-600 dark:border-t-amber-200 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-muted-foreground font-mono">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-aurora relative overflow-hidden">
      <div className="absolute inset-0 bg-grid opacity-40 pointer-events-none" />
      <div className="absolute top-12 right-6 w-72 h-72 rounded-full bg-amber-200/30 blur-3xl animate-float" />
      <div className="absolute bottom-8 left-10 w-72 h-72 rounded-full bg-sky-200/30 blur-3xl animate-float" />
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/70 dark:bg-black/20 border-b border-white/40 dark:border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="w-10 h-10 rounded-full bg-white/70 dark:bg-secondary flex items-center justify-center hover:bg-white dark:hover:bg-secondary/80 transition-colors shadow-soft"
              >
                <span className="text-lg">←</span>
              </Link>
              <div>
                <p className="text-xs font-mono uppercase tracking-[0.4em] text-gray-500 dark:text-muted-foreground">
                  Insights Hub
                </p>
                <h1 className="text-2xl font-semibold text-gray-900 dark:text-foreground">Supplier Dashboard</h1>
              </div>
            </div>

            <button
              onClick={toggleTheme}
              className="w-10 h-10 rounded-full bg-white/70 dark:bg-secondary flex items-center justify-center hover:bg-white dark:hover:bg-secondary/80 transition-colors shadow-soft"
            >
              <span className="text-lg">{isDark ? '☀️' : '🌙'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 relative">
        {/* Overview Section */}
        <div className="mb-10">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <h2 className="text-3xl font-display font-semibold text-gray-900 dark:text-foreground">
              Operational Overview
            </h2>
            <span className="pill text-xs font-mono uppercase tracking-[0.35em] text-gray-500 dark:text-muted-foreground">
              Updated Live
            </span>
          </div>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              title="Total Suppliers"
              value={suppliers.length}
              subtitle={`Across ${categories.length} categories`}
              icon="👥"
            />
            <MetricCard
              title="Categories"
              value={categories.length}
              subtitle="Product categories"
              icon="📦"
            />
            <MetricCard
              title="Verified"
              value={verifiedSuppliers}
              subtitle={`${suppliers.length > 0 ? ((verifiedSuppliers / suppliers.length) * 100).toFixed(0) : 0}% of suppliers`}
              icon="✓"
            />
            <MetricCard
              title="Avg Rating"
              value={avgRating.toFixed(1)}
              subtitle={`${ratedSuppliers.length} suppliers rated`}
              icon="⭐"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Top Categories */}
          <div className="lg:col-span-2">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-foreground mb-4">
              Top Categories
            </h2>
            <div className="card-surface rounded-2xl p-6 border border-transparent">
              {topCategories.length === 0 ? (
                <p className="text-center py-8 text-gray-500 dark:text-muted-foreground">
                  No categories yet
                </p>
              ) : (
                <div>
                  {topCategories.map((category, index) => (
                    <CategoryProgress
                      key={category.name}
                      name={category.name}
                      count={category.count}
                      total={totalSuppliers}
                      index={index}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Intelligence */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-foreground mb-4">
              Intelligence
            </h2>
            <div className="card-surface rounded-2xl p-6 border border-transparent space-y-6">
              <div>
                <p className="text-xs font-mono uppercase tracking-[0.35em] text-gray-500 dark:text-muted-foreground mb-2">
                  Rating Momentum
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-muted-foreground">Average rating</span>
                  <span className="text-2xl font-display font-semibold text-gray-900 dark:text-foreground">
                    {avgRating.toFixed(1)}
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-muted-foreground mt-2">
                  {ratedSuppliers.length} suppliers currently rated.
                </p>
              </div>
              <div className="h-px bg-gray-200/60 dark:bg-white/10" />
              <div>
                <p className="text-xs font-mono uppercase tracking-[0.35em] text-gray-500 dark:text-muted-foreground mb-2">
                  Verified Ratio
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-muted-foreground">Verified suppliers</span>
                  <span className="text-2xl font-display font-semibold text-gray-900 dark:text-foreground">
                    {verifiedSuppliers}
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-muted-foreground mt-2">
                  {suppliers.length > 0 ? ((verifiedSuppliers / suppliers.length) * 100).toFixed(0) : 0}% of total.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Top Rated Suppliers */}
        <div className="mt-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-foreground">
              Top Rated Suppliers
            </h2>
            <span className="text-xs font-mono uppercase tracking-[0.35em] text-gray-500 dark:text-muted-foreground">
              Quality Leaders
            </span>
          </div>
          <div className="space-y-3">
            {topRatedSuppliers.length === 0 ? (
              <div className="card-surface rounded-2xl p-10 text-center border border-transparent">
                <div className="text-4xl mb-3">⭐</div>
                <p className="text-gray-500 dark:text-muted-foreground">
                  No rated suppliers yet
                </p>
              </div>
            ) : (
              topRatedSuppliers.map((supplier, index) => (
                <TopSupplierCard
                  key={supplier.id}
                  supplier={supplier}
                  index={index}
                />
              ))
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-12">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-foreground mb-4">
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { label: 'View All Suppliers', href: '/', icon: '👥' },
              { label: 'Add New Supplier', href: '#', icon: '➕' },
              { label: 'Export Report', href: '#', icon: '📊' },
            ].map((action, i) => (
              <Link
                key={i}
                href={action.href}
                className="group block"
              >
                <div className="p-6 card-surface rounded-2xl border border-transparent hover:-translate-y-1 transition-all duration-300 text-center">
                  <div className="w-12 h-12 bg-gray-900 dark:bg-primary rounded-xl mx-auto mb-3 flex items-center justify-center text-2xl text-white shadow-soft">
                    {action.icon}
                  </div>
                  <span className="font-semibold text-gray-900 dark:text-foreground">
                    {action.label}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
