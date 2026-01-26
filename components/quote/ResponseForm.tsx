/**
 * Customer Response Form Component
 * Path: components/quote/ResponseForm.tsx
 * Customer-facing form for accepting/rejecting/requesting changes
 */

'use client';

import { useState } from 'react';
import { ResponseType } from '../types';

interface ResponseFormProps {
  shareToken: string;
  quoteNumber: string;
  onSuccess?: () => void;
}

export default function ResponseForm({ shareToken, quoteNumber, onSuccess }: ResponseFormProps) {
  const [responseType, setResponseType] = useState<ResponseType | ''>('');
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [signature, setSignature] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`/api/quote/public/${shareToken}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          response_type: responseType,
          customer_name: customerName,
          customer_email: customerEmail,
          signature,
          notes,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit response');
      }

      setSuccess(true);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-8 text-center">
        <div className="text-green-600 text-5xl mb-4">✓</div>
        <h3 className="text-2xl font-bold text-green-900 mb-2">
          Response Submitted Successfully
        </h3>
        <p className="text-green-700">
          Thank you for your response. We will be in touch shortly.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-8 border-t-4 border-yellow-500">
      <h3 className="text-2xl font-bold text-gray-900 mb-6">
        Respond to Quote {quoteNumber}
      </h3>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Response Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Your Response <span className="text-red-500">*</span>
          </label>
          <div className="space-y-3">
            <label className="flex items-center p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
              <input
                type="radio"
                name="responseType"
                value="accept"
                checked={responseType === 'accept'}
                onChange={(e) => setResponseType(e.target.value as ResponseType)}
                className="w-5 h-5 text-green-600 border-gray-300 focus:ring-green-500"
                required
              />
              <div className="ml-3">
                <div className="text-lg font-semibold text-green-700">Accept Quote</div>
                <div className="text-sm text-gray-600">I approve this quote as-is</div>
              </div>
            </label>

            <label className="flex items-center p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
              <input
                type="radio"
                name="responseType"
                value="reject"
                checked={responseType === 'reject'}
                onChange={(e) => setResponseType(e.target.value as ResponseType)}
                className="w-5 h-5 text-red-600 border-gray-300 focus:ring-red-500"
              />
              <div className="ml-3">
                <div className="text-lg font-semibold text-red-700">Reject Quote</div>
                <div className="text-sm text-gray-600">I decline this quote</div>
              </div>
            </label>

            <label className="flex items-center p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
              <input
                type="radio"
                name="responseType"
                value="request_changes"
                checked={responseType === 'request_changes'}
                onChange={(e) => setResponseType(e.target.value as ResponseType)}
                className="w-5 h-5 text-blue-600 border-gray-300 focus:ring-blue-500"
              />
              <div className="ml-3">
                <div className="text-lg font-semibold text-blue-700">Request Changes</div>
                <div className="text-sm text-gray-600">I need modifications to this quote</div>
              </div>
            </label>
          </div>
        </div>

        {/* Customer Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Your Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
            placeholder="John Doe"
            required
          />
        </div>

        {/* Customer Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Your Email
          </label>
          <input
            type="email"
            value={customerEmail}
            onChange={(e) => setCustomerEmail(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
            placeholder="john@example.com"
          />
        </div>

        {/* Signature (for acceptance) */}
        {responseType === 'accept' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Digital Signature <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={signature}
              onChange={(e) => setSignature(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent font-signature text-2xl"
              placeholder="Type your full name as signature"
              required={responseType === 'accept'}
            />
            <p className="mt-1 text-xs text-gray-500">
              By typing your name, you agree to the terms and conditions of this quote
            </p>
          </div>
        )}

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Additional Notes
            {responseType === 'request_changes' && <span className="text-red-500"> *</span>}
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
            placeholder={
              responseType === 'request_changes'
                ? 'Please describe the changes you would like...'
                : 'Any additional comments or questions...'
            }
            required={responseType === 'request_changes'}
          />
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className={`w-full py-3 px-6 rounded-lg font-semibold text-white transition-colors ${
            loading
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-yellow-600 hover:bg-yellow-700'
          }`}
        >
          {loading ? 'Submitting...' : 'Submit Response'}
        </button>
      </form>
    </div>
  );
}
