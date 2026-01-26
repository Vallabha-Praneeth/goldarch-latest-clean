'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase-client';
import { Card, CardContent } from '@/components/ui/card';
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
import {
  Activity,
  Plus,
  Phone,
  Mail,
  Users,
  FileText,
  Package,
  Truck,
  CreditCard,
  StickyNote,
  Star,
  Calendar,
  Loader2,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useState } from 'react';
import { toast } from 'sonner';
import { QuickActions } from '@/components/cross-section/QuickActions';
import { Breadcrumbs } from '@/components/cross-section/Breadcrumbs';

type ActivityType = 'call' | 'email' | 'meeting' | 'quote_request' | 'quote_received' | 'order_placed' | 'delivery' | 'payment' | 'note' | 'rating_change';

const activityConfig: Record<ActivityType, { label: string; icon: any; color: string }> = {
  call: { label: 'Call', icon: Phone, color: 'text-blue-500' },
  email: { label: 'Email', icon: Mail, color: 'text-green-500' },
  meeting: { label: 'Meeting', icon: Users, color: 'text-purple-500' },
  quote_request: { label: 'Quote Request', icon: FileText, color: 'text-amber-500' },
  quote_received: { label: 'Quote Received', icon: FileText, color: 'text-emerald-500' },
  order_placed: { label: 'Order Placed', icon: Package, color: 'text-indigo-500' },
  delivery: { label: 'Delivery', icon: Truck, color: 'text-teal-500' },
  payment: { label: 'Payment', icon: CreditCard, color: 'text-pink-500' },
  note: { label: 'Note', icon: StickyNote, color: 'text-gray-500' },
  rating_change: { label: 'Rating Change', icon: Star, color: 'text-yellow-500' },
};

type FilterType = 'all' | ActivityType;

export default function ActivitiesPage() {
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    activity_type: 'note' as ActivityType,
    supplier_id: '',
    project_id: '',
    outcome: '',
    next_follow_up_date: '',
  });

  const { data: activities, isLoading, error } = useQuery({
    queryKey: ['activities'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('activities')
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
      activity_type: 'note',
      supplier_id: '',
      project_id: '',
      outcome: '',
      next_follow_up_date: '',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error('Activity title is required');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.from('activities').insert({
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        activity_type: formData.activity_type,
        supplier_id: formData.supplier_id || null,
        project_id: formData.project_id || null,
        outcome: formData.outcome.trim() || null,
        next_follow_up_date: formData.next_follow_up_date || null,
      });

      if (error) throw error;

      toast.success('Activity logged successfully');
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      setDialogOpen(false);
      resetForm();
    } catch (error: any) {
      toast.error(error.message || 'Failed to log activity');
    } finally {
      setLoading(false);
    }
  };

  const filteredActivities = filterType === 'all'
    ? activities
    : activities?.filter(a => a.activity_type === filterType);

  const formatDate = (date: string | null) => {
    if (!date) return '';
    const d = new Date(date);
    const now = new Date();
    const diff = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));

    if (diff === 0) {
      const hours = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60));
      if (hours === 0) {
        const mins = Math.floor((now.getTime() - d.getTime()) / (1000 * 60));
        return `${mins} minutes ago`;
      }
      return `${hours} hours ago`;
    }
    if (diff === 1) return 'Yesterday';
    if (diff < 7) return `${diff} days ago`;
    return d.toLocaleDateString();
  };

  // Calculate metrics by type
  const typeCounts = activities?.reduce((acc, a) => {
    const type = a.activity_type as ActivityType;
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {} as Record<ActivityType, number>) || {};

  return (
    <div className="space-y-6">
      <Breadcrumbs />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Activity className="h-8 w-8" />
            Activities
          </h1>
          <p className="text-muted-foreground">Track activities and interactions</p>
        </div>
        <Button className="gap-2" onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4" />
          Log Activity
        </Button>
      </div>

      {/* Add Activity Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Log Activity</DialogTitle>
            <DialogDescription>
              Record an interaction or activity
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Activity Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Called supplier about quote"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="activity_type">Activity Type</Label>
              <Select
                value={formData.activity_type}
                onValueChange={(value) => setFormData({ ...formData, activity_type: value as ActivityType })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(activityConfig).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      {config.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="What happened during this activity?"
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

            <div className="space-y-2">
              <Label htmlFor="outcome">Outcome</Label>
              <Input
                id="outcome"
                value={formData.outcome}
                onChange={(e) => setFormData({ ...formData, outcome: e.target.value })}
                placeholder="e.g., Quote promised within 24 hours"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="next_follow_up_date">Next Follow-up Date</Label>
              <Input
                id="next_follow_up_date"
                type="date"
                value={formData.next_follow_up_date}
                onChange={(e) => setFormData({ ...formData, next_follow_up_date: e.target.value })}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Log Activity
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Type Filters */}
      <div className="flex gap-2 flex-wrap">
        <Button
          variant={filterType === 'all' ? 'default' : 'outline'}
          onClick={() => setFilterType('all')}
          size="sm"
        >
          All ({activities?.length || 0})
        </Button>
        {Object.entries(activityConfig).map(([type, config]) => {
          const count = typeCounts[type as ActivityType] || 0;
          if (count === 0) return null;
          const Icon = config.icon;
          return (
            <Button
              key={type}
              variant={filterType === type ? 'default' : 'outline'}
              onClick={() => setFilterType(type as ActivityType)}
              size="sm"
              className="gap-1"
            >
              <Icon className={`h-3 w-3 ${filterType !== type ? config.color : ''}`} />
              {config.label} ({count})
            </Button>
          );
        })}
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="h-5 w-1/3 mb-2" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="text-center py-12">
          <Activity className="h-12 w-12 mx-auto text-destructive mb-4" />
          <p className="text-destructive">Failed to load activities</p>
          <p className="text-sm text-muted-foreground mt-1">{(error as Error).message}</p>
        </div>
      )}

      {/* Activities Timeline */}
      {!isLoading && !error && filteredActivities && filteredActivities.length > 0 && (
        <div className="space-y-4">
          {filteredActivities.map((activity) => {
            const config = activityConfig[activity.activity_type as ActivityType] || activityConfig.note;
            const Icon = config.icon;

            return (
              <Card key={activity.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0`}>
                      <Icon className={`h-5 w-5 ${config.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <h3 className="font-medium">{activity.title}</h3>
                          <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                            <Badge variant="outline" className="text-xs">
                              {config.label}
                            </Badge>
                            {activity.supplier?.name && (
                              <span>with {activity.supplier.name}</span>
                            )}
                            {activity.project?.name && (
                              <span>for {activity.project.name}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs text-muted-foreground">
                            {formatDate(activity.created_at)}
                          </span>
                          <QuickActions entityType="activity" entityId={activity.id} />
                        </div>
                      </div>
                      {activity.description && (
                        <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                          {activity.description}
                        </p>
                      )}
                      {activity.outcome && (
                        <div className="mt-2 text-sm">
                          <span className="font-medium">Outcome:</span>{' '}
                          <span className="text-muted-foreground">{activity.outcome}</span>
                        </div>
                      )}
                      {activity.next_follow_up_date && (
                        <div className="flex items-center gap-1 mt-2 text-sm text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          Follow-up: {new Date(activity.next_follow_up_date).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && (!filteredActivities || filteredActivities.length === 0) && (
        <div className="text-center py-12">
          <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            {filterType === 'all' ? 'No activities yet' : `No ${activityConfig[filterType as ActivityType]?.label || filterType} activities`}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Activities will appear here once logged
          </p>
        </div>
      )}
    </div>
  );
}
