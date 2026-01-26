import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Building, Briefcase, Clock, CheckCircle, XCircle, FileText, DollarSign, Package } from 'lucide-react';
import { useQuotes } from '@/hooks/useQuotes';
import { QuoteComparison } from '@/components/quotes/QuoteComparison';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const STATUS_CONFIG = {
  pending: { 
    bg: 'bg-amber-100 dark:bg-amber-900/30', 
    text: 'text-amber-700 dark:text-amber-400',
    border: 'border-amber-200 dark:border-amber-800'
  },
  accepted: { 
    bg: 'bg-emerald-100 dark:bg-emerald-900/30', 
    text: 'text-emerald-700 dark:text-emerald-400',
    border: 'border-emerald-200 dark:border-emerald-800'
  },
  rejected: { 
    bg: 'bg-rose-100 dark:bg-rose-900/30', 
    text: 'text-rose-700 dark:text-rose-400',
    border: 'border-rose-200 dark:border-rose-800'
  },
  expired: { 
    bg: 'bg-muted', 
    text: 'text-muted-foreground',
    border: 'border-border'
  },
};

export default function QuoteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getQuoteById, getQuotesByDeal, acceptQuote, rejectQuote, loading } = useQuotes();

  const quote = getQuoteById(id || '');
  const relatedQuotes = quote?.deal?.id ? getQuotesByDeal(quote.deal.id) : [];

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-40 backdrop-blur-xl bg-background/80 border-b border-border">
          <div className="container mx-auto px-4 py-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/quotes')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </div>
        </header>
        <main className="container mx-auto px-4 py-16 text-center">
          <h2 className="text-xl font-semibold text-foreground mb-2">Quote not found</h2>
          <p className="text-muted-foreground">The quote you're looking for doesn't exist.</p>
        </main>
      </div>
    );
  }

  const statusConfig = STATUS_CONFIG[quote.status] || STATUS_CONFIG.pending;
  const isExpired = quote.valid_until && new Date(quote.valid_until) < new Date();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-background/80 border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate('/quotes')}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-xl font-bold text-foreground">{quote.quote_number}</h1>
                <p className="text-sm text-muted-foreground">{quote.supplier?.name}</p>
              </div>
            </div>
            <div className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium border",
              statusConfig.bg,
              statusConfig.text,
              statusConfig.border
            )}>
              {quote.status === 'pending' && <Clock className="w-4 h-4" />}
              {quote.status === 'accepted' && <CheckCircle className="w-4 h-4" />}
              {quote.status === 'rejected' && <XCircle className="w-4 h-4" />}
              <span className="capitalize">{quote.status}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Price Summary */}
        <div className="card-surface p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Total Amount</p>
              <p className="text-4xl font-bold text-primary">${quote.total.toLocaleString()}</p>
            </div>
            {quote.status === 'pending' && (
              <div className="flex gap-2">
                <Button 
                  onClick={() => acceptQuote(quote.id)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  Accept
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => rejectQuote(quote.id)}
                  className="border-rose-300 text-rose-600 hover:bg-rose-50 dark:border-rose-800 dark:hover:bg-rose-900/20 gap-2"
                >
                  <XCircle className="w-4 h-4" />
                  Reject
                </Button>
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border">
            <div>
              <p className="text-sm text-muted-foreground">Subtotal</p>
              <p className="text-lg font-semibold text-foreground">${quote.subtotal.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Tax</p>
              <p className="text-lg font-semibold text-foreground">${quote.tax.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Currency</p>
              <p className="text-lg font-semibold text-foreground">{quote.currency}</p>
            </div>
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="card-surface p-5">
            <div className="flex items-center gap-2 mb-4 text-muted-foreground">
              <Briefcase className="w-5 h-5" />
              <h3 className="font-medium">Deal Information</h3>
            </div>
            <p className="text-lg font-semibold text-foreground mb-1">{quote.deal?.title || 'No deal'}</p>
            <p className="text-sm text-muted-foreground">Stage: {quote.deal?.stage || 'N/A'}</p>
          </div>

          <div className="card-surface p-5">
            <div className="flex items-center gap-2 mb-4 text-muted-foreground">
              <Building className="w-5 h-5" />
              <h3 className="font-medium">Supplier</h3>
            </div>
            <p className="text-lg font-semibold text-foreground mb-1">{quote.supplier?.name}</p>
            <p className="text-sm text-muted-foreground">{quote.supplier?.city}</p>
          </div>

          <div className="card-surface p-5">
            <div className="flex items-center gap-2 mb-4 text-muted-foreground">
              <Calendar className="w-5 h-5" />
              <h3 className="font-medium">Dates</h3>
            </div>
            <div className="space-y-2">
              <div>
                <p className="text-xs text-muted-foreground">Quote Date</p>
                <p className="font-medium text-foreground">{new Date(quote.quote_date).toLocaleDateString()}</p>
              </div>
              {quote.valid_until && (
                <div>
                  <p className="text-xs text-muted-foreground">Valid Until</p>
                  <p className={cn("font-medium", isExpired ? "text-rose-500" : "text-foreground")}>
                    {new Date(quote.valid_until).toLocaleDateString()}
                    {isExpired && ' (Expired)'}
                  </p>
                </div>
              )}
            </div>
          </div>

          {quote.notes && (
            <div className="card-surface p-5">
              <div className="flex items-center gap-2 mb-4 text-muted-foreground">
                <FileText className="w-5 h-5" />
                <h3 className="font-medium">Notes</h3>
              </div>
              <p className="text-foreground">{quote.notes}</p>
            </div>
          )}
        </div>

        {/* Line Items */}
        {quote.items.length > 0 && (
          <div className="card-surface p-5">
            <div className="flex items-center gap-2 mb-4 text-muted-foreground">
              <Package className="w-5 h-5" />
              <h3 className="font-medium">Line Items</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 px-3 text-sm font-medium text-muted-foreground">Item</th>
                    <th className="text-right py-2 px-3 text-sm font-medium text-muted-foreground">Qty</th>
                    <th className="text-right py-2 px-3 text-sm font-medium text-muted-foreground">Unit Price</th>
                    <th className="text-right py-2 px-3 text-sm font-medium text-muted-foreground">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {quote.items.map(item => (
                    <tr key={item.id} className="border-b border-border/50">
                      <td className="py-3 px-3 text-foreground">{item.name}</td>
                      <td className="py-3 px-3 text-right text-muted-foreground">{item.quantity}</td>
                      <td className="py-3 px-3 text-right text-muted-foreground">${item.unit_price.toLocaleString()}</td>
                      <td className="py-3 px-3 text-right font-medium text-foreground">${item.total.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Quote Comparison */}
        {relatedQuotes.length > 1 && (
          <div className="card-surface p-5">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              Compare Quotes for "{quote.deal?.title}"
            </h3>
            <QuoteComparison 
              quotes={relatedQuotes}
              onAccept={acceptQuote}
              onReject={rejectQuote}
            />
          </div>
        )}
      </main>
    </div>
  );
}
