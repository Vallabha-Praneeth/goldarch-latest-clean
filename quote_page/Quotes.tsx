import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw, Filter, BarChart3, Clock, CheckCircle, XCircle, DollarSign } from 'lucide-react';
import { useQuotes } from '@/hooks/useQuotes';
import { QuoteCard } from '@/components/quotes/QuoteCard';
import { QuoteComparison } from '@/components/quotes/QuoteComparison';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type FilterStatus = 'all' | 'pending' | 'accepted' | 'rejected';

export default function QuotesPage() {
  const navigate = useNavigate();
  const { quotes, loading, refreshing, refresh, metrics, acceptQuote, rejectQuote } = useQuotes();
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [showComparison, setShowComparison] = useState(false);

  const filteredQuotes = filterStatus === 'all' 
    ? quotes 
    : quotes.filter(q => q.status === filterStatus);

  const filters: { value: FilterStatus; label: string; icon: React.ReactNode }[] = [
    { value: 'all', label: 'All', icon: <Filter className="w-3.5 h-3.5" /> },
    { value: 'pending', label: 'Pending', icon: <Clock className="w-3.5 h-3.5" /> },
    { value: 'accepted', label: 'Accepted', icon: <CheckCircle className="w-3.5 h-3.5" /> },
    { value: 'rejected', label: 'Rejected', icon: <XCircle className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-background/80 border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => navigate('/')}
                className="shrink-0"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <h1 className="text-2xl font-bold text-foreground">Quotes</h1>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={showComparison ? "default" : "outline"}
                size="sm"
                onClick={() => setShowComparison(!showComparison)}
                className="gap-2"
              >
                <BarChart3 className="w-4 h-4" />
                <span className="hidden sm:inline">Compare</span>
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={refresh}
                disabled={refreshing}
              >
                <RefreshCw className={cn("w-4 h-4", refreshing && "animate-spin")} />
              </Button>
            </div>
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            <div className="card-surface p-3">
              <p className="text-2xl font-bold text-foreground">{metrics.total}</p>
              <p className="text-xs text-muted-foreground">Total Quotes</p>
            </div>
            <div className="card-surface p-3">
              <p className="text-2xl font-bold text-amber-500">{metrics.pending}</p>
              <p className="text-xs text-muted-foreground">Pending</p>
            </div>
            <div className="card-surface p-3">
              <p className="text-2xl font-bold text-emerald-500">{metrics.accepted}</p>
              <p className="text-xs text-muted-foreground">Accepted</p>
            </div>
            <div className="card-surface p-3 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-primary" />
              <div>
                <p className="text-lg font-bold text-foreground">
                  ${(metrics.totalValue / 1000).toFixed(1)}K
                </p>
                <p className="text-xs text-muted-foreground">Total Value</p>
              </div>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {filters.map(filter => (
              <button
                key={filter.value}
                onClick={() => setFilterStatus(filter.value)}
                className={cn(
                  "flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap",
                  filterStatus === filter.value
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
              >
                {filter.icon}
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-6">
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="card-surface p-5 animate-pulse">
                <div className="h-6 bg-muted rounded w-1/2 mb-4" />
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-4 bg-muted rounded w-2/3" />
                  <div className="h-4 bg-muted rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : showComparison ? (
          <QuoteComparison 
            quotes={filteredQuotes}
            onAccept={acceptQuote}
            onReject={rejectQuote}
          />
        ) : filteredQuotes.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
              <Filter className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">No quotes found</h3>
            <p className="text-muted-foreground">
              {filterStatus === 'all' 
                ? 'No quotes have been created yet.' 
                : `No ${filterStatus} quotes found.`}
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredQuotes.map(quote => (
              <QuoteCard
                key={quote.id}
                quote={quote}
                onClick={() => navigate(`/quote/${quote.id}`)}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
