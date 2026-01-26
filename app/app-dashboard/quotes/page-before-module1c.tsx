'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FileText, DollarSign, Clock, CheckCircle, XCircle, Plus, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';
import { toast } from 'sonner';

type FilterStatus = 'all' | 'pending' | 'accepted' | 'rejected';
type QuoteStatus = 'pending' | 'accepted' | 'rejected';

export default function QuotesPage() {
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    quote_number: '',
    supplier_id: '',
    deal_id: '',
    quote_date: new Date().toISOString().split('T')[0],
    valid_until: '',
    subtotal: '',
    tax: '',
    total: '',
    status: 'pending' as QuoteStatus,
    notes: '',
  });

  const { data: quotes, isLoading } = useQuery({
    queryKey: ['quotes'],
    queryFn: async () => {
      const { data } = await supabase
        .from('quotes')
        .select(`
          *,
          supplier:suppliers(name, city),
          deal:deals(title)
        `)
        .order('created_at', { ascending: false });
      return data || [];
    },
  });

  const { data: suppliers } = useQuery({
    queryKey: ['suppliers-list'],
    queryFn: async () => {
      const { data } = await supabase.from('suppliers').select('id, name').order('name');
      return data || [];
    },
  });

  const { data: deals } = useQuery({
    queryKey: ['deals-list'],
    queryFn: async () => {
      const { data } = await supabase.from('deals').select('id, title').order('title');
      return data || [];
    },
  });

  const resetForm = () => {
    setFormData({
      quote_number: '',
      supplier_id: '',
      deal_id: '',
      quote_date: new Date().toISOString().split('T')[0],
      valid_until: '',
      subtotal: '',
      tax: '',
      total: '',
      status: 'pending',
      notes: '',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.quote_number.trim()) {
      toast.error('Quote number is required');
      return;
    }

    setLoading(true);

    try {
      const subtotal = formData.subtotal ? parseFloat(formData.subtotal) : 0;
      const tax = formData.tax ? parseFloat(formData.tax) : 0;
      const total = formData.total ? parseFloat(formData.total) : subtotal + tax;

      const { error } = await supabase.from('quotes').insert({
        quote_number: formData.quote_number.trim(),
        supplier_id: formData.supplier_id || null,
        deal_id: formData.deal_id || null,
        quote_date: formData.quote_date || new Date().toISOString().split('T')[0],
        valid_until: formData.valid_until || null,
        subtotal,
        tax,
        total,
        status: formData.status,
        notes: formData.notes.trim() || null,
      });

      if (error) throw error;

      toast.success('Quote created successfully');
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      setDialogOpen(false);
      resetForm();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create quote');
    } finally {
      setLoading(false);
    }
  };

  const filteredQuotes = filterStatus === 'all'
    ? quotes
    : quotes?.filter(q => q.status === filterStatus);

  const metrics = {
    total: quotes?.length || 0,
    pending: quotes?.filter(q => q.status === 'pending').length || 0,
    accepted: quotes?.filter(q => q.status === 'accepted').length || 0,
    rejected: quotes?.filter(q => q.status === 'rejected').length || 0,
    totalValue: quotes?.reduce((sum, q) => sum + (q.total || 0), 0) || 0,
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: any }> = {
      pending: { variant: 'secondary', icon: Clock },
      accepted: { variant: 'default', icon: CheckCircle },
      rejected: { variant: 'destructive', icon: XCircle },
    };
    const config = variants[status] || variants.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {status}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <FileText className="h-8 w-8" />
            Quotes
          </h1>
          <p className="text-muted-foreground">Manage supplier quotes</p>
        </div>
        <Button className="gap-2" onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4" />
          New Quote
        </Button>
      </div>

      {/* Add Quote Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New Quote</DialogTitle>
            <DialogDescription>
              Create a new supplier quote
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quote_number">Quote Number *</Label>
                <Input
                  id="quote_number"
                  value={formData.quote_number}
                  onChange={(e) => setFormData({ ...formData, quote_number: e.target.value })}
                  placeholder="e.g., Q-2024-001"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value as QuoteStatus })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="accepted">Accepted</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="supplier">Supplier</Label>
                <Select
                  value={formData.supplier_id}
                  onValueChange={(value) => setFormData({ ...formData, supplier_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select supplier" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers?.map((supplier) => (
                      <SelectItem key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="deal">Related Deal</Label>
                <Select
                  value={formData.deal_id}
                  onValueChange={(value) => setFormData({ ...formData, deal_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select deal" />
                  </SelectTrigger>
                  <SelectContent>
                    {deals?.map((deal) => (
                      <SelectItem key={deal.id} value={deal.id}>
                        {deal.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quote_date">Quote Date</Label>
                <Input
                  id="quote_date"
                  type="date"
                  value={formData.quote_date}
                  onChange={(e) => setFormData({ ...formData, quote_date: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="valid_until">Valid Until</Label>
                <Input
                  id="valid_until"
                  type="date"
                  value={formData.valid_until}
                  onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="subtotal">Subtotal ($)</Label>
                <Input
                  id="subtotal"
                  type="number"
                  value={formData.subtotal}
                  onChange={(e) => setFormData({ ...formData, subtotal: e.target.value })}
                  placeholder="0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tax">Tax ($)</Label>
                <Input
                  id="tax"
                  type="number"
                  value={formData.tax}
                  onChange={(e) => setFormData({ ...formData, tax: e.target.value })}
                  placeholder="0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="total">Total ($)</Label>
                <Input
                  id="total"
                  type="number"
                  value={formData.total}
                  onChange={(e) => setFormData({ ...formData, total: e.target.value })}
                  placeholder="Auto-calculated"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional notes about this quote"
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Quote
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-bold">{metrics.total}</p>
            <p className="text-xs text-muted-foreground">Total Quotes</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-amber-500">{metrics.pending}</p>
            <p className="text-xs text-muted-foreground">Pending</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-emerald-500">{metrics.accepted}</p>
            <p className="text-xs text-muted-foreground">Accepted</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            <div>
              <p className="text-lg font-bold">
                ${(metrics.totalValue / 1000).toFixed(1)}K
              </p>
              <p className="text-xs text-muted-foreground">Total Value</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {(['all', 'pending', 'accepted', 'rejected'] as FilterStatus[]).map((status) => (
          <Button
            key={status}
            variant={filterStatus === status ? 'default' : 'outline'}
            onClick={() => setFilterStatus(status)}
            size="sm"
          >
            {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
          </Button>
        ))}
      </div>

      {/* Quotes List */}
      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading quotes...</p>
        </div>
      ) : filteredQuotes && filteredQuotes.length > 0 ? (
        <div className="space-y-4">
          {filteredQuotes.map((quote) => (
            <Card key={quote.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{quote.quote_number}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {quote.supplier?.name} • {quote.deal?.title || 'No deal'}
                    </p>
                  </div>
                  {getStatusBadge(quote.status)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Quote Date</p>
                    <p className="font-medium">
                      {new Date(quote.quote_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Valid Until</p>
                    <p className="font-medium">
                      {quote.valid_until ? new Date(quote.valid_until).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Subtotal</p>
                    <p className="font-medium">${quote.subtotal?.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Total</p>
                    <p className="font-bold text-lg">${quote.total?.toLocaleString()}</p>
                  </div>
                </div>
                {quote.notes && (
                  <p className="text-sm text-muted-foreground mt-4 pt-4 border-t">
                    {quote.notes}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            {filterStatus === 'all' ? 'No quotes yet' : `No ${filterStatus} quotes`}
          </p>
        </div>
      )}
    </div>
  );
}
