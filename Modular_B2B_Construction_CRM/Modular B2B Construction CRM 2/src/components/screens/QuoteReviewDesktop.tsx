import React, { useState } from 'react';
import { Edit2, Mail, CheckCircle } from 'lucide-react';
import { QuoteActions } from '../quote/QuoteActions';
import { QuantityEditor } from '../quote/QuantityEditor';
import { EmailToast } from '../quote/EmailToast';
import { PDFPreviewModal } from '../quote/PDFPreviewModal';

export const QuoteReviewDesktop: React.FC = () => {
  const [showToast, setShowToast] = useState(false);
  const [showPDFModal, setShowPDFModal] = useState(false);
  const [quoteStatus, setQuoteStatus] = useState<'draft' | 'sent'>('draft');

  const lineItems = [
    {
      id: '1',
      category: 'Foundation',
      items: [
        { id: '1-1', name: 'Concrete Mix (Premium)', sku: 'CON-001', quantity: 50, unit: 'bags', price: 12.50, isAdjusted: false },
        { id: '1-2', name: 'Rebar Steel #4', sku: 'STL-004', quantity: 200, unit: 'ft', price: 0.85, isAdjusted: true },
      ],
    },
    {
      id: '2',
      category: 'Framing',
      items: [
        { id: '2-1', name: '2x4 Lumber (8ft)', sku: 'LMB-204', quantity: 150, unit: 'pcs', price: 5.25, isAdjusted: false },
        { id: '2-2', name: '2x6 Lumber (10ft)', sku: 'LMB-206', quantity: 75, unit: 'pcs', price: 8.50, isAdjusted: true },
      ],
    },
  ];

  const subtotal = 4567.50;
  const tax = 365.40;
  const total = 4932.90;

  const handleDownload = () => {
    console.log('Downloading PDF...');
  };

  const handleSendEmail = () => {
    console.log('Sending email...');
    setQuoteStatus('sent');
    setShowToast(true);
  };

  return (
    <>
      <div className="p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-h2 text-navy">Quote Review</h1>
                <div className="px-3 py-1 rounded bg-gold-light bg-opacity-20 border border-gold-brand border-opacity-30">
                  <span className="text-sm font-medium text-gold-dark">
                    Q-2026-001
                  </span>
                </div>
                <div className={`
                  px-3 py-1 rounded
                  ${quoteStatus === 'sent'
                    ? 'bg-gold-light bg-opacity-20 border border-gold-brand text-gold-dark'
                    : 'bg-gray-100 border border-gray-300 text-gray-600'
                  }
                `}>
                  <span className="text-sm font-medium capitalize">
                    {quoteStatus}
                  </span>
                </div>
              </div>
              <p className="text-sm text-navy-light">
                Client: BuildCo Construction • Created: Jan 18, 2026
              </p>
            </div>

            <QuoteActions onDownload={handleDownload} onSendEmail={handleSendEmail} />
          </div>

          {/* Email Tracking Info */}
          {quoteStatus === 'sent' && (
            <div className="p-4 bg-gold-light bg-opacity-5 border border-gold-brand border-opacity-18 rounded-lg flex items-start gap-3">
              <Mail className="h-5 w-5 text-gold-brand flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-navy mb-1">
                  Email sent successfully
                </p>
                <p className="text-sm text-navy-light">
                  Sent to john@buildco.com on Jan 18, 2026 at 2:45 PM • 
                  <button className="ml-1 text-gold-brand hover:underline">
                    View tracking
                  </button>
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Line Items Table */}
        <div className="bg-white rounded-lg border border-gold-brand border-opacity-18 overflow-hidden mb-6">
          <table className="w-full">
            <thead>
              <tr className="bg-navy text-gold-light">
                <th className="px-6 py-3 text-left text-sm font-semibold">Item</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">SKU</th>
                <th className="px-6 py-3 text-right text-sm font-semibold">Quantity</th>
                <th className="px-6 py-3 text-right text-sm font-semibold">Unit Price</th>
                <th className="px-6 py-3 text-right text-sm font-semibold">Total</th>
                <th className="px-6 py-3 text-center text-sm font-semibold w-12"></th>
              </tr>
            </thead>
            <tbody>
              {lineItems.map((category) => (
                <React.Fragment key={category.id}>
                  {/* Category Header */}
                  <tr className="bg-gold-light bg-opacity-5 border-t border-b border-gold-brand border-opacity-10">
                    <td colSpan={6} className="px-6 py-3">
                      <span className="text-sm font-semibold text-navy uppercase tracking-wide">
                        {category.category}
                      </span>
                    </td>
                  </tr>

                  {/* Category Items */}
                  {category.items.map((item) => (
                    <tr
                      key={item.id}
                      className="border-b border-gray-100 hover:bg-gold-light hover:bg-opacity-5 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-navy">{item.name}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-navy-light">{item.sku}</p>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <QuantityEditor
                          initialQuantity={item.quantity}
                          unit={item.unit}
                          isAdjusted={item.isAdjusted}
                        />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <p className="text-sm font-medium text-navy">
                          ${item.price.toFixed(2)}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <p className="text-sm font-semibold text-navy">
                          ${(item.quantity * item.price).toFixed(2)}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button className="p-1 text-gray-400 hover:text-gold-brand transition-colors">
                          <Edit2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div className="border-t-2 border-gold-brand border-opacity-18 bg-gray-50">
            <div className="px-6 py-3 flex items-center justify-between">
              <span className="text-sm font-medium text-navy-light">Subtotal</span>
              <span className="text-sm font-semibold text-navy">
                ${subtotal.toFixed(2)}
              </span>
            </div>
            <div className="px-6 py-3 flex items-center justify-between border-t border-gray-200">
              <span className="text-sm font-medium text-navy-light">Tax (8%)</span>
              <span className="text-sm font-semibold text-navy">
                ${tax.toFixed(2)}
              </span>
            </div>
            <div className="px-6 py-4 flex items-center justify-between border-t-2 border-gold-brand bg-white">
              <span className="text-lg font-bold text-navy">Grand Total</span>
              <span className="text-2xl font-bold text-gold-dark">
                ${total.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between p-6 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-center gap-2 text-sm text-navy-light">
            <CheckCircle className="h-4 w-4 text-gold-brand" />
            <span>Last saved 2 minutes ago</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowPDFModal(true)}
              className="px-4 py-2 text-sm font-medium text-navy hover:bg-gray-200 rounded-lg transition-colors"
            >
              Preview PDF
            </button>
            <button className="px-4 py-2 text-sm font-medium bg-navy text-gold-light rounded-lg hover:bg-navy-light hover:shadow-gold-subtle transition-all">
              Save Changes
            </button>
          </div>
        </div>
      </div>

      {/* Email Toast */}
      <EmailToast
        isVisible={showToast}
        onClose={() => setShowToast(false)}
        recipientEmail="john@buildco.com"
      />

      {/* PDF Preview Modal */}
      <PDFPreviewModal
        isOpen={showPDFModal}
        onClose={() => setShowPDFModal(false)}
        onDownload={handleDownload}
        onSendEmail={handleSendEmail}
      />
    </>
  );
};
