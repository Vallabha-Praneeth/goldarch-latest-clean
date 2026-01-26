'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { Handshake, Plus, Building2, Calendar, DollarSign, TrendingUp, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useState } from 'react';
import { toast } from 'sonner';
import { useBulkSelection } from '@/lib/hooks/use-bulk-selection';
import { SelectionCheckbox } from '@/components/bulk-operations/SelectionCheckbox';
import { BulkActionsToolbar } from '@/components/bulk-operations/BulkActionsToolbar';
import { QuickActions } from '@/components/cross-section/QuickActions';
import { Breadcrumbs } from '@/components/cross-section/Breadcrumbs';
import Link from 'next/link';

type DealStage = 'inquiry' | 'quote_requested' | 'quote_received' | 'negotiating' | 'po_sent' | 'confirmed' | 'in_production' | 'shipped' | 'delivered' | 'completed' | 'lost';

const stageConfig: Record<DealStage, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  inquiry: { label: 'Inquiry', variant: 'outline' },
  quote_requested: { label: 'Quote Requested', variant: 'secondary' },
  quote_received: { label: 'Quote Received', variant: 'secondary' },
  negotiating: { label: 'Negotiating', variant: 'default' },
  po_sent: { label: 'PO Sent', variant: 'default' },
  confirmed: { label: 'Confirmed', variant: 'default' },
  in_production: { label: 'In Production', variant: 'default' },
  shipped: { label: 'Shipped', variant: 'default' },
  delivered: { label: 'Delivered', variant: 'secondary' },
  completed: { label: 'Completed', variant: 'secondary' },
  lost: { label: 'Lost', variant: 'destructive' },
};

export default function DealsPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    supplier_id: '',
    project_id: '',
    estimated_value: '',
    probability: '50',
    expected_close_date: '',
    stage: 'inquiry' as DealStage,
  });

  const { data: deals, isLoading, error } = useQuery({
    queryKey: ['deals'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('deals')
        .select(`
          *,
          supplier:suppliers(name),
          project:projects(name)
        `)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  // Bulk selection state (must come after deals is fetched)
  const {
    selectedIds,
    selectedCount,
    totalCount,
    allSelected,
    someSelected,
    toggleSelection,
    selectAll,
    clearSelection,
    toggleSelectAll,
    isSelected,
  } = useBulkSelection(deals);

  const { data: suppliers } = useQuery({
    queryKey: ['suppliers-list'],
    queryFn: async () => {
      const { data } = await supabase.from('suppliers').select('id, name').order('name');
      return data || [];
    },
  });

  const { data: projects } = useQuery({
    queryKey: ['projects-list'],
    queryFn: async () => {
      const { data } = await supabase.from('projects').select('id, name').order('name');
      return data || [];
    },
  });

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      supplier_id: '',
      project_id: '',
      estimated_value: '',
      probability: '50',
      expected_close_date: '',
      stage: 'inquiry',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error('Deal title is required');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.from('deals').insert({
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        supplier_id: formData.supplier_id || null,
        project_id: formData.project_id || null,
        estimated_value: formData.estimated_value ? parseFloat(formData.estimated_value) : null,
        probability: formData.probability ? parseInt(formData.probability) : 50,
        expected_close_date: formData.expected_close_date || null,
        stage: formData.stage,
      });

      if (error) throw error;

      toast.success('Deal created successfully');
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      setDialogOpen(false);
      resetForm();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create deal');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number | null) => {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date: string | null) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString();
  };

  // Bulk delete handler
  const handleBulkDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedCount} deal${selectedCount > 1 ? 's' : ''}? This action cannot be undone.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('deals')
        .delete()
        .in('id', Array.from(selectedIds));

      if (error) throw error;

      toast.success(`${selectedCount} deal${selectedCount > 1 ? 's' : ''} deleted successfully`);
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      clearSelection();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete deals');
    }
  };

  // Bulk update status handler
  const handleBulkUpdateStatus = async (status: string) => {
    try {
      const { error } = await supabase
        .from('deals')
        .update({ stage: status })
        .in('id', Array.from(selectedIds));

      if (error) throw error;

      toast.success(`${selectedCount} deal${selectedCount > 1 ? 's' : ''} updated successfully`);
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      clearSelection();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update deals');
    }
  };

  // Calculate metrics
  const metrics = {
    total: deals?.length || 0,
    active: deals?.filter(d => d.stage && !['completed', 'lost'].includes(d.stage)).length || 0,
    won: deals?.filter(d => d.is_won === true).length || 0,
    totalValue: deals?.reduce((sum, d) => sum + (d.estimated_value || 0), 0) || 0,
  };

  return (
    <div className="space-y-6">
      <Breadcrumbs />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Handshake className="h-8 w-8" />
            Deals
          </h1>
          <p className="text-muted-foreground">Manage your deal pipeline</p>
        </div>
        <Button className="gap-2" onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4" />
          New Deal
        </Button>
      </div>

      {/* Add Deal Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New Deal</DialogTitle>
            <DialogDescription>
              Create a new deal in your pipeline
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Deal Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Steel Supply for Building A"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Deal details and notes"
                rows={3}
              />
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
                <Label htmlFor="project">Project</Label>
                <Select
                  value={formData.project_id}
                  onValueChange={(value) => setFormData({ ...formData, project_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select project" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects?.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="estimated_value">Estimated Value ($)</Label>
                <Input
                  id="estimated_value"
                  type="number"
                  value={formData.estimated_value}
                  onChange={(e) => setFormData({ ...formData, estimated_value: e.target.value })}
                  placeholder="10000"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="probability">Probability (%)</Label>
                <Input
                  id="probability"
                  type="number"
                  min="0"
                  max="100"
                  value={formData.probability}
                  onChange={(e) => setFormData({ ...formData, probability: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="stage">Stage</Label>
                <Select
                  value={formData.stage}
                  onValueChange={(value) => setFormData({ ...formData, stage: value as DealStage })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select stage" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(stageConfig).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        {config.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="expected_close_date">Expected Close Date</Label>
                <Input
                  id="expected_close_date"
                  type="date"
                  value={formData.expected_close_date}
                  onChange={(e) => setFormData({ ...formData, expected_close_date: e.target.value })}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Deal
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
            <p className="text-xs text-muted-foreground">Total Deals</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-blue-500">{metrics.active}</p>
            <p className="text-xs text-muted-foreground">Active</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-emerald-500">{metrics.won}</p>
            <p className="text-xs text-muted-foreground">Won</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            <div>
              <p className="text-lg font-bold">
                ${(metrics.totalValue / 1000).toFixed(1)}K
              </p>
              <p className="text-xs text-muted-foreground">Pipeline Value</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2 mt-2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="text-center py-12">
          <Handshake className="h-12 w-12 mx-auto text-destructive mb-4" />
          <p className="text-destructive">Failed to load deals</p>
          <p className="text-sm text-muted-foreground mt-1">{(error as Error).message}</p>
        </div>
      )}

      {/* Deals List */}
      {!isLoading && !error && deals && deals.length > 0 && (
        <div className="space-y-4">
          {deals.map((deal) => (
            <Card key={deal.id} className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <SelectionCheckbox
                      checked={isSelected(deal.id)}
                      onCheckedChange={() => toggleSelection(deal.id)}
                      aria-label={`Select ${deal.title}`}
                    />
                    <Link href={`/app-dashboard/deals/${deal.id}`} className="flex-1">
                      <CardTitle className="text-lg hover:text-primary transition-colors">{deal.title}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {deal.supplier?.name || 'No supplier'}
                        {deal.project?.name && ` • ${deal.project.name}`}
                      </p>
                    </Link>
                  </div>
                  <div className="flex items-center gap-2">
                    {deal.stage && stageConfig[deal.stage as DealStage] && (
                      <Badge variant={stageConfig[deal.stage as DealStage].variant}>
                        {stageConfig[deal.stage as DealStage].label}
                      </Badge>
                    )}
                    <QuickActions entityType="deal" entityId={deal.id} />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Estimated Value</p>
                    <p className="font-medium">{formatCurrency(deal.estimated_value)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Probability</p>
                    <p className="font-medium">{deal.probability ? `${deal.probability}%` : 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Expected Close</p>
                    <p className="font-medium">{formatDate(deal.expected_close_date)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Created</p>
                    <p className="font-medium">{formatDate(deal.created_at)}</p>
                  </div>
                </div>
                {deal.description && (
                  <p className="text-sm text-muted-foreground mt-4 pt-4 border-t line-clamp-2">
                    {deal.description}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && (!deals || deals.length === 0) && (
        <div className="text-center py-12">
          <Handshake className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No deals yet</p>
          <p className="text-sm text-muted-foreground mt-1">
            Deals will appear here once created
          </p>
        </div>
      )}

      {/* Bulk Actions Toolbar */}
      <BulkActionsToolbar
        selectedCount={selectedCount}
        totalCount={totalCount}
        onClearSelection={clearSelection}
        onSelectAll={selectAll}
        onDelete={handleBulkDelete}
        onUpdateStatus={handleBulkUpdateStatus}
        entityType="deals"
      />
    </div>
  );
}
