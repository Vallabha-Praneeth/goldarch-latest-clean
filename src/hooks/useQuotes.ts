import { useState, useEffect, useMemo } from 'react';

export interface Quote {
  id: string;
  quote_number: string;
  quote_date: string;
  valid_until: string | null;
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  subtotal: number;
  tax: number;
  total: number;
  currency: string;
  notes: string | null;
  items: QuoteItem[];
  deal: { id: string; title: string; stage: string } | null;
  supplier: { id: string; name: string; city: string; logo_url: string | null } | null;
}

export interface QuoteItem {
  id: string;
  name: string;
  quantity: number;
  unit_price: number;
  total: number;
}

// Mock data for initial development
const mockQuotes: Quote[] = [
  {
    id: '1',
    quote_number: 'Q-2024-001',
    quote_date: '2024-01-15',
    valid_until: '2024-02-15',
    status: 'pending',
    subtotal: 45000,
    tax: 4500,
    total: 49500,
    currency: 'USD',
    notes: 'Includes installation and 1-year warranty',
    items: [
      { id: '1', name: 'Steel Beams (Grade A)', quantity: 100, unit_price: 250, total: 25000 },
      { id: '2', name: 'Concrete Mix (Premium)', quantity: 50, unit_price: 400, total: 20000 },
    ],
    deal: { id: 'd1', title: 'Downtown Tower Project', stage: 'Negotiation' },
    supplier: { id: 's1', name: 'BuildRight Materials', city: 'Chicago', logo_url: null },
  },
  {
    id: '2',
    quote_number: 'Q-2024-002',
    quote_date: '2024-01-10',
    valid_until: '2024-02-10',
    status: 'accepted',
    subtotal: 28000,
    tax: 2800,
    total: 30800,
    currency: 'USD',
    notes: 'Best price guaranteed',
    items: [
      { id: '3', name: 'Electrical Wiring Kit', quantity: 200, unit_price: 80, total: 16000 },
      { id: '4', name: 'Circuit Breakers', quantity: 40, unit_price: 300, total: 12000 },
    ],
    deal: { id: 'd1', title: 'Downtown Tower Project', stage: 'Negotiation' },
    supplier: { id: 's2', name: 'ElectroPro Supplies', city: 'Detroit', logo_url: null },
  },
  {
    id: '3',
    quote_number: 'Q-2024-003',
    quote_date: '2024-01-08',
    valid_until: '2024-01-20',
    status: 'rejected',
    subtotal: 62000,
    tax: 6200,
    total: 68200,
    currency: 'USD',
    notes: 'Price too high compared to competitors',
    items: [
      { id: '5', name: 'HVAC System Complete', quantity: 1, unit_price: 45000, total: 45000 },
      { id: '6', name: 'Ductwork Installation', quantity: 1, unit_price: 17000, total: 17000 },
    ],
    deal: { id: 'd2', title: 'Residential Complex Phase 2', stage: 'Proposal' },
    supplier: { id: 's3', name: 'CoolAir Systems', city: 'Phoenix', logo_url: null },
  },
  {
    id: '4',
    quote_number: 'Q-2024-004',
    quote_date: '2024-01-18',
    valid_until: '2024-03-18',
    status: 'pending',
    subtotal: 18500,
    tax: 1850,
    total: 20350,
    currency: 'USD',
    notes: 'Bulk discount applied',
    items: [
      { id: '7', name: 'Plumbing Fixtures Set', quantity: 25, unit_price: 400, total: 10000 },
      { id: '8', name: 'PVC Piping (100m)', quantity: 17, unit_price: 500, total: 8500 },
    ],
    deal: { id: 'd1', title: 'Downtown Tower Project', stage: 'Negotiation' },
    supplier: { id: 's4', name: 'WaterWorks Pro', city: 'Houston', logo_url: null },
  },
  {
    id: '5',
    quote_number: 'Q-2024-005',
    quote_date: '2024-01-20',
    valid_until: '2024-02-28',
    status: 'pending',
    subtotal: 55000,
    tax: 5500,
    total: 60500,
    currency: 'USD',
    notes: 'Premium grade materials with extended warranty',
    items: [
      { id: '9', name: 'Steel Beams (Grade A)', quantity: 120, unit_price: 260, total: 31200 },
      { id: '10', name: 'Reinforcement Bars', quantity: 200, unit_price: 119, total: 23800 },
    ],
    deal: { id: 'd1', title: 'Downtown Tower Project', stage: 'Negotiation' },
    supplier: { id: 's5', name: 'SteelMax Industries', city: 'Pittsburgh', logo_url: null },
  },
];

export function useQuotes(dealId: string | null = null) {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchQuotes = async () => {
    // Simulating API call with mock data
    await new Promise(resolve => setTimeout(resolve, 500));
    
    let filteredQuotes = [...mockQuotes];
    if (dealId) {
      filteredQuotes = filteredQuotes.filter(q => q.deal?.id === dealId);
    }
    return filteredQuotes;
  };

  const loadQuotes = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchQuotes();
      setQuotes(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load quotes');
    } finally {
      setLoading(false);
    }
  };

  const refresh = async () => {
    setRefreshing(true);
    try {
      const data = await fetchQuotes();
      setQuotes(data);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadQuotes();
  }, [dealId]);

  const updateQuote = async (quoteId: string, updates: Partial<Quote>) => {
    setQuotes(prev => prev.map(q => q.id === quoteId ? { ...q, ...updates } : q));
    return { success: true };
  };

  const acceptQuote = async (quoteId: string) => {
    return updateQuote(quoteId, { status: 'accepted' });
  };

  const rejectQuote = async (quoteId: string, reason?: string) => {
    return updateQuote(quoteId, { status: 'rejected', notes: reason || null });
  };

  const getQuotesByStatus = (status: Quote['status']) => {
    return quotes.filter(q => q.status === status);
  };

  const getQuotesByDeal = (targetDealId: string) => {
    return quotes.filter(q => q.deal?.id === targetDealId);
  };

  const compareQuotes = (targetDealId: string) => {
    return getQuotesByDeal(targetDealId).sort((a, b) => a.total - b.total);
  };

  const metrics = useMemo(() => ({
    total: quotes.length,
    pending: getQuotesByStatus('pending').length,
    accepted: getQuotesByStatus('accepted').length,
    rejected: getQuotesByStatus('rejected').length,
    totalValue: quotes.reduce((sum, q) => sum + q.total, 0),
    averageValue: quotes.length > 0 
      ? quotes.reduce((sum, q) => sum + q.total, 0) / quotes.length 
      : 0,
  }), [quotes]);

  const getQuoteById = (id: string) => quotes.find(q => q.id === id);

  return {
    quotes,
    loading,
    refreshing,
    error,
    refresh,
    updateQuote,
    acceptQuote,
    rejectQuote,
    getQuotesByStatus,
    getQuotesByDeal,
    compareQuotes,
    getQuoteById,
    metrics,
  };
}
