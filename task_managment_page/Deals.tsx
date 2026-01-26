import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/DashboardLayout';
import DealFormDialog from '@/components/DealFormDialog';
import DeleteConfirmDialog from '@/components/DeleteConfirmDialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { DollarSign, Building2, Calendar, Plus, MoreVertical, Pencil, Trash2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';

const stageColors: Record<string, string> = {
  inquiry: 'bg-gray-100 text-gray-800',
  quote_requested: 'bg-blue-100 text-blue-800',
  quote_received: 'bg-indigo-100 text-indigo-800',
  negotiating: 'bg-amber-100 text-amber-800',
  po_sent: 'bg-orange-100 text-orange-800',
  confirmed: 'bg-green-100 text-green-800',
  in_production: 'bg-cyan-100 text-cyan-800',
  shipped: 'bg-purple-100 text-purple-800',
  delivered: 'bg-teal-100 text-teal-800',
  completed: 'bg-emerald-100 text-emerald-800',
  lost: 'bg-red-100 text-red-800',
};

const Deals = () => {
  const [formOpen, setFormOpen] = useState(false);
  const [editingDeal, setEditingDeal] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string>('');

  const { data: deals, isLoading } = useQuery({
    queryKey: ['deals'],
    queryFn: async () => {
      const { data } = await supabase
        .from('deals')
        .select('*, suppliers(name)')
        .order('created_at', { ascending: false });
      return data || [];
    },
  });

  const handleEdit = (deal: any) => {
    setEditingDeal(deal);
    setFormOpen(true);
  };

  const handleDelete = (id: string) => {
    setDeletingId(id);
    setDeleteDialogOpen(true);
  };

  const handleAddNew = () => {
    setEditingDeal(null);
    setFormOpen(true);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Deals</h1>
            <p className="text-muted-foreground">Track your procurement deals and negotiations</p>
          </div>
          <Button onClick={handleAddNew}>
            <Plus className="h-4 w-4 mr-2" />
            New Deal
          </Button>
        </div>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : deals?.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground mb-4">No deals found</p>
              <Button onClick={handleAddNew}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Deal
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {deals?.map((deal: any) => (
              <Card key={deal.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg line-clamp-1">{deal.title}</CardTitle>
                      {deal.suppliers && (
                        <CardDescription className="flex items-center gap-1">
                          <Building2 className="h-3 w-3" />
                          {deal.suppliers.name}
                        </CardDescription>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {deal.stage && (
                        <Badge className={stageColors[deal.stage] || ''}>
                          {deal.stage.replace(/_/g, ' ')}
                        </Badge>
                      )}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(deal)}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDelete(deal.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {deal.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {deal.description}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-4 text-sm">
                    {(deal.estimated_value || deal.quoted_value || deal.final_value) && (
                      <div className="flex items-center gap-1 font-medium">
                        <DollarSign className="h-4 w-4 text-green-600" />
                        {(deal.final_value || deal.quoted_value || deal.estimated_value).toLocaleString()}
                        <span className="text-muted-foreground text-xs">
                          {deal.currency || 'USD'}
                        </span>
                      </div>
                    )}
                    {deal.expected_close_date && (
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        {format(new Date(deal.expected_close_date), 'MMM d, yyyy')}
                      </div>
                    )}
                  </div>

                  {deal.probability != null && (
                    <div className="pt-2">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-muted-foreground">Probability</span>
                        <span className="font-medium">{deal.probability}%</span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all"
                          style={{ width: `${deal.probability}%` }}
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <DealFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        deal={editingDeal}
      />

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Deal"
        description="Are you sure you want to delete this deal? This action cannot be undone."
        table="deals"
        id={deletingId}
        invalidateKeys={['deals', 'dashboard-stats', 'recent-deals']}
      />
    </DashboardLayout>
  );
};

export default Deals;
