// FILE: app/app-dashboard/quotes/[quoteId]/review/page.tsx
'use client';

import { use, useState, useEffect } from 'react';
import { QuoteActions } from '@/components/phase2/quote/QuoteActions';
import { QuantityEditor } from '@/components/phase2/quote/QuantityEditor';
import { EmailToast } from '@/components/phase2/quote/EmailToast';
import { PDFPreviewModal } from '@/components/phase2/quote/PDFPreviewModal';
import { ShareQuoteButton } from '@/components/quote/ShareQuoteButton';
import { StatusTimeline } from '@/components/quote/StatusTimeline';
import ResponsesList from '@/components/quote/ResponsesList';
import { Edit2, Mail, CheckCircle, Share2, Clock, MessageSquare, History } from 'lucide-react';

interface PageProps {
  params: Promise<{ quoteId: string }>;
}

export default function QuoteReviewPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const quoteId = resolvedParams.quoteId;

  const [quote, setQuote] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const [showPDFModal, setShowPDFModal] = useState(false);
  const [quoteStatus, setQuoteStatus] = useState<'draft' | 'sent'>('draft');
  const [emailHistory, setEmailHistory] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'details' | 'status' | 'responses' | 'versions'>('details');

  useEffect(() => {
    let cancelled = false;

    const fetchQuote = async () => {
      try {
        const response = await fetch(`/api/quote/${quoteId}`);

        if (!response.ok) {
          throw new Error(`Failed to fetch quote: ${response.status}`);
        }

        const data = await response.json();

        if (data.error) {
          throw new Error(data.error);
        }

        // Transform the data to match the expected format
        const quoteData = {
          id: data.id,
          quote_number: data.quote_number,
          created_at: data.created_at,
          valid_until: data.valid_until,
          status: data.status,
          lead: {
            name: data.lead_name || 'Unknown Client',
            email: data.lead_email || '',
          },
          lineItems: (data.quotation_lines || []).map((line: any) => ({
            id: line.id,
            category: line.category || '',
            description: line.description || line.title || '',
            quantity: line.quantity,
            unit: line.unit,
            unit_price: line.unit_price,
            line_total: line.line_total,
          })),
          subtotal: data.subtotal || 0,
          tax_placeholder: data.tax_placeholder || 0,
          total: data.total || 0,
          currency: data.currency || 'USD',
        };

        if (cancelled) return;
        setQuote(quoteData);
        if (cancelled) return;
        setQuoteStatus(data.status || 'draft');
      } catch (error) {
        console.error('Failed to fetch quote:', error);
        alert('Failed to load quote. Please check the quote ID and try again.');
      } finally {
        if (cancelled) return;
        setLoading(false);
      }
    };

    const fetchEmailHistory = async () => {
      try {
        const response = await fetch(`/api/quote/email/${quoteId}`);
        const data = await response.json();
        if (cancelled) return;
        setEmailHistory(data.history || []);
        if (data.history && data.history.length > 0) {
          if (cancelled) return;
          setQuoteStatus('sent');
        }
      } catch (error) {
        console.error('Failed to fetch email history:', error);
      }
    };

    fetchQuote();
    fetchEmailHistory();

    return () => {
      cancelled = true;
    };
  }, [quoteId]);

  const handleDownload = async () => {
    try {
      const response = await fetch(`/api/quote/pdf/${quoteId}`);
      if (!response.ok) throw new Error('PDF generation failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Quote-${quote.quote_number}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('PDF download failed:', error);
      alert('Failed to download PDF. Please try again.');
    }
  };

  const handleSendEmail = async () => {
    try {
      const response = await fetch(`/api/quote/email/${quoteId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      if (!response.ok) throw new Error('Email send failed');

      setQuoteStatus('sent');
      setShowToast(true);
      fetchEmailHistory();
    } catch (error) {
      console.error('Email send failed:', error);
      alert('Failed to send email. Please try again.');
    }
  };

  const handleQuantitySave = async (lineItemId: string, newQuantity: number) => {
    try {
      // TODO: Implement API call to update quantity
      console.log('Saving quantity:', lineItemId, newQuantity);
      fetchQuote();
    } catch (error) {
      console.error('Failed to save quantity:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold-brand mx-auto mb-4"></div>
          <p className="text-navy-light">Loading quote...</p>
        </div>
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-navy text-lg">Quote not found</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-navy">Quote Review</h1>
                <div className="px-3 py-1 rounded bg-gold-light bg-opacity-20 border border-gold-brand border-opacity-30">
                  <span className="text-sm font-medium text-gold-dark">
                    {quote.quote_number}
                  </span>
                </div>
                <div
                  className={`
                  px-3 py-1 rounded
                  ${
                    quoteStatus === 'sent'
                      ? 'bg-gold-light bg-opacity-20 border border-gold-brand text-gold-dark'
                      : 'bg-gray-100 border border-gray-300 text-gray-600'
                  }
                `}
                >
                  <span className="text-sm font-medium capitalize">
                    {quoteStatus}
                  </span>
                </div>
              </div>
              <p className="text-sm text-navy-light">
                Client: {quote.lead.name} • Created:{' '}
                {new Date(quote.created_at).toLocaleDateString()}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <ShareQuoteButton quoteId={quoteId} />
              <QuoteActions
                onDownload={handleDownload}
                onSendEmail={handleSendEmail}
              />
            </div>
          </div>

          {/* Email Tracking Info */}
          {quoteStatus === 'sent' && emailHistory.length > 0 && (
            <div className="p-4 bg-gold-light bg-opacity-5 border border-gold-brand border-opacity-18 rounded-lg flex items-start gap-3">
              <Mail className="h-5 w-5 text-gold-brand flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-navy mb-1">
                  Email sent successfully
                </p>
                <p className="text-sm text-navy-light">
                  Sent to {emailHistory[0].recipient_email} on{' '}
                  {new Date(emailHistory[0].sent_at).toLocaleString()}
                </p>
              </div>
            </div>
          )}

          {/* Tab Navigation */}
          <div className="flex items-center gap-2 border-b border-gray-200 mb-6">
            <button
              onClick={() => setActiveTab('details')}
              className={`
                px-4 py-3 text-sm font-medium transition-all flex items-center gap-2
                ${
                  activeTab === 'details'
                    ? 'border-b-2 border-gold-brand text-gold-dark bg-gold-light bg-opacity-5'
                    : 'text-navy-light hover:text-navy hover:bg-gray-50'
                }
              `}
            >
              <Edit2 className="h-4 w-4" />
              Details
            </button>
            <button
              onClick={() => setActiveTab('status')}
              className={`
                px-4 py-3 text-sm font-medium transition-all flex items-center gap-2
                ${
                  activeTab === 'status'
                    ? 'border-b-2 border-gold-brand text-gold-dark bg-gold-light bg-opacity-5'
                    : 'text-navy-light hover:text-navy hover:bg-gray-50'
                }
              `}
            >
              <Clock className="h-4 w-4" />
              Status Timeline
            </button>
            <button
              onClick={() => setActiveTab('responses')}
              className={`
                px-4 py-3 text-sm font-medium transition-all flex items-center gap-2
                ${
                  activeTab === 'responses'
                    ? 'border-b-2 border-gold-brand text-gold-dark bg-gold-light bg-opacity-5'
                    : 'text-navy-light hover:text-navy hover:bg-gray-50'
                }
              `}
            >
              <MessageSquare className="h-4 w-4" />
              Customer Responses
            </button>
            <button
              onClick={() => setActiveTab('versions')}
              className={`
                px-4 py-3 text-sm font-medium transition-all flex items-center gap-2
                ${
                  activeTab === 'versions'
                    ? 'border-b-2 border-gold-brand text-gold-dark bg-gold-light bg-opacity-5'
                    : 'text-navy-light hover:text-navy hover:bg-gray-50'
                }
              `}
            >
              <History className="h-4 w-4" />
              Version History
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'details' && (
          <>
        {/* Line Items Table */}
        <div className="bg-white rounded-lg border border-gold-brand border-opacity-18 overflow-hidden mb-6">
          <table className="w-full">
            <thead>
              <tr className="bg-navy text-gold-light">
                <th className="px-6 py-3 text-left text-sm font-semibold">
                  Item
                </th>
                <th className="px-6 py-3 text-right text-sm font-semibold">
                  Quantity
                </th>
                <th className="px-6 py-3 text-right text-sm font-semibold">
                  Unit Price
                </th>
                <th className="px-6 py-3 text-right text-sm font-semibold">
                  Total
                </th>
                <th className="px-6 py-3 text-center text-sm font-semibold w-12"></th>
              </tr>
            </thead>
            <tbody>
              {quote.lineItems.map((item: any) => (
                <tr
                  key={item.id}
                  className="border-b border-gray-100 hover:bg-gold-light hover:bg-opacity-5 transition-colors"
                >
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-navy">
                      {item.description}
                    </p>
                    {item.category && (
                      <p className="text-xs text-navy-light">{item.category}</p>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <QuantityEditor
                      initialQuantity={item.quantity}
                      unit={item.unit || 'units'}
                      onSave={(newQty) => handleQuantitySave(item.id, newQty)}
                      isAdjusted={false}
                    />
                  </td>
                  <td className="px-6 py-4 text-right">
                    <p className="text-sm font-medium text-navy">
                      ${item.unit_price.toFixed(2)}
                    </p>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <p className="text-sm font-semibold text-navy">
                      ${item.line_total.toFixed(2)}
                    </p>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button className="p-1 text-gray-400 hover:text-gold-brand transition-colors">
                      <Edit2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div className="border-t-2 border-gold-brand border-opacity-18 bg-gray-50">
            <div className="px-6 py-3 flex items-center justify-between">
              <span className="text-sm font-medium text-navy-light">
                Subtotal
              </span>
              <span className="text-sm font-semibold text-navy">
                ${quote.subtotal.toFixed(2)}
              </span>
            </div>
            <div className="px-6 py-3 flex items-center justify-between border-t border-gray-200">
              <span className="text-sm font-medium text-navy-light">Tax</span>
              <span className="text-sm font-semibold text-navy">
                ${quote.tax_placeholder.toFixed(2)}
              </span>
            </div>
            <div className="px-6 py-4 flex items-center justify-between border-t-2 border-gold-brand bg-white">
              <span className="text-lg font-bold text-navy">Grand Total</span>
              <span className="text-2xl font-bold text-gold-dark">
                ${quote.total.toFixed(2)}
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
            <button className="px-4 py-2 text-sm font-medium bg-navy text-gold-light rounded-lg hover:bg-navy-light transition-all">
              Save Changes
            </button>
          </div>
        </div>
          </>
        )}

        {/* Status Timeline Tab */}
        {activeTab === 'status' && (
          <div className="mb-6">
            <StatusTimeline quoteId={quoteId} />
          </div>
        )}

        {/* Customer Responses Tab */}
        {activeTab === 'responses' && (
          <div className="mb-6">
            <ResponsesList quoteId={quoteId} />
          </div>
        )}

        {/* Version History Tab */}
        {activeTab === 'versions' && (
          <div className="mb-6">
            <div className="bg-white rounded-lg border border-gold-brand border-opacity-18 p-8">
              <div className="text-center text-navy-light">
                <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">Version History</p>
                <p className="text-sm">Track changes and restore previous versions of this quote</p>
                <p className="text-xs mt-4 text-gray-500">Coming soon...</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Email Toast */}
      <EmailToast
        isVisible={showToast}
        onClose={() => setShowToast(false)}
        recipientEmail={quote.lead.email}
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
}
