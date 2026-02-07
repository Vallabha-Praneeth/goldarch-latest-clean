'use client';

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Users,
  FolderKanban,
  Handshake,
  FileText,
  TrendingUp,
  CheckSquare,
  Activity,
  AlertCircle,
  DollarSign,
  Calendar,
  ArrowUpRight,
  Clock,
  FileCheck,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import Link from 'next/link';

export default function DashboardPage() {
  // Comprehensive stats query
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const [
        suppliers,
        projects,
        deals,
        quotations,
        tasks,
        activities,
        dealsWithValue,
        tasksByStatus,
        quotationsByStatus,
      ] = await Promise.all([
        supabase.from('suppliers').select('id', { count: 'exact', head: true }),
        supabase.from('projects').select('id', { count: 'exact', head: true }),
        supabase.from('deals').select('id', { count: 'exact', head: true }),
        supabase.from('quotations').select('id', { count: 'exact', head: true }),
        supabase.from('tasks').select('id', { count: 'exact', head: true }),
        supabase.from('activities').select('id', { count: 'exact', head: true }),
        supabase.from('deals').select('estimated_value'),
        supabase.from('tasks').select('status'),
        supabase.from('quotations').select('status'),
      ]);

      const pipelineValue = (dealsWithValue.data || []).reduce(
        (sum, deal) => sum + (deal.estimated_value || 0),
        0
      );

      const taskStats = (tasksByStatus.data || []).reduce((acc, task) => {
        acc[task.status as string] = (acc[task.status as string] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const quoteStats = (quotationsByStatus.data || []).reduce((acc, quote) => {
        acc[quote.status as string] = (acc[quote.status as string] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return {
        suppliers: suppliers.count || 0,
        projects: projects.count || 0,
        deals: deals.count || 0,
        quotations: quotations.count || 0,
        tasks: tasks.count || 0,
        activities: activities.count || 0,
        pipelineValue,
        taskStats,
        quoteStats,
        overdueTasks: taskStats.pending || 0, // Simplified
        activeDeals: deals.count || 0, // Simplified
      };
    },
  });

  // Recent activities
  const { data: recentActivities } = useQuery({
    queryKey: ['recent-activities'],
    queryFn: async () => {
      const { data } = await supabase
        .from('activities')
        .select('id, title, activity_type, created_at, supplier:suppliers(name)')
        .order('created_at', { ascending: false })
        .limit(5);
      return data || [];
    },
  });

  // Upcoming tasks
  const { data: upcomingTasks } = useQuery({
    queryKey: ['upcoming-tasks'],
    queryFn: async () => {
      const { data } = await supabase
        .from('tasks')
        .select('id, title, due_date, priority, status')
        .in('status', ['pending', 'in_progress'])
        .order('due_date', { ascending: true, nullsFirst: false })
        .limit(5);
      return data || [];
    },
  });

  // Active deals
  const { data: activeDeals } = useQuery({
    queryKey: ['active-deals'],
    queryFn: async () => {
      const { data } = await supabase
        .from('deals')
        .select('id, title, stage, estimated_value, supplier:suppliers(name)')
        .not('stage', 'in', '(completed,lost)')
        .order('created_at', { ascending: false })
        .limit(5);
      return data || [];
    },
  });

  // Pending quote approvals
  const { data: pendingApprovals } = useQuery({
    queryKey: ['pending-approvals'],
    queryFn: async () => {
      const { data } = await supabase
        .from('quotes')
        .select('id, quote_number, title, total, currency, submitted_at, created_at')
        .eq('status', 'pending')
        .order('submitted_at', { ascending: true, nullsFirst: false })
        .limit(5);
      return data || [];
    },
  });

  const statCards = [
    {
      name: 'Pipeline Value',
      value: `$${((stats?.pipelineValue || 0) / 1000).toFixed(1)}K`,
      icon: DollarSign,
      color: 'text-green-500',
      change: '+12.5%',
      link: '/app-dashboard/deals',
    },
    {
      name: 'Active Deals',
      value: stats?.activeDeals,
      icon: Handshake,
      color: 'text-amber-500',
      change: '+3',
      link: '/app-dashboard/deals',
    },
    {
      name: 'Total Quotes',
      value: stats?.quotations,
      icon: FileText,
      color: 'text-purple-500',
      change: '+8',
      link: '/app-dashboard/quotes',
    },
    {
      name: 'Overdue Tasks',
      value: stats?.overdueTasks,
      icon: AlertCircle,
      color: 'text-red-500',
      change: '-2',
      link: '/app-dashboard/tasks',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Overview of your construction management system</p>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Link key={stat.name} href={stat.link}>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
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
                  <div className="flex items-baseline justify-between">
                    <div className="text-3xl font-bold">{stat.value}</div>
                    <span className="text-xs text-green-600 font-medium">{stat.change}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Secondary Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{isLoading ? '-' : stats?.suppliers}</p>
                <p className="text-xs text-muted-foreground">Suppliers</p>
              </div>
              <Users className="h-8 w-8 text-blue-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{isLoading ? '-' : stats?.projects}</p>
                <p className="text-xs text-muted-foreground">Projects</p>
              </div>
              <FolderKanban className="h-8 w-8 text-green-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{isLoading ? '-' : stats?.tasks}</p>
                <p className="text-xs text-muted-foreground">Total Tasks</p>
              </div>
              <CheckSquare className="h-8 w-8 text-indigo-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{isLoading ? '-' : stats?.activities}</p>
                <p className="text-xs text-muted-foreground">Activities Logged</p>
              </div>
              <Activity className="h-8 w-8 text-teal-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Pending Approvals */}
        <Card className="border-amber-200 bg-amber-50/30">
          <CardHeader className="bg-slate-800 rounded-t-lg">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-white">
              <Clock className="h-4 w-4 text-amber-400" />
              Pending Approvals
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-14 w-full" />
                ))}
              </div>
            ) : pendingApprovals && pendingApprovals.length > 0 ? (
              <div className="space-y-2">
                {pendingApprovals.map((quote) => (
                  <Link
                    key={quote.id}
                    href={`/app-dashboard/quotes?status=pending&id=${quote.id}`}
                    className="block"
                  >
                    <div className="p-3 rounded-lg border border-amber-200 bg-white hover:bg-amber-50 transition-colors cursor-pointer">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{quote.quote_number || quote.title}</p>
                          <p className="text-xs text-muted-foreground truncate">{quote.title}</p>
                        </div>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700 border border-amber-200 ml-2 shrink-0">
                          <Clock className="h-3 w-3" />
                          Pending
                        </span>
                      </div>
                      {quote.total != null && (
                        <p className="text-xs font-medium text-green-600 mt-1">
                          {quote.currency || 'USD'} {quote.total.toLocaleString()}
                        </p>
                      )}
                      {quote.submitted_at && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Submitted {new Date(quote.submitted_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </Link>
                ))}
                <Button variant="ghost" size="sm" className="w-full text-xs" asChild>
                  <Link href="/app-dashboard/quotes?status=pending">
                    View All Pending <ArrowUpRight className="h-3 w-3 ml-1" />
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="text-center py-8">
                <FileCheck className="h-8 w-8 mx-auto text-green-500 opacity-50 mb-2" />
                <p className="text-sm text-muted-foreground">No pending approvals</p>
                <p className="text-xs text-green-600 font-medium">All caught up!</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Active Deals */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Handshake className="h-4 w-4" />
              Active Deals
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : activeDeals && activeDeals.length > 0 ? (
              <div className="space-y-2">
                {activeDeals.map((deal) => (
                  <div key={deal.id} className="p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium truncate">{deal.title}</p>
                        <p className="text-xs text-muted-foreground">{deal.supplier?.name}</p>
                      </div>
                      <Badge variant="outline" className="text-xs capitalize ml-2">
                        {deal.stage?.replace('_', ' ')}
                      </Badge>
                    </div>
                    {deal.estimated_value && (
                      <p className="text-xs font-medium text-green-600 mt-1">
                        ${deal.estimated_value.toLocaleString()}
                      </p>
                    )}
                  </div>
                ))}
                <Button variant="ghost" size="sm" className="w-full text-xs" asChild>
                  <Link href="/app-dashboard/deals">
                    View All Deals <ArrowUpRight className="h-3 w-3 ml-1" />
                  </Link>
                </Button>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">No active deals</p>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Tasks */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckSquare className="h-4 w-4" />
              Upcoming Tasks
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : upcomingTasks && upcomingTasks.length > 0 ? (
              <div className="space-y-2">
                {upcomingTasks.map((task) => (
                  <div key={task.id} className="p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                    <div className="flex items-start justify-between">
                      <p className="text-sm font-medium truncate flex-1">{task.title}</p>
                      <Badge
                        variant={task.priority === 'urgent' ? 'destructive' : 'outline'}
                        className="text-xs ml-2"
                      >
                        {task.priority}
                      </Badge>
                    </div>
                    {task.due_date && (
                      <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {new Date(task.due_date).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                ))}
                <Button variant="ghost" size="sm" className="w-full text-xs" asChild>
                  <Link href="/app-dashboard/tasks">
                    View All Tasks <ArrowUpRight className="h-3 w-3 ml-1" />
                  </Link>
                </Button>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">No upcoming tasks</p>
            )}
          </CardContent>
        </Card>

        {/* Recent Activities */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : recentActivities && recentActivities.length > 0 ? (
              <div className="space-y-2">
                {recentActivities.map((activity) => (
                  <div key={activity.id} className="p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                    <p className="text-sm font-medium truncate">{activity.title}</p>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-xs text-muted-foreground">{activity.supplier?.name || 'General'}</p>
                      <Badge variant="outline" className="text-xs capitalize">
                        {activity.activity_type?.replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>
                ))}
                <Button variant="ghost" size="sm" className="w-full text-xs" asChild>
                  <Link href="/app-dashboard/activities">
                    View All Activities <ArrowUpRight className="h-3 w-3 ml-1" />
                  </Link>
                </Button>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">No recent activities</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
