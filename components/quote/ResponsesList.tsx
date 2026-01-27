// FILE: components/quote/ResponsesList.tsx
/**
 * Customer Responses List Component
 * Path: components/quote/ResponsesList.tsx
 * Admin view to see all customer responses for a quote
 */

'use client';

import { useState, useEffect } from 'react';
import { CustomerResponse } from '../types';

interface ResponsesListProps {
  quoteId: string;
}

export default function ResponsesList({ quoteId }: ResponsesListProps) {
  const [responses, setResponses] = useState<CustomerResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    const fetchResponses = async () => {
      try {
        const response = await fetch(`/api/quote/${quoteId}/responses`);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `API error: ${response.status}`);
        }

        const data = await response.json();
        console.log('Responses data:', data);
        if (cancelled) return;
        setResponses(data.responses || []);
      } catch (err: any) {
        console.error('Failed to fetch responses:', err);
        if (cancelled) return;
        setError(err.message || 'Failed to load responses');
      } finally {
        if (cancelled) return;
        setLoading(false);
      }
    };

    fetchResponses();

    return () => {
      cancelled = true;
    };
  }, [quoteId]);

  const getResponseBadge = (type: string) => {
    switch (type) {
      case 'accept':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'reject':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'request_changes':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getResponseIcon = (type: string) => {
    switch (type) {
      case 'accept':
        return '✓';
      case 'reject':
        return '✗';
      case 'request_changes':
        return '↻';
      default:
        return '?';
    }
  };

  const getResponseLabel = (type: string) => {
    switch (type) {
      case 'accept':
        return 'Accepted';
      case 'reject':
        return 'Rejected';
      case 'request_changes':
        return 'Changes Requested';
      default:
        return type;
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-700">Error: {error}</p>
      </div>
    );
  }

  if (responses.length === 0) {
    return (
      <div className="bg-gray-50 rounded-lg p-8 text-center border-2 border-dashed border-gray-300">
        <p className="text-gray-600">No customer responses yet</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">
          Customer Responses ({responses.length})
        </h3>
      </div>

      <div className="divide-y divide-gray-200">
        {responses.map((response) => (
          <div key={response.id} className="p-6 hover:bg-gray-50 transition-colors">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-3">
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getResponseBadge(
                    response.response_type
                  )}`}
                >
                  <span className="mr-1">{getResponseIcon(response.response_type)}</span>
                  {getResponseLabel(response.response_type)}
                </span>
              </div>
              <div className="text-sm text-gray-500">
                {new Date(response.responded_at).toLocaleString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-gray-900">
                  {response.customer_name}
                </span>
                {response.customer_email && (
                  <>
                    <span className="text-gray-400">•</span>
                    <a
                      href={`mailto:${response.customer_email}`}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      {response.customer_email}
                    </a>
                  </>
                )}
              </div>

              {response.signature && (
                <div className="bg-gray-50 rounded p-3 border border-gray-200">
                  <div className="text-xs text-gray-600 mb-1">Digital Signature:</div>
                  <div className="font-signature text-xl text-gray-900">
                    {response.signature}
                  </div>
                </div>
              )}

              {response.notes && (
                <div className="bg-gray-50 rounded p-3 border border-gray-200">
                  <div className="text-xs text-gray-600 mb-1">Notes:</div>
                  <div className="text-gray-900 whitespace-pre-wrap">{response.notes}</div>
                </div>
              )}

              {response.ip_address && (
                <div className="text-xs text-gray-500">
                  IP: {response.ip_address}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
