import React, { useState } from 'react';
import { Download, Mail, Check, Loader2 } from 'lucide-react';

interface QuoteActionsProps {
  onDownload?: () => void;
  onSendEmail?: () => void;
  className?: string;
}

export const QuoteActions: React.FC<QuoteActionsProps> = ({
  onDownload,
  onSendEmail,
  className = '',
}) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleDownload = async () => {
    setIsDownloading(true);
    await onDownload?.();
    setTimeout(() => setIsDownloading(false), 1000);
  };

  const handleSendEmail = async () => {
    setIsSending(true);
    await onSendEmail?.();
    setTimeout(() => {
      setIsSending(false);
      setEmailSent(true);
      setTimeout(() => setEmailSent(false), 3000);
    }, 1500);
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Download PDF Button */}
      <button
        onClick={handleDownload}
        disabled={isDownloading}
        className="
          inline-flex items-center gap-2 px-4 h-10 
          bg-navy text-gold-light font-medium rounded-lg
          transition-all duration-200
          hover:bg-navy-light hover:border hover:border-gold-brand hover:shadow-gold-subtle
          focus:outline-none focus:ring-2 focus:ring-gold-brand focus:ring-opacity-50
          disabled:opacity-50 disabled:cursor-not-allowed
        "
      >
        {isDownloading ? (
          <Loader2 className="h-4 w-4 text-gold-brand animate-spin" />
        ) : (
          <Download className="h-4 w-4 text-gold-brand" />
        )}
        <span>Download PDF</span>
      </button>

      {/* Send Email Button */}
      <button
        onClick={handleSendEmail}
        disabled={isSending || emailSent}
        className="
          inline-flex items-center gap-2 px-4 h-10 
          bg-transparent text-navy font-medium rounded-lg
          border border-gold-brand border-opacity-30
          transition-all duration-200
          hover:bg-gold-light hover:bg-opacity-10 hover:border-gold-brand hover:border-opacity-100
          focus:outline-none focus:ring-2 focus:ring-gold-brand focus:ring-opacity-50
          disabled:opacity-50 disabled:cursor-not-allowed
        "
      >
        {isSending ? (
          <Loader2 className="h-4 w-4 text-gold-brand animate-spin" />
        ) : emailSent ? (
          <Check className="h-4 w-4 text-gold-brand" />
        ) : (
          <Mail className="h-4 w-4 text-gold-brand" />
        )}
        <span>{emailSent ? 'Sent!' : 'Send Email'}</span>
      </button>
    </div>
  );
};
