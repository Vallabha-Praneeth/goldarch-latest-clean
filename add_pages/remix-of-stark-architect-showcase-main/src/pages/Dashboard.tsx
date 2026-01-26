import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, FolderKanban, Handshake, FileText, TrendingUp, Clock } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import type { Database } from '@/integrations/supabase/types';

type DealStage = Database['public']['Enums']['deal_stage'];

const stageConfig: Record<DealStage, { label: string; color: string; order: number }> = {
  inquiry: { label: 'Inquiry', color: 'bg-slate-500', order: 1 },
  quote_requested: { label: 'Quote Requested', color: 'bg-blue-500', order: 2 },
  quote_received: { label: 'Quote Received', color: 'bg-cyan-500', order: 3 },
  negotiating: { label: 'Negotiating', color: 'bg-amber-500', order: 4 },
  po_sent: { label: 'PO Sent', color: 'bg-orange-500', order: 5 },
  confirmed: { label: 'Confirmed', color: 'bg-emerald-500', order: 6 },
  in_production: { label: 'In Production', color: 'bg-purple-500', order: 7 },
  shipped: { label: 'Shipped', color: 'bg-indigo-500', order: 8 },
  delivered: { label: 'Delivered', color: 'bg-teal-500', order: 9 },
  completed: { label: 'Completed', color: 'bg-green-600', order: 10 },
  lost: { label: 'Lost', color: 'bg-red-500', order: 11 },
};

const Dashboard = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const [suppliers, projects, deals, categories] = await Promise.all([
        supabase.from('suppliers').select('id', { count: 'exact', head: true }),
        supabase.from('projects').select('id', { count: 'exact', head: true }),
        supabase.from('deals').select('id', { count: 'exact', head: true }),
        supabase.from('categories').select('id', { count: 'exact', head: true }),
      ]);

      return {
        suppliers: suppliers.count || 0,
        projects: projects.count || 0,
        deals: deals.count || 0,
        categories: categories.count || 0,
      };
    },
  });

  const { data: pipelineData, isLoading: pipelineLoading } = useQuery({
    queryKey: ['deal-pipeline'],
    queryFn: async () => {
      const { data } = await supabase
        .from('deals')
        .select('stage, estimated_value');
      
      if (!data) return [];

      // Group by stage
      const stageGroups = data.reduce((acc, deal) => {
        const stage = deal.stage || 'inquiry';
        if (!acc[stage]) {
          acc[stage] = { count: 0, value: 0 };
        }
        acc[stage].count += 1;
        acc[stage].value += Number(deal.estimated_value) || 0;
        return acc;
      }, {} as Record<string, { count: number; value: number }>);

      // Convert to array sorted by stage order
      return Object.entries(stageConfig)
        .filter(([key]) => key !== 'lost')
        .map(([key, config]) => ({
          stage: key as DealStage,
          ...config,
          count: stageGroups[key]?.count || 0,
          value: stageGroups[key]?.value || 0,
        }))
        .sort((a, b) => a.order - b.order);
    },
  });

  const { data: recentSuppliers } = useQuery({
    queryKey: ['recent-suppliers'],
    queryFn: async () => {
      const { data } = await supabase
        .from('suppliers')
        .select('id, name, city, created_at, categories(name)')
        .order('created_at', { ascending: false })
        .limit(5);
      return data || [];
    },
  });

  const { data: recentDeals } = useQuery({
    queryKey: ['recent-deals'],
    queryFn: async () => {
      const { data } = await supabase
        .from('deals')
        .select('id, title, stage, estimated_value, created_at, suppliers(name)')
        .order('created_at', { ascending: false })
        .limit(5);
      return data || [];
    },
  });

  const statCards = [
    { name: 'Total Suppliers', value: stats?.suppliers, icon: Users, color: 'text-blue-500' },
    { name: 'Active Projects', value: stats?.projects, icon: FolderKanban, color: 'text-green-500' },
    { name: 'Open Deals', value: stats?.deals, icon: Handshake, color: 'text-amber-500' },
    { name: 'Categories', value: stats?.categories, icon: FileText, color: 'text-purple-500' },
  ];

  const totalDeals = pipelineData?.reduce((sum, stage) => sum + stage.count, 0) || 0;
  const totalPipelineValue = pipelineData?.reduce((sum, stage) => sum + stage.value, 0) || 0;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Overview of your supplier management system</p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat) => (
            <Card key={stat.name}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.name}
                </CardTitle>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  <div className="text-3xl font-bold">{stat.value}</div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Deal Pipeline */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Deal Pipeline
                </CardTitle>
                <CardDescription>Visual overview of deals by stage</CardDescription>
              </div>
              {totalPipelineValue > 0 && (
                <div className="text-right">
                  <p className="text-2xl font-bold">${totalPipelineValue.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">Total Pipeline Value</p>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {pipelineLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : totalDeals === 0 ? (
              <p className="text-muted-foreground text-center py-8">No deals in pipeline yet</p>
            ) : (
              <div className="space-y-4">
                {pipelineData?.map((stage) => {
                  const percentage = totalDeals > 0 ? (stage.count / totalDeals) * 100 : 0;
                  
                  return (
                    <div key={stage.stage} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${stage.color}`} />
                          <span className="font-medium">{stage.label}</span>
                        </div>
                        <div className="flex items-center gap-4 text-muted-foreground">
                          <span>{stage.count} {stage.count === 1 ? 'deal' : 'deals'}</span>
                          {stage.value > 0 && (
                            <span className="font-medium text-foreground">
                              ${stage.value.toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
                        <div 
                          className={`h-full ${stage.color} transition-all duration-500`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Recent Suppliers
              </CardTitle>
              <CardDescription>Latest additions to your supplier directory</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentSuppliers?.map((supplier: any) => (
                  <div key={supplier.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{supplier.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {supplier.city || 'No location'} • {supplier.categories?.name || 'Uncategorized'}
                      </p>
                    </div>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </div>
                ))}
                {recentSuppliers?.length === 0 && (
                  <p className="text-muted-foreground text-center py-4">No suppliers yet</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Handshake className="h-5 w-5" />
                Recent Deals
              </CardTitle>
              <CardDescription>Latest deal activity</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentDeals?.map((deal: any) => (
                  <div key={deal.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{deal.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {deal.suppliers?.name} • {deal.stage?.replace('_', ' ')}
                      </p>
                    </div>
                    {deal.estimated_value && (
                      <span className="text-sm font-medium">
                        ${deal.estimated_value.toLocaleString()}
                      </span>
                    )}
                  </div>
                ))}
                {recentDeals?.length === 0 && (
                  <p className="text-muted-foreground text-center py-4">No deals yet</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
