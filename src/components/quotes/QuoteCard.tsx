import { Clock, CheckCircle, XCircle, Calendar, Briefcase, Building, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Quote } from '@/hooks/useQuotes';

interface QuoteCardProps {
  quote: Quote;
  onClick?: () => void;
}

const STATUS_CONFIG = {
  pending: { 
    bg: 'bg-amber-100 dark:bg-amber-900/30', 
    text: 'text-amber-700 dark:text-amber-400', 
    Icon: Clock 
  },
  accepted: { 
    bg: 'bg-emerald-100 dark:bg-emerald-900/30', 
    text: 'text-emerald-700 dark:text-emerald-400', 
    Icon: CheckCircle 
  },
  rejected: { 
    bg: 'bg-rose-100 dark:bg-rose-900/30', 
    text: 'text-rose-700 dark:text-rose-400', 
    Icon: XCircle 
  },
  expired: { 
    bg: 'bg-muted', 
    text: 'text-muted-foreground', 
    Icon: Calendar 
  },
};

export function QuoteCard({ quote, onClick }: QuoteCardProps) {
  const statusConfig = STATUS_CONFIG[quote.status] || STATUS_CONFIG.pending;
  const StatusIcon = statusConfig.Icon;
  const isExpired = quote.valid_until && new Date(quote.valid_until) < new Date();

  return (
    <div 
      onClick={onClick}
      className={cn(
        "card-surface-hover p-5 cursor-pointer transition-all duration-300",
        "hover:scale-[1.02] hover:shadow-lg"
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-foreground">
            {quote.quote_number}
          </span>
          <div className={cn(
            "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
            statusConfig.bg,
            statusConfig.text
          )}>
            <StatusIcon className="w-3.5 h-3.5" />
            <span className="capitalize">{quote.status}</span>
          </div>
        </div>
        <span className="text-lg font-bold text-primary">
          ${quote.total.toLocaleString()}
        </span>
      </div>

      {/* Details */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Briefcase className="w-4 h-4" />
          <span>{quote.deal?.title || 'No deal assigned'}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Building className="w-4 h-4" />
          <span>{quote.supplier?.name || 'Unknown supplier'}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="w-4 h-4" />
          <span>{new Date(quote.quote_date).toLocaleDateString()}</span>
        </div>
        {quote.valid_until && (
          <div className={cn(
            "flex items-center gap-2 text-sm",
            isExpired ? "text-rose-500" : "text-muted-foreground"
          )}>
            {isExpired ? (
              <AlertCircle className="w-4 h-4" />
            ) : (
              <Clock className="w-4 h-4" />
            )}
            <span>
              Valid until {new Date(quote.valid_until).toLocaleDateString()}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
