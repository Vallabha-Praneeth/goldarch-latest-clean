'use client';

import { useParams, useRouter } from 'next/navigation';
import { useSuppliers } from '../../../lib/use-suppliers';
import { useTheme } from '../../../lib/theme-context';

function InfoRow({ icon, label, value }) {
  const { colors } = useTheme();

  if (!value) return null;

  return (
    <div className="flex items-start gap-3 p-4 rounded-lg" style={{ backgroundColor: colors.background }}>
      <span className="text-xl flex-shrink-0">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium mb-1" style={{ color: colors.textTertiary }}>
          {label}
        </p>
        <p className="text-base" style={{ color: colors.text }}>
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
  const { colors } = useTheme();

  const supplier = getById(params.id);

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
          <p style={{ color: colors.textSecondary }}>Loading supplier...</p>
        </div>
      </div>
    );
  }

  if (!supplier) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: colors.background }}
      >
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <p className="text-lg mb-2" style={{ color: colors.textSecondary }}>
            Supplier not found
          </p>
          <button
            onClick={() => router.back()}
            className="px-6 py-3 rounded-lg mt-4 transition-all hover:scale-105"
            style={{ backgroundColor: colors.primary, color: '#fff' }}
          >
            Go Back
          </button>
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
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-110"
              style={{ backgroundColor: colors.primaryLight }}
            >
              <span style={{ color: colors.primary }}>←</span>
            </button>
            <h1 className="text-xl font-bold" style={{ color: colors.text }}>
              Supplier Details
            </h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Header Card */}
        <div className="p-6 rounded-xl mb-6" style={{ backgroundColor: colors.surface }}>
          <div className="flex items-start gap-6">
            {/* Logo */}
            <div
              className="w-20 h-20 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: colors.primaryLight }}
            >
              {supplier.logoUrl ? (
                <img
                  src={supplier.logoUrl}
                  alt={supplier.name}
                  className="w-full h-full rounded-xl object-cover"
                />
              ) : (
                <span className="text-4xl" style={{ color: colors.primary }}>
                  {supplier.name.charAt(0)}
                </span>
              )}
            </div>

            {/* Header Info */}
            <div className="flex-1">
              <div className="flex items-start justify-between gap-4 mb-3">
                <h2 className="text-2xl font-bold" style={{ color: colors.text }}>
                  {supplier.name}
                </h2>
                {supplier.verified && (
                  <span
                    className="px-3 py-1 rounded-lg text-sm font-medium flex items-center gap-1"
                    style={{
                      backgroundColor: `${colors.success}20`,
                      color: colors.success,
                    }}
                  >
                    ✓ Verified
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 mb-2">
                <span
                  className="px-3 py-1 rounded-lg text-sm font-medium"
                  style={{
                    backgroundColor: colors.primaryLight,
                    color: colors.primary,
                  }}
                >
                  {supplier.category}
                </span>
              </div>

              {supplier.ownerRating && (
                <div className="flex items-center gap-2 mt-3">
                  <span className="text-lg" style={{ color: colors.warning }}>
                    {'⭐'.repeat(Math.floor(supplier.ownerRating))}
                  </span>
                  <span className="text-sm font-medium" style={{ color: colors.text }}>
                    {supplier.ownerRating.toFixed(1)}
                  </span>
                  {supplier.ownerRatingNotes && (
                    <span className="text-sm" style={{ color: colors.textSecondary }}>
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
          <h3 className="text-lg font-semibold mb-4 px-2" style={{ color: colors.text }}>
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
          <h3 className="text-lg font-semibold mb-4 px-2" style={{ color: colors.text }}>
            Business Information
          </h3>
          <div className="space-y-3">
            <InfoRow icon="📦" label="Products" value={supplier.products} />
            <InfoRow icon="💰" label="Price" value={supplier.price} />
            <InfoRow icon="📊" label="MOQ" value={supplier.moq} />
            {supplier.catalogUrl && (
              <div className="p-4 rounded-lg" style={{ backgroundColor: colors.background }}>
                <a
                  href={supplier.catalogUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 text-base transition-all hover:scale-[1.02]"
                  style={{ color: colors.primary }}
                >
                  <span className="text-xl">📄</span>
                  <div>
                    <p className="font-medium">
                      {supplier.catalogTitle || 'View Catalog'}
                    </p>
                    <p className="text-xs" style={{ color: colors.textSecondary }}>
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
            <h3 className="text-lg font-semibold mb-4 px-2" style={{ color: colors.text }}>
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
