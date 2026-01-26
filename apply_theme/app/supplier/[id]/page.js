'use client';

import { useParams, useRouter } from 'next/navigation';
import { useSuppliers } from '../../../lib/use-suppliers';

function InfoRow({ icon, label, value }) {
  if (!value) return null;

  return (
    <div className="flex items-start gap-3 p-4 rounded-2xl card-surface">
      <span className="text-xl flex-shrink-0">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-mono uppercase tracking-[0.35em] text-gray-500 dark:text-muted-foreground mb-2">
          {label}
        </p>
        <p className="text-base text-gray-900 dark:text-foreground">
          {value}
        </p>
      </div>
    </div>
  );
}

export default function SupplierPage() {
  const params = useParams();
  const router = useRouter();
  const { getById, loading } = useSuppliers();

  const supplier = getById(params.id);

  if (loading) {
    return (
      <div className="min-h-screen bg-aurora flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-amber-200 dark:border-muted border-t-amber-600 dark:border-t-amber-200 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-muted-foreground font-mono">Loading supplier...</p>
        </div>
      </div>
    );
  }

  if (!supplier) {
    return (
      <div className="min-h-screen bg-aurora flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <p className="text-lg mb-2 text-gray-600 dark:text-muted-foreground">
            Supplier not found
          </p>
          <button
            onClick={() => router.back()}
            className="px-6 py-3 rounded-full mt-4 transition-all hover:scale-105 bg-gray-900 dark:bg-primary text-white shadow-soft"
          >
            Go Back
          </button>
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
        <div className="max-w-4xl mx-auto px-4 py-4 relative">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-110 bg-white/70 dark:bg-secondary shadow-soft"
            >
              <span className="text-gray-900 dark:text-foreground">←</span>
            </button>
            <div>
              <p className="text-xs font-mono uppercase tracking-[0.4em] text-gray-500 dark:text-muted-foreground">
                Supplier Profile
              </p>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-foreground">
                Supplier Details
              </h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-10 relative">
        {/* Header Card */}
        <div className="p-6 rounded-3xl mb-6 card-surface">
          <div className="flex items-start gap-6">
            {/* Logo */}
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center flex-shrink-0 bg-white/70 dark:bg-secondary border border-white/60 dark:border-white/10"
            >
              {supplier.logoUrl ? (
                <img
                  src={supplier.logoUrl}
                  alt={supplier.name}
                  className="w-full h-full rounded-2xl object-cover"
                />
              ) : (
                <span className="text-4xl text-amber-700 dark:text-amber-200">
                  {supplier.name.charAt(0)}
                </span>
              )}
            </div>

            {/* Header Info */}
            <div className="flex-1">
              <div className="flex items-start justify-between gap-4 mb-3">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-foreground">
                  {supplier.name}
                </h2>
                {supplier.verified && (
                  <span className="px-3 py-1 rounded-full text-[11px] font-mono uppercase tracking-[0.25em] flex items-center gap-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200">
                    ✓ Verified
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 mb-2">
                <span className="px-3 py-1 rounded-full text-sm font-medium bg-amber-100 text-amber-900 dark:bg-amber-500/20 dark:text-amber-200">
                  {supplier.category}
                </span>
              </div>

              {supplier.ownerRating && (
                <div className="flex items-center gap-2 mt-3">
                  <span className="text-lg text-amber-500">
                    {'⭐'.repeat(Math.floor(supplier.ownerRating))}
                  </span>
                  <span className="text-sm font-medium text-gray-900 dark:text-foreground">
                    {supplier.ownerRating.toFixed(1)}
                  </span>
                  {supplier.ownerRatingNotes && (
                    <span className="text-sm text-gray-600 dark:text-muted-foreground">
                      • {supplier.ownerRatingNotes}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-4 px-2 text-gray-900 dark:text-foreground">
            Contact Information
          </h3>
          <div className="space-y-3">
            <InfoRow icon="👤" label="Contact Person" value={supplier.contactPerson} />
            <InfoRow icon="📞" label="Phone" value={supplier.phone} />
            <InfoRow icon="📧" label="Email" value={supplier.email} />
            <InfoRow icon="🌐" label="Website" value={supplier.website} />
            <InfoRow icon="📍" label="Address" value={supplier.address} />
            <InfoRow icon="🏙️" label="City" value={supplier.city} />
          </div>
        </div>

        {/* Business Information */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-4 px-2 text-gray-900 dark:text-foreground">
            Business Information
          </h3>
          <div className="space-y-3">
            <InfoRow icon="📦" label="Products" value={supplier.products} />
            <InfoRow icon="💰" label="Price" value={supplier.price} />
            <InfoRow icon="📊" label="MOQ" value={supplier.moq} />
            {supplier.catalogUrl && (
              <div className="p-4 rounded-2xl card-surface">
                <a
                  href={supplier.catalogUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 text-base transition-all hover:scale-[1.02] text-amber-700 dark:text-amber-200"
                >
                  <span className="text-xl">📄</span>
                  <div>
                    <p className="font-medium">
                      {supplier.catalogTitle || 'View Catalog'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-muted-foreground">
                      Click to open
                    </p>
                  </div>
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Additional Notes */}
        {(supplier.comments || supplier.exportNotes) && (
          <div>
            <h3 className="text-lg font-semibold mb-4 px-2 text-gray-900 dark:text-foreground">
              Additional Notes
            </h3>
            <div className="space-y-3">
              <InfoRow icon="💬" label="Comments" value={supplier.comments} />
              <InfoRow icon="🌍" label="Export Notes" value={supplier.exportNotes} />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
