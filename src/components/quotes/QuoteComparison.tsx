import { CheckCircle, XCircle, TrendingDown, TrendingUp, Award } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Quote } from '@/hooks/useQuotes';
import { Button } from '@/components/ui/button';

interface QuoteComparisonProps {
  quotes: Quote[];
  onAccept?: (quoteId: string) => void;
  onReject?: (quoteId: string) => void;
}

export function QuoteComparison({ quotes, onAccept, onReject }: QuoteComparisonProps) {
  if (quotes.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No quotes available for comparison
      </div>
    );
  }

  // Sort by total price (lowest first)
  const sortedQuotes = [...quotes].sort((a, b) => a.total - b.total);
  const lowestPrice = sortedQuotes[0]?.total || 0;
  const highestPrice = sortedQuotes[sortedQuotes.length - 1]?.total || 0;
  const avgPrice = quotes.reduce((sum, q) => sum + q.total, 0) / quotes.length;

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card-surface p-4 text-center">
          <div className="flex items-center justify-center gap-2 text-emerald-500 mb-1">
            <TrendingDown className="w-4 h-4" />
            <span className="text-xs font-medium uppercase">Lowest</span>
          </div>
          <p className="text-2xl font-bold text-foreground">${lowestPrice.toLocaleString()}</p>
        </div>
        <div className="card-surface p-4 text-center">
          <div className="flex items-center justify-center gap-2 text-muted-foreground mb-1">
            <span className="text-xs font-medium uppercase">Average</span>
          </div>
          <p className="text-2xl font-bold text-foreground">${avgPrice.toLocaleString()}</p>
        </div>
        <div className="card-surface p-4 text-center">
          <div className="flex items-center justify-center gap-2 text-rose-500 mb-1">
            <TrendingUp className="w-4 h-4" />
            <span className="text-xs font-medium uppercase">Highest</span>
          </div>
          <p className="text-2xl font-bold text-foreground">${highestPrice.toLocaleString()}</p>
        </div>
      </div>

      {/* Comparison Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Supplier</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Quote #</th>
              <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Total</th>
              <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">vs Lowest</th>
              <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
              <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedQuotes.map((quote, index) => {
              const priceDiff = quote.total - lowestPrice;
              const priceDiffPercent = lowestPrice > 0 ? (priceDiff / lowestPrice) * 100 : 0;
              const isBest = index === 0;

              return (
                <tr 
                  key={quote.id} 
                  className={cn(
                    "border-b border-border/50 transition-colors",
                    isBest && "bg-emerald-50/50 dark:bg-emerald-900/10"
                  )}
                >
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      {isBest && <Award className="w-4 h-4 text-amber-500" />}
                      <div>
                        <p className="font-medium text-foreground">{quote.supplier?.name}</p>
                        <p className="text-xs text-muted-foreground">{quote.supplier?.city}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-sm text-muted-foreground">
                    {quote.quote_number}
                  </td>
                  <td className="py-4 px-4 text-right">
                    <span className={cn(
                      "font-semibold",
                      isBest ? "text-emerald-600 dark:text-emerald-400" : "text-foreground"
                    )}>
                      ${quote.total.toLocaleString()}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-right">
                    {priceDiff === 0 ? (
                      <span className="text-emerald-600 dark:text-emerald-400 text-sm font-medium">Best Price</span>
                    ) : (
                      <span className="text-rose-500 text-sm">
                        +${priceDiff.toLocaleString()} ({priceDiffPercent.toFixed(1)}%)
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-4 text-center">
                    <span className={cn(
                      "inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium capitalize",
                      quote.status === 'pending' && "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
                      quote.status === 'accepted' && "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
                      quote.status === 'rejected' && "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400"
                    )}>
                      {quote.status}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    {quote.status === 'pending' && (
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-100"
                          onClick={() => onAccept?.(quote.id)}
                        >
                          <CheckCircle className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-rose-600 hover:text-rose-700 hover:bg-rose-100"
                          onClick={() => onReject?.(quote.id)}
                        >
                          <XCircle className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
