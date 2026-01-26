/**
 * Related Entities Component
 * Shows related records across different sections
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  FileText,
  CheckSquare,
  Activity,
  Handshake,
  FolderKanban,
  Users,
  ExternalLink,
} from 'lucide-react';
import Link from 'next/link';

interface RelatedEntitiesProps {
  entityType: 'supplier' | 'project' | 'deal';
  entityId: string;
}

export function RelatedEntities({ entityType, entityId }: RelatedEntitiesProps) {
  // Fetch related quotes
  const { data: quotes, isLoading: quotesLoading } = useQuery({
    queryKey: ['related-quotes', entityType, entityId],
    queryFn: async () => {
      if (entityType === 'supplier') {
        // For suppliers, find quotes through quotation_lines → products → suppliers
        const { data } = await supabase
          .from('quotations')
          .select('id, quote_number, status, created_at')
          .limit(5)
          .order('created_at', { ascending: false });
        return data || [];
      }
      return [];
    },
    enabled: entityType === 'supplier',
  });

  // Fetch related tasks
  const { data: tasks, isLoading: tasksLoading } = useQuery({
    queryKey: ['related-tasks', entityType, entityId],
    queryFn: async () => {
      const column = `${entityType}_id`;
      const { data } = await supabase
        .from('tasks')
        .select('id, title, status, due_date')
        .eq(column, entityId)
        .limit(5)
        .order('created_at', { ascending: false });
      return data || [];
    },
  });

  // Fetch related activities
  const { data: activities, isLoading: activitiesLoading } = useQuery({
    queryKey: ['related-activities', entityType, entityId],
    queryFn: async () => {
      const column = `${entityType}_id`;
      const { data } = await supabase
        .from('activities')
        .select('id, title, activity_type, created_at')
        .eq(column, entityId)
        .limit(5)
        .order('created_at', { ascending: false });
      return data || [];
    },
  });

  // Fetch related deals
  const { data: deals, isLoading: dealsLoading } = useQuery({
    queryKey: ['related-deals', entityType, entityId],
    queryFn: async () => {
      const column = `${entityType}_id`;
      const { data } = await supabase
        .from('deals')
        .select('id, title, stage, estimated_value')
        .eq(column, entityId)
        .limit(5)
        .order('created_at', { ascending: false });
      return data || [];
    },
    enabled: entityType === 'supplier' || entityType === 'project',
  });

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {/* Related Quotes */}
      {entityType === 'supplier' && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Recent Quotes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {quotesLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-8 w-full" />
                ))}
              </div>
            ) : quotes && quotes.length > 0 ? (
              <div className="space-y-2">
                {quotes.map((quote) => (
                  <Link
                    key={quote.id}
                    href={`/app-dashboard/quotes/${quote.id}/review`}
                    className="flex items-center justify-between p-2 rounded-md hover:bg-muted transition-colors group"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{quote.quote_number}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(quote.created_at)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {quote.status}
                      </Badge>
                      <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </Link>
                ))}
                <Button variant="ghost" size="sm" className="w-full text-xs" asChild>
                  <Link href="/app-dashboard/quotes">View All Quotes</Link>
                </Button>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No quotes yet</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Related Deals */}
      {(entityType === 'supplier' || entityType === 'project') && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Handshake className="h-4 w-4" />
              Active Deals
            </CardTitle>
          </CardHeader>
          <CardContent>
            {dealsLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-8 w-full" />
                ))}
              </div>
            ) : deals && deals.length > 0 ? (
              <div className="space-y-2">
                {deals.map((deal) => (
                  <Link
                    key={deal.id}
                    href={`/app-dashboard/deals`}
                    className="flex items-center justify-between p-2 rounded-md hover:bg-muted transition-colors group"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{deal.title}</p>
                      {deal.estimated_value && (
                        <p className="text-xs text-muted-foreground">
                          ${deal.estimated_value.toLocaleString()}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs capitalize">
                        {deal.stage?.replace('_', ' ')}
                      </Badge>
                      <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </Link>
                ))}
                <Button variant="ghost" size="sm" className="w-full text-xs" asChild>
                  <Link href="/app-dashboard/deals">View All Deals</Link>
                </Button>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No deals yet</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Related Tasks */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <CheckSquare className="h-4 w-4" />
            Tasks
          </CardTitle>
        </CardHeader>
        <CardContent>
          {tasksLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-8 w-full" />
              ))}
            </div>
          ) : tasks && tasks.length > 0 ? (
            <div className="space-y-2">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between p-2 rounded-md hover:bg-muted transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{task.title}</p>
                    {task.due_date && (
                      <p className="text-xs text-muted-foreground">
                        Due: {formatDate(task.due_date)}
                      </p>
                    )}
                  </div>
                  <Badge variant="outline" className="text-xs capitalize">
                    {task.status?.replace('_', ' ')}
                  </Badge>
                </div>
              ))}
              <Button variant="ghost" size="sm" className="w-full text-xs" asChild>
                <Link href="/app-dashboard/tasks">View All Tasks</Link>
              </Button>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">No tasks yet</p>
          )}
        </CardContent>
      </Card>

      {/* Related Activities */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activitiesLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-8 w-full" />
              ))}
            </div>
          ) : activities && activities.length > 0 ? (
            <div className="space-y-2">
              {activities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center justify-between p-2 rounded-md hover:bg-muted transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{activity.title}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(activity.created_at)}</p>
                  </div>
                  <Badge variant="outline" className="text-xs capitalize">
                    {activity.activity_type?.replace('_', ' ')}
                  </Badge>
                </div>
              ))}
              <Button variant="ghost" size="sm" className="w-full text-xs" asChild>
                <Link href="/app-dashboard/activities">View All Activities</Link>
              </Button>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">No activities yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
