'use client';

import { use, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Handshake,
  Building2,
  Calendar,
  DollarSign,
  TrendingUp,
  ArrowLeft,
  Edit,
  Trash2,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { RelatedEntities } from '@/components/cross-section/RelatedEntities';
import { Breadcrumbs } from '@/components/cross-section/Breadcrumbs';

interface PageProps {
  params: Promise<{ dealId: string }>;
}

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

export default function DealDetailPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const dealId = resolvedParams.dealId;
  const router = useRouter();
  const queryClient = useQueryClient();
  const [deleting, setDeleting] = useState(false);

  const { data: deal, isLoading, error } = useQuery({
    queryKey: ['deal', dealId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('deals')
        .select(`
          *,
          supplier:suppliers(id, name, email, phone),
          project:projects(id, name, location)
        `)
        .eq('id', dealId)
        .single();

      if (error) throw error;
      return data;
    },
  });

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this deal? This action cannot be undone.')) {
      return;
    }

    setDeleting(true);
    try {
      const { error } = await supabase.from('deals').delete().eq('id', dealId);
      if (error) throw error;

      toast.success('Deal deleted successfully');
      router.push('/app-dashboard/deals');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete deal');
      setDeleting(false);
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
    return new Date(date).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (error) {
    return (
      <div className="space-y-6">
        <Breadcrumbs />
        <div className="text-center py-12">
          <Handshake className="h-12 w-12 mx-auto text-destructive mb-4" />
          <p className="text-destructive">Failed to load deal</p>
          <p className="text-sm text-muted-foreground mt-1">{(error as Error).message}</p>
          <Button className="mt-4" asChild>
            <Link href="/app-dashboard/deals">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Deals
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs />

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/app-dashboard/deals">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            {isLoading ? (
              <>
                <Skeleton className="h-8 w-64 mb-2" />
                <Skeleton className="h-4 w-32" />
              </>
            ) : (
              <>
                <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                  <Handshake className="h-8 w-8" />
                  {deal?.title}
                </h1>
                <p className="text-muted-foreground">
                  Created {formatDate(deal?.created_at)}
                </p>
              </>
            )}
          </div>
        </div>

        {!isLoading && deal && (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              disabled={deleting}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {deleting ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Left Column - Deal Details */}
        <div className="md:col-span-2 space-y-6">
          {/* Overview Card */}
          <Card>
            <CardHeader>
              <CardTitle>Deal Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Status</p>
                      {deal?.stage && stageConfig[deal.stage as DealStage] && (
                        <Badge variant={stageConfig[deal.stage as DealStage].variant}>
                          {stageConfig[deal.stage as DealStage].label}
                        </Badge>
                      )}
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Estimated Value</p>
                      <p className="text-lg font-semibold text-green-600">
                        {formatCurrency(deal?.estimated_value)}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Probability</p>
                      <div className="flex items-center gap-2">
                        <p className="text-lg font-semibold">
                          {deal?.probability ? `${deal.probability}%` : 'N/A'}
                        </p>
                        <TrendingUp className="h-4 w-4 text-green-500" />
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Expected Close Date</p>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <p className="font-medium">{formatDate(deal?.expected_close_date)}</p>
                      </div>
                    </div>
                  </div>

                  {deal?.description && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Description</p>
                      <p className="text-sm border rounded-lg p-3 bg-muted/30">
                        {deal.description}
                      </p>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Related Entities */}
          <RelatedEntities entityType="deal" entityId={dealId} />
        </div>

        {/* Right Column - Related Info */}
        <div className="space-y-6">
          {/* Supplier Card */}
          {!isLoading && deal?.supplier && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Supplier
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Link
                  href={`/supplier/${deal.supplier.id}`}
                  className="block hover:bg-muted/50 p-3 rounded-lg transition-colors"
                >
                  <p className="font-semibold">{deal.supplier.name}</p>
                  {deal.supplier.email && (
                    <p className="text-sm text-muted-foreground">{deal.supplier.email}</p>
                  )}
                  {deal.supplier.phone && (
                    <p className="text-sm text-muted-foreground">{deal.supplier.phone}</p>
                  )}
                </Link>
              </CardContent>
            </Card>
          )}

          {/* Project Card */}
          {!isLoading && deal?.project && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Project
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Link
                  href={`/app-dashboard/projects`}
                  className="block hover:bg-muted/50 p-3 rounded-lg transition-colors"
                >
                  <p className="font-semibold">{deal.project.name}</p>
                  {deal.project.location && (
                    <p className="text-sm text-muted-foreground">{deal.project.location}</p>
                  )}
                </Link>
              </CardContent>
            </Card>
          )}

          {/* Metrics Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Key Metrics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {isLoading ? (
                <Skeleton className="h-16 w-full" />
              ) : (
                <>
                  <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <span className="text-sm text-muted-foreground">Weighted Value</span>
                    <span className="font-semibold">
                      {deal?.estimated_value && deal?.probability
                        ? formatCurrency((deal.estimated_value * deal.probability) / 100)
                        : 'N/A'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <span className="text-sm text-muted-foreground">Days in Pipeline</span>
                    <span className="font-semibold">
                      {deal?.created_at
                        ? Math.floor(
                            (Date.now() - new Date(deal.created_at).getTime()) /
                              (1000 * 60 * 60 * 24)
                          )
                        : 'N/A'}
                    </span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
