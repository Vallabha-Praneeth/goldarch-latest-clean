'use client';

import { forwardRef } from 'react';
import Image from 'next/image';
import type { QuoteBOMData } from '@/lib/types/quotation.types';

function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

interface QuoteBOMPreviewProps {
  data: QuoteBOMData;
}

const QuoteBOMPreview = forwardRef<HTMLDivElement, QuoteBOMPreviewProps>(
  function QuoteBOMPreview({ data }, ref) {
    const primaryColor = '#2563eb';

    return (
      <div
        ref={ref}
        className="bom-preview bg-white text-gray-800 max-w-[210mm] mx-auto"
        style={{ fontFamily: "'Helvetica Neue', Arial, sans-serif", lineHeight: 1.6 }}
      >
        {/* Header */}
        <div
          className="flex justify-between items-start pb-5 mb-10"
          style={{ borderBottom: `3px solid ${primaryColor}` }}
        >
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/goldarch-logo.png"
              alt="Gold.Arch Logo"
              className="h-14 w-auto print:h-12"
            />
            <span
              className="text-2xl font-bold"
              style={{ color: primaryColor, letterSpacing: '-0.5px' }}
            >
              GoldArch Construction
            </span>
          </div>
          <div className="text-right">
            <h1
              className="text-3xl font-bold mb-2"
              style={{ color: primaryColor }}
            >
              QUOTATION
            </h1>
            <p className="text-sm my-1">
              <strong>Quote #:</strong> {data.quoteNumber}
            </p>
            <p className="text-sm my-1">
              <strong>Date:</strong> {formatDate(data.createdAt)}
            </p>
            {data.validUntil && (
              <p className="text-sm my-1">
                <strong>Valid Until:</strong> {formatDate(data.validUntil)}
              </p>
            )}
          </div>
        </div>

        {/* Customer Info */}
        <div
          className="rounded-lg mb-10 p-6"
          style={{
            background: '#f8fafc',
            borderLeft: `4px solid ${primaryColor}`,
          }}
        >
          <h2
            className="text-lg font-semibold mb-3"
            style={{ color: primaryColor }}
          >
            Quote Prepared For:
          </h2>
          <p className="text-sm my-1">
            <strong>{data.lead.name}</strong>
          </p>
          {data.lead.company && (
            <p className="text-sm my-1">{data.lead.company}</p>
          )}
          {data.lead.email && (
            <p className="text-sm my-1">Email: {data.lead.email}</p>
          )}
          {data.lead.phone && (
            <p className="text-sm my-1">Phone: {data.lead.phone}</p>
          )}
        </div>

        {/* Line Items Table */}
        <table className="w-full mb-10" style={{ borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th
                className="px-3 py-3 text-left text-sm font-semibold text-white"
                style={{ background: primaryColor, width: '5%' }}
              >
                #
              </th>
              <th
                className="px-3 py-3 text-left text-sm font-semibold text-white"
                style={{ background: primaryColor, width: '45%' }}
              >
                Description
              </th>
              <th
                className="px-3 py-3 text-left text-sm font-semibold text-white"
                style={{ background: primaryColor, width: '15%' }}
              >
                Quantity
              </th>
              <th
                className="px-3 py-3 text-left text-sm font-semibold text-white"
                style={{ background: primaryColor, width: '17.5%' }}
              >
                Unit Price
              </th>
              <th
                className="px-3 py-3 text-right text-sm font-semibold text-white"
                style={{ background: primaryColor, width: '17.5%' }}
              >
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            {data.lineItems.map((item, index) => (
              <tr
                key={index}
                style={{
                  background: index % 2 === 0 ? '#ffffff' : '#f8fafc',
                  borderBottom: '1px solid #e2e8f0',
                }}
              >
                <td className="px-3 py-3 text-sm">{item.lineNumber}</td>
                <td className="px-3 py-3 text-sm">
                  {item.description}
                  {item.category && (
                    <span className="block text-xs text-gray-500">
                      {item.category}
                    </span>
                  )}
                </td>
                <td className="px-3 py-3 text-sm">
                  {item.quantity} {item.unit || 'units'}
                </td>
                <td className="px-3 py-3 text-sm">
                  {formatCurrency(item.unitPrice, data.currency)}
                </td>
                <td className="px-3 py-3 text-sm text-right">
                  {formatCurrency(item.lineTotal, data.currency)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="ml-auto w-[350px] rounded-lg p-5 mb-10" style={{ background: '#f8fafc' }}>
          <div className="flex justify-between py-2 text-[15px]">
            <span>Subtotal:</span>
            <span>{formatCurrency(data.subtotal, data.currency)}</span>
          </div>
          {data.discount > 0 && (
            <div className="flex justify-between py-2 text-[15px] text-red-500">
              <span>Discount:</span>
              <span>-{formatCurrency(data.discount, data.currency)}</span>
            </div>
          )}
          <div className="flex justify-between py-2 text-[15px]">
            <span>Tax:</span>
            <span>{formatCurrency(data.tax, data.currency)}</span>
          </div>
          <div
            className="flex justify-between pt-4 mt-2 text-[22px] font-bold"
            style={{ borderTop: '2px solid #333', color: primaryColor }}
          >
            <span>TOTAL:</span>
            <span>{formatCurrency(data.total, data.currency)}</span>
          </div>
        </div>

        {/* Terms & Conditions */}
        <div className="rounded-lg p-5 mb-12" style={{ background: '#f8fafc' }}>
          <h3
            className="text-base font-semibold mb-3"
            style={{ color: primaryColor }}
          >
            Terms &amp; Conditions
          </h3>
          <ul className="ml-5 list-disc">
            <li className="text-[13px] my-2">Payment due within 30 days of invoice date</li>
            <li className="text-[13px] my-2">This quote is valid for 30 days from the issue date</li>
            <li className="text-[13px] my-2">Prices are subject to change based on material availability</li>
            <li className="text-[13px] my-2">Installation and delivery charges may apply</li>
            <li className="text-[13px] my-2">All work subject to final site inspection and approval</li>
          </ul>
        </div>

        {/* Footer */}
        <div
          className="text-center text-[12px] pt-5"
          style={{ color: '#64748b', borderTop: '1px solid #e2e8f0' }}
        >
          <p className="my-1">
            <strong>GoldArch Construction</strong>
          </p>
          <p className="my-1">Thank you for your business!</p>
          <p className="my-1">
            For questions, please contact us at the information provided above.
          </p>
          <p className="my-1">
            &copy; {new Date().getFullYear()} GoldArch Construction. All rights
            reserved.
          </p>
        </div>
      </div>
    );
  }
);

export default QuoteBOMPreview;
