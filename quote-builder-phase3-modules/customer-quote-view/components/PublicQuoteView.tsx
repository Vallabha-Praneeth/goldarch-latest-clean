/**
 * Public Quote View Component
 * Path: app/quote/[token]/page.tsx
 */

'use client';

import { use, useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, Download } from 'lucide-react';

interface PublicQuoteViewProps {
  params: Promise<{ token: string }>;
}

export default function PublicQuoteView({ params }: PublicQuoteViewProps) {
  const resolvedParams = use(params);
  const token = resolvedParams.token;

  const [quote, setQuote] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchQuote();
  }, [token]);

  const fetchQuote = async () => {
    try {
      const response = await fetch(`/api/quote/public/${token}`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to load quote');
      }

      const data = await response.json();
      setQuote(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = async () => {
    // This would integrate with your PDF generation
    alert('PDF download feature - integrate with Phase 2 PDF API');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold-brand mx-auto mb-4"></div>
          <p className="text-navy-light">Loading quote...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md p-8 bg-white rounded-lg shadow">
          <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-navy mb-2">Unable to Load Quote</h1>
          <p className="text-navy-light">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-navy mb-2">
                Quote {quote.quote_number}
              </h1>
              <p className="text-navy-light">
                For: {quote.lead.name}
                {quote.lead.company && ` • ${quote.lead.company}`}
              </p>
            </div>

            {quote.isExpired ? (
              <div className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg">
                <Clock className="h-5 w-5" />
                <span className="font-medium">Expired</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">Valid</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-navy-light">Created:</span>{' '}
              <span className="text-navy font-medium">
                {new Date(quote.created_at).toLocaleDateString()}
              </span>
            </div>
            <div>
              <span className="text-navy-light">Valid Until:</span>{' '}
              <span className="text-navy font-medium">
                {new Date(quote.valid_until).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        {/* Line Items */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-6">
          <table className="w-full">
            <thead className="bg-navy text-gold-light">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold">Item</th>
                <th className="px-6 py-3 text-right text-sm font-semibold">Qty</th>
                <th className="px-6 py-3 text-right text-sm font-semibold">Unit Price</th>
                <th className="px-6 py-3 text-right text-sm font-semibold">Total</th>
              </tr>
            </thead>
            <tbody>
              {quote.lineItems.map((item: any, index: number) => (
                <tr key={index} className="border-b border-gray-100">
                  <td className="px-6 py-4">
                    <p className="font-medium text-navy">{item.description}</p>
                    {item.category && (
                      <p className="text-sm text-navy-light">{item.category}</p>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right text-navy">
                    {item.quantity} {item.unit}
                  </td>
                  <td className="px-6 py-4 text-right text-navy">
                    ${item.unitPrice.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-right font-semibold text-navy">
                    ${item.lineTotal.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div className="bg-gray-50 p-6">
            <div className="max-w-sm ml-auto space-y-2">
              <div className="flex justify-between text-navy-light">
                <span>Subtotal:</span>
                <span>${quote.subtotal.toFixed(2)}</span>
              </div>
              {quote.discount > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>Discount:</span>
                  <span>-${quote.discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-navy-light">
                <span>Tax:</span>
                <span>${quote.tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-2xl font-bold text-gold-dark border-t-2 border-gold-brand pt-2">
                <span>Total:</span>
                <span>${quote.total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={downloadPDF}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-navy text-gold-light rounded-lg hover:bg-navy-light transition-colors"
            >
              <Download className="h-5 w-5" />
              Download PDF
            </button>

            {quote.canRespond && (
              <>
                <button className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium">
                  Accept Quote
                </button>
                <button className="flex-1 px-6 py-3 bg-gray-200 text-navy rounded-lg hover:bg-gray-300 transition-colors font-medium">
                  Request Changes
                </button>
              </>
            )}
          </div>

          {quote.isExpired && (
            <p className="text-center text-red-600 text-sm mt-4">
              This quote has expired. Please contact us for an updated quote.
            </p>
          )}
        </div>

        {/* Company Footer */}
        <div className="text-center text-navy-light text-sm mt-8">
          <p className="font-semibold text-gold-dark">GoldArch Construction</p>
          <p>Thank you for your business!</p>
        </div>
      </div>
    </div>
  );
}
