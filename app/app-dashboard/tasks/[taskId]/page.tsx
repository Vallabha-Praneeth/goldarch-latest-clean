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
  CheckSquare,
  Edit,
  Trash2,
  ArrowLeft,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  Building2,
  Briefcase,
  FileText,
  Loader2,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { RelatedEntities } from '@/components/cross-section/RelatedEntities';
import { Breadcrumbs } from '@/components/cross-section/Breadcrumbs';
import Link from 'next/link';

type PageProps = {
  params: Promise<{ taskId: string }>;
};

type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';
type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

const statusConfig: Record<TaskStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: any; color: string }> = {
  pending: { label: 'Pending', variant: 'secondary', icon: Clock, color: 'text-gray-500' },
  in_progress: { label: 'In Progress', variant: 'default', icon: AlertCircle, color: 'text-blue-500' },
  completed: { label: 'Completed', variant: 'secondary', icon: CheckCircle, color: 'text-emerald-500' },
  cancelled: { label: 'Cancelled', variant: 'destructive', icon: XCircle, color: 'text-red-500' },
};

const priorityConfig: Record<TaskPriority, { label: string; color: string; bgColor: string }> = {
  low: { label: 'Low', color: 'text-gray-500', bgColor: 'bg-gray-100' },
  medium: { label: 'Medium', color: 'text-blue-500', bgColor: 'bg-blue-100' },
  high: { label: 'High', color: 'text-amber-500', bgColor: 'bg-amber-100' },
  urgent: { label: 'Urgent', color: 'text-red-500', bgColor: 'bg-red-100' },
};

export default function TaskDetailPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const taskId = resolvedParams.taskId;
  const router = useRouter();
  const queryClient = useQueryClient();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const { data: task, isLoading, error } = useQuery({
    queryKey: ['task', taskId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          supplier:suppliers(id, name, email, phone),
          project:projects(id, name, status),
          deal:deals(id, title, status)
        `)
        .eq('id', taskId)
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

  const { data: deals } = useQuery({
    queryKey: ['deals-list'],
    queryFn: async () => {
      const { data } = await supabase.from('deals').select('id, title').order('title');
      return data || [];
    },
  });

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    due_date: '',
    priority: 'medium' as TaskPriority,
    status: 'pending' as TaskStatus,
    supplier_id: '',
    project_id: '',
    deal_id: '',
  });

  const handleEdit = () => {
    if (task) {
      setFormData({
        title: task.title || '',
        description: task.description || '',
        due_date: task.due_date || '',
        priority: (task.priority as TaskPriority) || 'medium',
        status: (task.status as TaskStatus) || 'pending',
        supplier_id: task.supplier_id || '',
        project_id: task.project_id || '',
        deal_id: task.deal_id || '',
      });
      setEditDialogOpen(true);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('tasks')
        .update({
          title: formData.title.trim(),
          description: formData.description.trim() || null,
          due_date: formData.due_date || null,
          priority: formData.priority,
          status: formData.status,
          supplier_id: formData.supplier_id || null,
          project_id: formData.project_id || null,
          deal_id: formData.deal_id || null,
        })
        .eq('id', taskId);

      if (error) throw error;

      toast.success('Task updated successfully');
      queryClient.invalidateQueries({ queryKey: ['task', taskId] });
      setEditDialogOpen(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to update task');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);

    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;

      toast.success('Task deleted successfully');
      router.push('/app-dashboard/tasks');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete task');
      setLoading(false);
    }
  };

  const formatDate = (date: string | null) => {
    if (!date) return 'No due date';
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const isOverdue = (date: string | null, status: string | null) => {
    if (!date || status === 'completed' || status === 'cancelled') return false;
    return new Date(date) < new Date();
  };

  const getDaysRemaining = (date: string | null) => {
    if (!date) return null;
    const today = new Date();
    const dueDate = new Date(date);
    const diff = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
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

  if (error || !task) {
    return (
      <div className="space-y-6">
        <Breadcrumbs />
        <div className="text-center py-12">
          <CheckSquare className="h-12 w-12 mx-auto text-destructive mb-4" />
          <p className="text-destructive">Task not found</p>
          <Button variant="outline" className="mt-4" onClick={() => router.push('/app-dashboard/tasks')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Tasks
          </Button>
        </div>
      </div>
    );
  }

  const StatusIcon = statusConfig[task.status as TaskStatus]?.icon || Clock;
  const statusInfo = statusConfig[task.status as TaskStatus] || statusConfig.pending;
  const priorityInfo = priorityConfig[task.priority as TaskPriority] || priorityConfig.medium;
  const overdue = isOverdue(task.due_date, task.status);
  const daysRemaining = getDaysRemaining(task.due_date);

  return (
    <div className="space-y-6">
      <Breadcrumbs />

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/app-dashboard/tasks')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <CheckSquare className="h-8 w-8" />
              {task.title}
            </h1>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant={statusInfo.variant} className="gap-1">
                <StatusIcon className="h-3 w-3" />
                {statusInfo.label}
              </Badge>
              <Badge variant="outline" className={priorityInfo.color}>
                {priorityInfo.label} Priority
              </Badge>
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
            <DialogTitle>Edit Task</DialogTitle>
            <DialogDescription>Update task information</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Task Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
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
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value as TaskStatus })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(statusConfig).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        {config.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) => setFormData({ ...formData, priority: value as TaskPriority })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(priorityConfig).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        {config.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="due_date">Due Date</Label>
                <Input
                  id="due_date"
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
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

              <div className="space-y-2">
                <Label htmlFor="deal">Deal</Label>
                <Select
                  value={formData.deal_id}
                  onValueChange={(value) => setFormData({ ...formData, deal_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select deal" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {deals?.map((deal) => (
                      <SelectItem key={deal.id} value={deal.id}>
                        {deal.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
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
            <DialogTitle>Delete Task</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this task? This action cannot be undone.
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
          {/* Task Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Task Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Due Date */}
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-sm">Due Date</p>
                  <p className={`text-sm ${overdue ? 'text-red-500 font-medium' : 'text-muted-foreground'}`}>
                    {formatDate(task.due_date)}
                    {daysRemaining !== null && (
                      <span className="ml-2">
                        {overdue
                          ? `(Overdue by ${Math.abs(daysRemaining)} day${Math.abs(daysRemaining) !== 1 ? 's' : ''})`
                          : daysRemaining === 0
                          ? '(Due today)'
                          : `(${daysRemaining} day${daysRemaining !== 1 ? 's' : ''} remaining)`
                        }
                      </span>
                    )}
                  </p>
                </div>
              </div>

              {/* Description */}
              {task.description && (
                <div>
                  <p className="font-medium text-sm mb-2">Description</p>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{task.description}</p>
                </div>
              )}

              {/* Created Date */}
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-sm">Created</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(task.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Related Entities Cards */}
          {task.supplier && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Supplier
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Link href={`/app-dashboard/suppliers/${task.supplier.id}`}>
                  <div className="hover:bg-muted p-3 rounded-md transition-colors">
                    <h3 className="font-medium">{task.supplier.name}</h3>
                    {task.supplier.email && (
                      <p className="text-sm text-muted-foreground">{task.supplier.email}</p>
                    )}
                    {task.supplier.phone && (
                      <p className="text-sm text-muted-foreground">{task.supplier.phone}</p>
                    )}
                  </div>
                </Link>
              </CardContent>
            </Card>
          )}

          {task.project && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  Project
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Link href={`/app-dashboard/projects/${task.project.id}`}>
                  <div className="hover:bg-muted p-3 rounded-md transition-colors">
                    <h3 className="font-medium">{task.project.name}</h3>
                    {task.project.status && (
                      <Badge variant="outline" className="mt-2">
                        {task.project.status}
                      </Badge>
                    )}
                  </div>
                </Link>
              </CardContent>
            </Card>
          )}

          {task.deal && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Deal
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Link href={`/app-dashboard/deals/${task.deal.id}`}>
                  <div className="hover:bg-muted p-3 rounded-md transition-colors">
                    <h3 className="font-medium">{task.deal.title}</h3>
                    {task.deal.status && (
                      <Badge variant="outline" className="mt-2">
                        {task.deal.status}
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
          <RelatedEntities entityType="task" entityId={taskId} />
        </div>
      </div>
    </div>
  );
}
