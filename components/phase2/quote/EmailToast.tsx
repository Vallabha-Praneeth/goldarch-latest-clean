import React, { useEffect } from 'react';
import { CheckCircle, X, ExternalLink } from 'lucide-react';

interface EmailToastProps {
  isVisible: boolean;
  onClose: () => void;
  recipientEmail?: string;
  onViewTracking?: () => void;
}

export const EmailToast: React.FC<EmailToastProps> = ({
  isVisible,
  onClose,
  recipientEmail = 'client@example.com',
  onViewTracking,
}) => {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  return (
    <div className="fixed top-4 right-4 z-50 animate-slide-in-right">
      <div className="bg-white border border-gold-brand border-opacity-30 rounded-lg shadow-gold-subtle p-4 max-w-md">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gold-light bg-opacity-20 flex items-center justify-center">
            <CheckCircle className="h-6 w-6 text-gold-brand" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold text-navy mb-1">
              Quote sent successfully
            </h4>
            <p className="text-sm text-navy-light mb-2">
              Email sent to {recipientEmail}
            </p>
            {onViewTracking && (
              <button
                onClick={onViewTracking}
                className="inline-flex items-center gap-1 text-sm text-gold-brand hover:underline"
              >
                View tracking
                <ExternalLink className="h-3 w-3" />
              </button>
            )}
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="flex-shrink-0 text-gray-400 hover:text-navy transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
