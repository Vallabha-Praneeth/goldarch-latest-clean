'use client';

import { forwardRef } from 'react';
import type { QuoteBOMData } from '@/lib/types/quotation.types';

function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return dateStr;
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}

interface QuoteBOMPreviewProps {
  data: QuoteBOMData;
}

/* Color palette matching Gold.Arch app theme */
const navy = '#1a2332';
const navyLight = '#2d3a4a';
const gold = '#c8952e';
const goldLight = '#e0be7a';
const textDark = '#1e293b';
const textMuted = '#64748b';
const bgWarm = '#faf9f7';
const borderLight = '#e8e5df';

const QuoteBOMPreview = forwardRef<HTMLDivElement, QuoteBOMPreviewProps>(
  function QuoteBOMPreview({ data }, ref) {
    return (
      <div
        ref={ref}
        className="bom-preview max-w-[210mm] mx-auto"
        style={{
          fontFamily: "'Space Grotesk', 'Helvetica Neue', Arial, sans-serif",
          lineHeight: 1.5,
          color: textDark,
          background: '#ffffff',
        }}
      >
        {/* Header */}
        <div
          className="flex justify-between items-start pb-3 mb-6"
          style={{ borderBottom: `2px solid ${borderLight}` }}
        >
          <div className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/goldarch-logo.png"
              alt="Gold.Arch Logo"
              className="h-9 w-auto"
            />
            <span
              className="text-base font-bold"
              style={{ color: navy, letterSpacing: '-0.3px' }}
            >
              GoldArch Construction
            </span>
          </div>
          <div className="text-right">
            <h1
              className="text-lg font-bold mb-1"
              style={{ color: navy }}
            >
              Quote {data.quoteNumber}
            </h1>
            <p className="text-[11px] my-0.5" style={{ color: textMuted }}>
              Created: <strong style={{ color: textDark }}>{formatDate(data.createdAt)}</strong>
            </p>
            {data.validUntil && (
              <p className="text-[11px] my-0.5" style={{ color: textMuted }}>
                Valid Until: <strong style={{ color: textDark }}>{formatDate(data.validUntil)}</strong>
              </p>
            )}
          </div>
        </div>

        {/* Customer Info */}
        <div className="mb-5 px-4 py-3" style={{ background: bgWarm, borderRadius: '6px' }}>
          <p className="text-[11px] mb-1" style={{ color: textMuted }}>Prepared for</p>
          <p className="text-xs font-semibold" style={{ color: textDark }}>
            {data.lead.name}
            {data.lead.company && <span style={{ color: textMuted }}> &bull; {data.lead.company}</span>}
          </p>
          {(data.lead.email || data.lead.phone) && (
            <p className="text-[11px] mt-0.5" style={{ color: textMuted }}>
              {data.lead.email}{data.lead.email && data.lead.phone && ' · '}{data.lead.phone}
            </p>
          )}
        </div>

        {/* Line Items Table */}
        <table className="w-full mb-5" style={{ borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th
                className="px-3 py-2 text-left text-[11px] font-semibold"
                style={{ background: navy, color: goldLight, width: '50%', borderRadius: '4px 0 0 0' }}
              >
                Item
              </th>
              <th
                className="px-3 py-2 text-right text-[11px] font-semibold"
                style={{ background: navy, color: goldLight, width: '12%' }}
              >
                Qty
              </th>
              <th
                className="px-3 py-2 text-right text-[11px] font-semibold"
                style={{ background: navy, color: goldLight, width: '19%' }}
              >
                Unit Price
              </th>
              <th
                className="px-3 py-2 text-right text-[11px] font-semibold"
                style={{ background: navy, color: goldLight, width: '19%', borderRadius: '0 4px 0 0' }}
              >
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            {data.lineItems.map((item, index) => (
              <tr
                key={item.lineNumber}
                style={{
                  background: index % 2 === 0 ? '#ffffff' : bgWarm,
                  borderBottom: `1px solid ${borderLight}`,
                }}
              >
                <td className="px-3 py-2 text-xs">
                  {item.description}
                  {item.category && (
                    <span className="block text-[10px]" style={{ color: textMuted }}>
                      {item.category}
                    </span>
                  )}
                </td>
                <td className="px-3 py-2 text-xs text-right">
                  {item.quantity} {item.unit || 'units'}
                </td>
                <td className="px-3 py-2 text-xs text-right">
                  {formatCurrency(item.unitPrice, data.currency)}
                </td>
                <td className="px-3 py-2 text-xs text-right font-medium">
                  {formatCurrency(item.lineTotal, data.currency)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="ml-auto w-[280px] mb-5">
          <div className="flex justify-between py-1.5 text-xs" style={{ color: textMuted }}>
            <span>Subtotal:</span>
            <span style={{ color: textDark }}>{formatCurrency(data.subtotal, data.currency)}</span>
          </div>
          {data.discount > 0 && (
            <div className="flex justify-between py-1.5 text-xs text-red-500">
              <span>Discount:</span>
              <span>-{formatCurrency(data.discount, data.currency)}</span>
            </div>
          )}
          <div className="flex justify-between py-1.5 text-xs" style={{ color: textMuted }}>
            <span>Tax:</span>
            <span style={{ color: textDark }}>{formatCurrency(data.tax, data.currency)}</span>
          </div>
          <div
            className="flex justify-between pt-2 mt-1 text-sm font-bold"
            style={{ borderTop: `2px solid ${navy}`, color: gold }}
          >
            <span>Total:</span>
            <span>{formatCurrency(data.total, data.currency)}</span>
          </div>
        </div>

        {/* Terms & Conditions */}
        <div className="px-4 py-3 mb-6" style={{ background: bgWarm, borderRadius: '6px' }}>
          <h3
            className="text-[11px] font-semibold mb-2"
            style={{ color: navy }}
          >
            Terms &amp; Conditions
          </h3>
          <ul className="ml-4 list-disc">
            <li className="text-[10px] my-0.5" style={{ color: textMuted }}>Payment due within 30 days of invoice date</li>
            <li className="text-[10px] my-0.5" style={{ color: textMuted }}>This quote is valid for 30 days from the issue date</li>
            <li className="text-[10px] my-0.5" style={{ color: textMuted }}>Prices subject to change based on material availability</li>
            <li className="text-[10px] my-0.5" style={{ color: textMuted }}>Installation and delivery charges may apply</li>
          </ul>
        </div>

        {/* Footer */}
        <div className="text-center pt-3" style={{ borderTop: `1px solid ${borderLight}` }}>
          <p className="text-[11px] font-semibold my-0.5" style={{ color: gold }}>
            GoldArch Construction
          </p>
          <p className="text-[10px] my-0.5" style={{ color: textMuted }}>
            Thank you for your business!
          </p>
        </div>
      </div>
    );
  }
);

export default QuoteBOMPreview;
