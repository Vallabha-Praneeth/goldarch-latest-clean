/**
 * Share Quote Button Component (Admin)
 * Add to quote review page
 */

'use client';

import { useState } from 'react';
import { Share2, Copy, Check } from 'lucide-react';

interface ShareQuoteButtonProps {
  quoteId: string;
}

export function ShareQuoteButton({ quoteId }: ShareQuoteButtonProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const generateLink = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/quote/${quoteId}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ expiresInDays: 30 }),
      });

      const data = await response.json();
      if (data.success) {
        setShareUrl(data.shareUrl);
      }
    } catch (error) {
      alert('Failed to generate share link');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (shareUrl) {
      navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <>
      <button
        onClick={() => {
          setShowDialog(true);
          if (!shareUrl) generateLink();
        }}
        className="flex items-center gap-2 px-4 py-2 border border-gold-brand text-gold-dark rounded-lg hover:bg-gold-light hover:bg-opacity-10 transition-colors"
      >
        <Share2 className="h-4 w-4" />
        Share Quote
      </button>

      {showDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold text-navy mb-4">Share Quote</h2>

            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold-brand mx-auto"></div>
              </div>
            ) : shareUrl ? (
              <div>
                <p className="text-sm text-navy-light mb-4">
                  Share this link with your customer. It expires in 30 days.
                </p>

                <div className="flex gap-2 mb-4">
                  <input
                    type="text"
                    readOnly
                    value={shareUrl}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                  <button
                    onClick={copyToClipboard}
                    className="px-4 py-2 bg-gold-brand text-white rounded-lg hover:bg-gold-dark transition-colors"
                  >
                    {copied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
                  </button>
                </div>

                {copied && (
                  <p className="text-sm text-green-600 mb-4">✓ Copied to clipboard!</p>
                )}
              </div>
            ) : null}

            <button
              onClick={() => setShowDialog(false)}
              className="w-full px-4 py-2 bg-gray-200 text-navy rounded-lg hover:bg-gray-300 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
