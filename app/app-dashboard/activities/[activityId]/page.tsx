'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
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
import {
  Activity,
  Edit,
  Trash2,
  ArrowLeft,
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
  Clock,
  Building2,
  Briefcase,
  Loader2,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { RelatedEntities } from '@/components/cross-section/RelatedEntities';
import { Breadcrumbs } from '@/components/cross-section/Breadcrumbs';
import Link from 'next/link';

type PageProps = {
  params: Promise<{ activityId: string }>;
};

type ActivityType = 'call' | 'email' | 'meeting' | 'quote_request' | 'quote_received' | 'order_placed' | 'delivery' | 'payment' | 'note' | 'rating_change';

const activityConfig: Record<ActivityType, { label: string; icon: any; color: string; bgColor: string }> = {
  call: { label: 'Call', icon: Phone, color: 'text-blue-500', bgColor: 'bg-blue-100' },
  email: { label: 'Email', icon: Mail, color: 'text-green-500', bgColor: 'bg-green-100' },
  meeting: { label: 'Meeting', icon: Users, color: 'text-purple-500', bgColor: 'bg-purple-100' },
  quote_request: { label: 'Quote Request', icon: FileText, color: 'text-amber-500', bgColor: 'bg-amber-100' },
  quote_received: { label: 'Quote Received', icon: FileText, color: 'text-emerald-500', bgColor: 'bg-emerald-100' },
  order_placed: { label: 'Order Placed', icon: Package, color: 'text-indigo-500', bgColor: 'bg-indigo-100' },
  delivery: { label: 'Delivery', icon: Truck, color: 'text-teal-500', bgColor: 'bg-teal-100' },
  payment: { label: 'Payment', icon: CreditCard, color: 'text-pink-500', bgColor: 'bg-pink-100' },
  note: { label: 'Note', icon: StickyNote, color: 'text-gray-500', bgColor: 'bg-gray-100' },
  rating_change: { label: 'Rating Change', icon: Star, color: 'text-yellow-500', bgColor: 'bg-yellow-100' },
};

export default function ActivityDetailPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const activityId = resolvedParams.activityId;
  const router = useRouter();
  const queryClient = useQueryClient();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const { data: activity, isLoading, error } = useQuery({
    queryKey: ['activity', activityId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('activities')
        .select(`
          *,
          supplier:suppliers(id, name, email, phone, location),
          project:projects(id, name, status)
        `)
        .eq('id', activityId)
        .single();
      if (error) throw error;
      return data;
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

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    activity_type: 'note' as ActivityType,
    supplier_id: '',
    project_id: '',
    outcome: '',
    next_follow_up_date: '',
  });

  const handleEdit = () => {
    if (activity) {
      setFormData({
        title: activity.title || '',
        description: activity.description || '',
        activity_type: (activity.activity_type as ActivityType) || 'note',
        supplier_id: activity.supplier_id || '',
        project_id: activity.project_id || '',
        outcome: activity.outcome || '',
        next_follow_up_date: activity.next_follow_up_date || '',
      });
      setEditDialogOpen(true);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('activities')
        .update({
          title: formData.title.trim(),
          description: formData.description.trim() || null,
          activity_type: formData.activity_type,
          supplier_id: formData.supplier_id || null,
          project_id: formData.project_id || null,
          outcome: formData.outcome.trim() || null,
          next_follow_up_date: formData.next_follow_up_date || null,
        })
        .eq('id', activityId);

      if (error) throw error;

      toast.success('Activity updated successfully');
      queryClient.invalidateQueries({ queryKey: ['activity', activityId] });
      setEditDialogOpen(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to update activity');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);

    try {
      const { error } = await supabase
        .from('activities')
        .delete()
        .eq('id', activityId);

      if (error) throw error;

      toast.success('Activity deleted successfully');
      router.push('/app-dashboard/activities');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete activity');
      setLoading(false);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatFollowUpDate = (date: string | null) => {
    if (!date) return null;
    const followUpDate = new Date(date);
    const today = new Date();
    const diff = Math.ceil((followUpDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diff < 0) return { text: `Overdue by ${Math.abs(diff)} day${Math.abs(diff) !== 1 ? 's' : ''}`, overdue: true };
    if (diff === 0) return { text: 'Follow-up due today', overdue: false };
    if (diff === 1) return { text: 'Follow-up due tomorrow', overdue: false };
    return { text: `Follow-up in ${diff} day${diff !== 1 ? 's' : ''}`, overdue: false };
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Breadcrumbs />
        <div className="flex items-center gap-4">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-64" />
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      </div>
    );
  }

  if (error || !activity) {
    return (
      <div className="space-y-6">
        <Breadcrumbs />
        <div className="text-center py-12">
          <Activity className="h-12 w-12 mx-auto text-destructive mb-4" />
          <p className="text-destructive">Activity not found</p>
          <Button variant="outline" className="mt-4" onClick={() => router.push('/app-dashboard/activities')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Activities
          </Button>
        </div>
      </div>
    );
  }

  const activityInfo = activityConfig[activity.activity_type as ActivityType] || activityConfig.note;
  const ActivityIcon = activityInfo.icon;
  const followUpInfo = formatFollowUpDate(activity.next_follow_up_date);

  return (
    <div className="space-y-6">
      <Breadcrumbs />

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/app-dashboard/activities')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Activity className="h-8 w-8" />
              {activity.title}
            </h1>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="outline" className={`gap-1 ${activityInfo.color}`}>
                <ActivityIcon className="h-3 w-3" />
                {activityInfo.label}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {formatDate(activity.created_at)}
              </span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleEdit}>
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <Button variant="destructive" onClick={() => setDeleteDialogOpen(true)}>
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Activity</DialogTitle>
            <DialogDescription>Update activity information</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Activity Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
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
                  <SelectValue />
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
                rows={4}
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
                    <SelectItem value="">None</SelectItem>
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
                    <SelectItem value="">None</SelectItem>
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
              <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Activity</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this activity? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Activity Details */}
          <Card>
            <CardHeader>
              <CardTitle>Activity Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Description */}
              {activity.description && (
                <div>
                  <p className="font-medium text-sm mb-2">Description</p>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{activity.description}</p>
                </div>
              )}

              {/* Outcome */}
              {activity.outcome && (
                <div>
                  <p className="font-medium text-sm mb-2">Outcome</p>
                  <p className="text-sm text-muted-foreground">{activity.outcome}</p>
                </div>
              )}

              {/* Follow-up Date */}
              {activity.next_follow_up_date && followUpInfo && (
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium text-sm">Next Follow-up</p>
                    <p className={`text-sm ${followUpInfo.overdue ? 'text-red-500 font-medium' : 'text-muted-foreground'}`}>
                      {new Date(activity.next_follow_up_date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                      <span className="ml-2">({followUpInfo.text})</span>
                    </p>
                  </div>
                </div>
              )}

              {/* Created Time */}
              <div className="flex items-start gap-3 pt-4 border-t">
                <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-sm">Activity Logged</p>
                  <p className="text-sm text-muted-foreground">{formatDate(activity.created_at)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Related Entities Cards */}
          {activity.supplier && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Supplier
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Link href={`/app-dashboard/suppliers/${activity.supplier.id}`}>
                  <div className="hover:bg-muted p-3 rounded-md transition-colors">
                    <h3 className="font-medium">{activity.supplier.name}</h3>
                    {activity.supplier.email && (
                      <p className="text-sm text-muted-foreground mt-1">{activity.supplier.email}</p>
                    )}
                    {activity.supplier.phone && (
                      <p className="text-sm text-muted-foreground">{activity.supplier.phone}</p>
                    )}
                    {activity.supplier.location && (
                      <p className="text-sm text-muted-foreground">{activity.supplier.location}</p>
                    )}
                  </div>
                </Link>
              </CardContent>
            </Card>
          )}

          {activity.project && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  Project
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Link href={`/app-dashboard/projects/${activity.project.id}`}>
                  <div className="hover:bg-muted p-3 rounded-md transition-colors">
                    <h3 className="font-medium">{activity.project.name}</h3>
                    {activity.project.status && (
                      <Badge variant="outline" className="mt-2">
                        {activity.project.status}
                      </Badge>
                    )}
                  </div>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <RelatedEntities entityType="activity" entityId={activityId} />
        </div>
      </div>
    </div>
  );
}
