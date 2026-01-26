import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/DashboardLayout';
import ActivityFormDialog from '@/components/ActivityFormDialog';
import DeleteConfirmDialog from '@/components/DeleteConfirmDialog';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Plus, MoreVertical, Pencil, Trash2, Filter, Phone, Mail, Users, FileText, Calendar, Package, CreditCard, Star, StickyNote, Clock } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { format, formatDistanceToNow } from 'date-fns';
import type { Database } from '@/integrations/supabase/types';

type ActivityType = Database['public']['Enums']['activity_type'];

const activityTypeConfig: Record<ActivityType, { icon: React.ReactNode; label: string; color: string }> = {
  call: { icon: <Phone className="h-4 w-4" />, label: 'Call', color: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' },
  email: { icon: <Mail className="h-4 w-4" />, label: 'Email', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' },
  meeting: { icon: <Users className="h-4 w-4" />, label: 'Meeting', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300' },
  quote_request: { icon: <FileText className="h-4 w-4" />, label: 'Quote Request', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300' },
  quote_received: { icon: <FileText className="h-4 w-4" />, label: 'Quote Received', color: 'bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300' },
  order_placed: { icon: <Package className="h-4 w-4" />, label: 'Order Placed', color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300' },
  delivery: { icon: <Package className="h-4 w-4" />, label: 'Delivery', color: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900 dark:text-cyan-300' },
  payment: { icon: <CreditCard className="h-4 w-4" />, label: 'Payment', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300' },
  note: { icon: <StickyNote className="h-4 w-4" />, label: 'Note', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300' },
  rating_change: { icon: <Star className="h-4 w-4" />, label: 'Rating', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300' },
};

const Activities = () => {
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [formOpen, setFormOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string>('');

  const { data: activities, isLoading } = useQuery({
    queryKey: ['activities', typeFilter],
    queryFn: async () => {
      let query = supabase
        .from('activities')
        .select(`
          *,
          suppliers(name),
          projects(name)
        `)
        .order('created_at', { ascending: false });

      if (typeFilter && typeFilter !== 'all') {
        query = query.eq('activity_type', typeFilter as ActivityType);
      }

      const { data } = await query.limit(100);
      return data || [];
    },
  });

  const handleEdit = (activity: any) => {
    setEditingActivity(activity);
    setFormOpen(true);
  };

  const handleDelete = (id: string) => {
    setDeletingId(id);
    setDeleteDialogOpen(true);
  };

  const handleAddNew = () => {
    setEditingActivity(null);
    setFormOpen(true);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Activities</h1>
            <p className="text-muted-foreground">Track calls, emails, meetings, and more</p>
          </div>
          <Button onClick={handleAddNew}>
            <Plus className="h-4 w-4 mr-2" />
            Log Activity
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-4 md:flex-row">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full md:w-[200px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="call">Calls</SelectItem>
              <SelectItem value="email">Emails</SelectItem>
              <SelectItem value="meeting">Meetings</SelectItem>
              <SelectItem value="quote_request">Quote Requests</SelectItem>
              <SelectItem value="quote_received">Quotes Received</SelectItem>
              <SelectItem value="order_placed">Orders Placed</SelectItem>
              <SelectItem value="delivery">Deliveries</SelectItem>
              <SelectItem value="payment">Payments</SelectItem>
              <SelectItem value="note">Notes</SelectItem>
              <SelectItem value="rating_change">Rating Changes</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Activities Timeline */}
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Card key={i}>
                <CardContent className="py-4">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2 mt-2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : activities?.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground mb-4">No activities logged yet</p>
              <Button onClick={handleAddNew}>
                <Plus className="h-4 w-4 mr-2" />
                Log Your First Activity
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-6 top-0 bottom-0 w-px bg-border hidden md:block" />
            
            <div className="space-y-4">
              {activities?.map((activity: any) => {
                const config = activityTypeConfig[activity.activity_type as ActivityType];
                
                return (
                  <div key={activity.id} className="relative flex gap-4">
                    {/* Timeline dot */}
                    <div className={`hidden md:flex shrink-0 w-12 h-12 rounded-full items-center justify-center ${config.color} z-10`}>
                      {config.icon}
                    </div>

                    <Card className="flex-1">
                      <CardContent className="py-4">
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-2 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge className={`${config.color} md:hidden`}>
                                {config.icon}
                                <span className="ml-1">{config.label}</span>
                              </Badge>
                              <Badge className={`${config.color} hidden md:inline-flex`}>
                                {config.label}
                              </Badge>
                              <span className="text-sm text-muted-foreground">
                                {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                              </span>
                            </div>

                            <h3 className="font-medium">{activity.title}</h3>
                            
                            {activity.description && (
                              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                {activity.description}
                              </p>
                            )}

                            {activity.outcome && (
                              <div className="text-sm">
                                <span className="font-medium">Outcome: </span>
                                <span className="text-muted-foreground">{activity.outcome}</span>
                              </div>
                            )}

                            <div className="flex flex-wrap items-center gap-2 pt-1">
                              {activity.suppliers?.name && (
                                <Badge variant="secondary">{activity.suppliers.name}</Badge>
                              )}
                              {activity.projects?.name && (
                                <Badge variant="secondary">{activity.projects.name}</Badge>
                              )}
                              {activity.next_follow_up_date && (
                                <Badge variant="outline" className="gap-1">
                                  <Clock className="h-3 w-3" />
                                  Follow-up: {format(new Date(activity.next_follow_up_date), 'MMM d, yyyy')}
                                </Badge>
                              )}
                            </div>
                          </div>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEdit(activity)}>
                                <Pencil className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDelete(activity.id)}
                                className="text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <ActivityFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        activity={editingActivity}
      />

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Activity"
        description="Are you sure you want to delete this activity? This action cannot be undone."
        table="activities"
        id={deletingId}
        invalidateKeys={['activities']}
      />
    </DashboardLayout>
  );
};

export default Activities;
