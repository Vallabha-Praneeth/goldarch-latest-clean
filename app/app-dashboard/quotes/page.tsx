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
import { FileText, DollarSign, Send, ThumbsUp, ThumbsDown, Plus, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Breadcrumbs } from '@/components/cross-section/Breadcrumbs';

// MODULE-1C Imports
import { QuoteStatusBadge } from '@/components/quote-status-badge';
import { QuoteApprovalDialog } from '@/components/quote-approval-dialog';
import {
  useSubmitQuote,
  useApproveQuote,
  useRejectQuote,
  useAcceptQuote,
  useDeclineQuote
} from '@/lib/hooks/use-quote-approval';
import {
  canPerformAction,
  type QuoteStatus,
  type ApprovalAction,
  type UserRole
} from '@/lib/types/quote-approval.types';

type FilterStatus = 'all' | 'draft' | 'pending' | 'approved' | 'rejected' | 'accepted' | 'declined';

export default function QuotesPage() {
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();

  // MODULE-1C: User role and approval dialog state
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState<any>(null);
  const [approvalAction, setApprovalAction] = useState<ApprovalAction | null>(null);

  // MODULE-1C: Mutation hooks
  const { mutate: submitQuote, isPending: isSubmitting } = useSubmitQuote();
  const { mutate: acceptQuote, isPending: isAccepting } = useAcceptQuote();
  const { mutate: declineQuote, isPending: isDeclining } = useDeclineQuote();

  const [formData, setFormData] = useState({
    quote_number: '',
    supplier_id: '',
    deal_id: '',
    quote_date: new Date().toISOString().split('T')[0],
    valid_until: '',
    subtotal: '',
    tax: '',
    total: '',
    status: 'draft' as QuoteStatus, // Changed from 'pending' to 'draft'
    notes: '',
  });

  // MODULE-1C: Get current user and role
  useEffect(() => {
    async function getUserRole() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .single();

        if (roleData) {
          setUserRole(roleData.role as UserRole);
        }
      }
    }
    getUserRole();
  }, []);

  const { data: quotes, isLoading } = useQuery({
    queryKey: ['quotes'],
    queryFn: async () => {
      const response = await fetch('/api/quote');
      if (!response.ok) {
        throw new Error('Failed to fetch quotes');
      }
      const data = await response.json();
      return data.quotes || [];
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
      status: 'draft',
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

      // Create a minimal lead first (required for quotations table)
      const { data: lead, error: leadError } = await supabase.from('quote_leads').insert({
        name: 'Draft Lead',
        email: 'draft@example.com',
      }).select().single();

      if (leadError) throw leadError;

      const response = await fetch('/api/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lead_id: lead.id,
          status: formData.status,
          subtotal,
          tax_placeholder: tax,
          total,
          internal_notes: formData.notes.trim() || null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create quote');
      }

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

  // MODULE-1C: Updated metrics for 6-state workflow
  const metrics = {
    total: quotes?.length || 0,
    draft: quotes?.filter(q => q.status === 'draft').length || 0,
    pending: quotes?.filter(q => q.status === 'pending').length || 0,
    approved: quotes?.filter(q => q.status === 'approved').length || 0,
    rejected: quotes?.filter(q => q.status === 'rejected').length || 0,
    accepted: quotes?.filter(q => q.status === 'accepted').length || 0,
    declined: quotes?.filter(q => q.status === 'declined').length || 0,
    totalValue: quotes?.reduce((sum, q) => sum + (q.total || 0), 0) || 0,
  };

  // MODULE-1C: Action handlers
  const handleSubmitQuote = (quoteId: string) => {
    submitQuote(
      { quote_id: quoteId, notes: 'Submitted for approval' },
      {
        onSuccess: () => {
          toast.success('Quote submitted for approval');
          queryClient.invalidateQueries({ queryKey: ['quotes'] });
        },
        onError: (err: any) => {
          toast.error(err.message || 'Failed to submit quote');
        },
      }
    );
  };

  const handleApprove = (quote: any) => {
    setSelectedQuote(quote);
    setApprovalAction('approve');
    setApprovalDialogOpen(true);
  };

  const handleReject = (quote: any) => {
    setSelectedQuote(quote);
    setApprovalAction('reject');
    setApprovalDialogOpen(true);
  };

  const handleAcceptQuote = (quoteId: string) => {
    acceptQuote(
      { quote_id: quoteId, notes: 'Accepted' },
      {
        onSuccess: () => {
          toast.success('Quote accepted');
          queryClient.invalidateQueries({ queryKey: ['quotes'] });
        },
        onError: (err: any) => {
          toast.error(err.message || 'Failed to accept quote');
        },
      }
    );
  };

  const handleDeclineQuote = (quoteId: string) => {
    declineQuote(quoteId, {
      onSuccess: () => {
        toast.success('Quote declined');
        queryClient.invalidateQueries({ queryKey: ['quotes'] });
      },
      onError: (err: any) => {
        toast.error(err.message || 'Failed to decline quote');
      },
    });
  };

  return (
    <div className="space-y-6">
      <Breadcrumbs />

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
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="accepted">Accepted</SelectItem>
                    <SelectItem value="declined">Declined</SelectItem>
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
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-bold">{metrics.total}</p>
            <p className="text-xs text-muted-foreground">Total Quotes</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-gray-500">{metrics.draft}</p>
            <p className="text-xs text-muted-foreground">Draft</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-amber-500">{metrics.pending}</p>
            <p className="text-xs text-muted-foreground">Pending Approval</p>
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
      <div className="flex gap-2 flex-wrap">
        {(['all', 'draft', 'pending', 'approved', 'rejected', 'accepted', 'declined'] as FilterStatus[]).map((status) => (
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
          {filteredQuotes.map((quote) => {
            const isOwner = currentUserId === quote.created_by;
            const canSubmit = canPerformAction(userRole, 'submit', quote.status, isOwner);
            const canApprove = canPerformAction(userRole, 'approve', quote.status, isOwner);
            const canReject = canPerformAction(userRole, 'reject', quote.status, isOwner);
            const canAccept = canPerformAction(userRole, 'accept', quote.status, isOwner);
            const canDecline = canPerformAction(userRole, 'decline', quote.status, isOwner);

            return (
              <Card key={quote.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{quote.quote_number}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {quote.supplier?.name} • {quote.deal?.title || 'No deal'}
                      </p>
                    </div>
                    <QuoteStatusBadge status={quote.status} />
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

                  {/* MODULE-1C: Action Buttons */}
                  <div className="flex gap-2 mt-4 pt-4 border-t flex-wrap">
                    {canSubmit && (
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => handleSubmitQuote(quote.id)}
                        disabled={isSubmitting}
                        className="gap-1"
                      >
                        <Send className="h-3 w-3" />
                        Submit for Approval
                      </Button>
                    )}

                    {canApprove && (
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => handleApprove(quote)}
                        className="gap-1 bg-green-600 hover:bg-green-700"
                      >
                        <ThumbsUp className="h-3 w-3" />
                        Approve
                      </Button>
                    )}

                    {canReject && (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleReject(quote)}
                        className="gap-1"
                      >
                        <ThumbsDown className="h-3 w-3" />
                        Reject
                      </Button>
                    )}

                    {canAccept && (
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => handleAcceptQuote(quote.id)}
                        disabled={isAccepting}
                        className="gap-1"
                      >
                        <ThumbsUp className="h-3 w-3" />
                        Accept Quote
                      </Button>
                    )}

                    {canDecline && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeclineQuote(quote.id)}
                        disabled={isDeclining}
                        className="gap-1"
                      >
                        <ThumbsDown className="h-3 w-3" />
                        Decline Quote
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            {filterStatus === 'all' ? 'No quotes yet' : `No ${filterStatus} quotes`}
          </p>
        </div>
      )}

      {/* MODULE-1C: Approval Dialog */}
      <QuoteApprovalDialog
        open={approvalDialogOpen}
        onOpenChange={setApprovalDialogOpen}
        quote={selectedQuote}
        action={approvalAction}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['quotes'] });
        }}
      />
    </div>
  );
}
