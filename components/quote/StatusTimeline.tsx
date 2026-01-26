/**
 * Status Timeline Component
 * Shows quote status history
 */

'use client';

import { useEffect, useState } from 'react';
import { Clock, CheckCircle, XCircle, Send, Eye, RefreshCw } from 'lucide-react';

interface StatusTimelineProps {
  quoteId: string;
}

const STATUS_ICONS: Record<string, any> = {
  draft: Clock,
  sent: Send,
  viewed: Eye,
  accepted: CheckCircle,
  rejected: XCircle,
  revised: RefreshCw,
  expired: XCircle,
};

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-500',
  sent: 'bg-blue-500',
  viewed: 'bg-purple-500',
  accepted: 'bg-green-500',
  rejected: 'bg-red-500',
  revised: 'bg-yellow-500',
  expired: 'bg-gray-500',
};

export function StatusTimeline({ quoteId }: StatusTimelineProps) {
  const [statusData, setStatusData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStatus();
  }, [quoteId]);

  const fetchStatus = async () => {
    try {
      const response = await fetch(`/api/quote/${quoteId}/status`);

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      console.log('Status data:', data);
      setStatusData(data);
    } catch (error) {
      console.error('Failed to fetch status:', error);
      setStatusData({ error: 'Failed to load status timeline' });
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (newStatus: string) => {
    if (!confirm(`Change status to "${newStatus}"?`)) return;

    try {
      const response = await fetch(`/api/quote/${quoteId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        fetchStatus();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to update status');
      }
    } catch (error) {
      alert('Failed to update status');
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gold-brand border-opacity-18 p-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold-brand mx-auto mb-4"></div>
          <p className="text-navy-light">Loading status timeline...</p>
        </div>
      </div>
    );
  }

  if (statusData?.error) {
    return (
      <div className="bg-white rounded-lg border border-red-200 p-6">
        <p className="text-red-600">{statusData.error}</p>
      </div>
    );
  }

  if (!statusData || (!statusData.status_history && !statusData.current_status)) {
    return (
      <div className="bg-white rounded-lg border border-gold-brand border-opacity-18 p-6">
        <p className="text-navy-light text-center py-8">No status history available</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gold-brand border-opacity-18 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-navy">Quote Status</h3>

        <div className="flex items-center gap-2">
          <span className="text-sm text-navy-light">Current:</span>
          <span className="px-3 py-1 bg-gold-light bg-opacity-20 border border-gold-brand rounded-lg text-gold-dark font-medium text-sm capitalize">
            {statusData?.current_status}
          </span>
        </div>
      </div>

      {/* Available Transitions */}
      {statusData?.can_transition_to?.length > 0 && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-navy-light mb-2">Change status to:</p>
          <div className="flex flex-wrap gap-2">
            {statusData.can_transition_to.map((status: string) => (
              <button
                key={status}
                onClick={() => updateStatus(status)}
                className="px-3 py-1 bg-white border border-gray-300 rounded-lg text-navy text-sm hover:border-gold-brand hover:text-gold-dark transition-colors capitalize"
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Timeline */}
      <div className="space-y-4">
        {statusData?.status_history?.map((item: any, index: number) => {
          const Icon = STATUS_ICONS[item.to_status] || Clock;
          const colorClass = STATUS_COLORS[item.to_status] || 'bg-gray-500';

          return (
            <div key={item.id} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className={`w-8 h-8 ${colorClass} rounded-full flex items-center justify-center text-white`}>
                  <Icon className="h-4 w-4" />
                </div>
                {index < statusData.status_history.length - 1 && (
                  <div className="w-0.5 h-full bg-gray-300 mt-2"></div>
                )}
              </div>

              <div className="flex-1 pb-8">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-navy capitalize">
                    {item.to_status}
                  </span>
                  <span className="text-sm text-navy-light">
                    {new Date(item.changed_at).toLocaleString()}
                  </span>
                </div>

                {item.from_status && (
                  <p className="text-sm text-navy-light">
                    From: <span className="capitalize">{item.from_status}</span>
                  </p>
                )}

                {item.notes && (
                  <p className="text-sm text-navy-light mt-1">{item.notes}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
