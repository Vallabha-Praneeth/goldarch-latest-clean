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
import { CheckSquare, Plus, Calendar, User, AlertCircle, Clock, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useState } from 'react';
import { toast } from 'sonner';
import { useBulkSelection } from '@/lib/hooks/use-bulk-selection';
import { SelectionCheckbox } from '@/components/bulk-operations/SelectionCheckbox';
import { BulkActionsToolbar } from '@/components/bulk-operations/BulkActionsToolbar';
import { Breadcrumbs } from '@/components/cross-section/Breadcrumbs';

type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';
type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

const statusConfig: Record<TaskStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: any }> = {
  pending: { label: 'Pending', variant: 'secondary', icon: Clock },
  in_progress: { label: 'In Progress', variant: 'default', icon: AlertCircle },
  completed: { label: 'Completed', variant: 'secondary', icon: CheckCircle },
  cancelled: { label: 'Cancelled', variant: 'destructive', icon: XCircle },
};

const priorityConfig: Record<TaskPriority, { label: string; color: string }> = {
  low: { label: 'Low', color: 'text-gray-500' },
  medium: { label: 'Medium', color: 'text-blue-500' },
  high: { label: 'High', color: 'text-amber-500' },
  urgent: { label: 'Urgent', color: 'text-red-500' },
};

type FilterStatus = 'all' | TaskStatus;

export default function TasksPage() {
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();

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

  const { data: tasks, isLoading, error } = useQuery({
    queryKey: ['tasks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          supplier:suppliers(name),
          project:projects(name),
          deal:deals(title)
        `)
        .order('due_date', { ascending: true, nullsFirst: false });
      if (error) throw error;
      return data || [];
    },
  });

  // Compute filtered tasks
  const filteredTasks = filterStatus === 'all'
    ? tasks
    : tasks?.filter(t => t.status === filterStatus);

  // Bulk selection state
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
  } = useBulkSelection(filteredTasks);

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

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      due_date: '',
      priority: 'medium',
      status: 'pending',
      supplier_id: '',
      project_id: '',
      deal_id: '',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error('Task title is required');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.from('tasks').insert({
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        due_date: formData.due_date || null,
        priority: formData.priority,
        status: formData.status,
        supplier_id: formData.supplier_id || null,
        project_id: formData.project_id || null,
        deal_id: formData.deal_id || null,
      });

      if (error) throw error;

      toast.success('Task created successfully');
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setDialogOpen(false);
      resetForm();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create task');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: string | null) => {
    if (!date) return 'No due date';
    const d = new Date(date);
    const today = new Date();
    const diff = Math.ceil((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diff < 0) return `Overdue by ${Math.abs(diff)} days`;
    if (diff === 0) return 'Due today';
    if (diff === 1) return 'Due tomorrow';
    return d.toLocaleDateString();
  };

  const isOverdue = (date: string | null, status: string | null) => {
    if (!date || status === 'completed' || status === 'cancelled') return false;
    return new Date(date) < new Date();
  };

  // Bulk delete handler
  const handleBulkDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedCount} task${selectedCount > 1 ? 's' : ''}? This action cannot be undone.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .in('id', Array.from(selectedIds));

      if (error) throw error;

      toast.success(`${selectedCount} task${selectedCount > 1 ? 's' : ''} deleted successfully`);
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      clearSelection();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete tasks');
    }
  };

  // Bulk update status handler
  const handleBulkUpdateStatus = async (status: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ status })
        .in('id', Array.from(selectedIds));

      if (error) throw error;

      toast.success(`${selectedCount} task${selectedCount > 1 ? 's' : ''} updated successfully`);
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      clearSelection();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update tasks');
    }
  };

  // Calculate metrics
  const metrics = {
    total: tasks?.length || 0,
    pending: tasks?.filter(t => t.status === 'pending').length || 0,
    inProgress: tasks?.filter(t => t.status === 'in_progress').length || 0,
    completed: tasks?.filter(t => t.status === 'completed').length || 0,
    overdue: tasks?.filter(t => isOverdue(t.due_date, t.status)).length || 0,
  };

  return (
    <div className="space-y-6">
      <Breadcrumbs />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <CheckSquare className="h-8 w-8" />
            Tasks
          </h1>
          <p className="text-muted-foreground">Manage your tasks and to-dos</p>
        </div>
        <Button className="gap-2" onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4" />
          New Task
        </Button>
      </div>

      {/* Add Task Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New Task</DialogTitle>
            <DialogDescription>
              Create a new task to track
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Task Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Follow up with supplier"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Task details and notes"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="due_date">Due Date</Label>
                <Input
                  id="due_date"
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) => setFormData({ ...formData, priority: value as TaskPriority })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
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
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value as TaskStatus })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
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

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="supplier">Supplier</Label>
                <Select
                  value={formData.supplier_id}
                  onValueChange={(value) => setFormData({ ...formData, supplier_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
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
                    <SelectValue placeholder="Select" />
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

              <div className="space-y-2">
                <Label htmlFor="deal">Deal</Label>
                <Select
                  value={formData.deal_id}
                  onValueChange={(value) => setFormData({ ...formData, deal_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
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
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Task
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-bold">{metrics.total}</p>
            <p className="text-xs text-muted-foreground">Total Tasks</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-gray-500">{metrics.pending}</p>
            <p className="text-xs text-muted-foreground">Pending</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-blue-500">{metrics.inProgress}</p>
            <p className="text-xs text-muted-foreground">In Progress</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-emerald-500">{metrics.completed}</p>
            <p className="text-xs text-muted-foreground">Completed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-red-500">{metrics.overdue}</p>
            <p className="text-xs text-muted-foreground">Overdue</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {(['all', 'pending', 'in_progress', 'completed', 'cancelled'] as FilterStatus[]).map((status) => (
          <Button
            key={status}
            variant={filterStatus === status ? 'default' : 'outline'}
            onClick={() => setFilterStatus(status)}
            size="sm"
          >
            {status === 'all' ? 'All' : status === 'in_progress' ? 'In Progress' : status.charAt(0).toUpperCase() + status.slice(1)}
          </Button>
        ))}
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="text-center py-12">
          <CheckSquare className="h-12 w-12 mx-auto text-destructive mb-4" />
          <p className="text-destructive">Failed to load tasks</p>
          <p className="text-sm text-muted-foreground mt-1">{(error as Error).message}</p>
        </div>
      )}

      {/* Tasks List */}
      {!isLoading && !error && filteredTasks && filteredTasks.length > 0 && (
        <div className="space-y-3">
          {filteredTasks.map((task) => {
            const StatusIcon = task.status && statusConfig[task.status as TaskStatus]
              ? statusConfig[task.status as TaskStatus].icon
              : Clock;
            const overdue = isOverdue(task.due_date, task.status);

            return (
              <Card key={task.id} className={`hover:shadow-lg transition-shadow cursor-pointer ${overdue ? 'border-red-200' : ''}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <SelectionCheckbox
                        checked={isSelected(task.id)}
                        onCheckedChange={() => toggleSelection(task.id)}
                        aria-label={`Select ${task.title}`}
                      />
                      <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium truncate">{task.title}</h3>
                        {task.priority && priorityConfig[task.priority as TaskPriority] && (
                          <span className={`text-xs font-medium ${priorityConfig[task.priority as TaskPriority].color}`}>
                            {priorityConfig[task.priority as TaskPriority].label}
                          </span>
                        )}
                      </div>
                      {task.description && (
                        <p className="text-sm text-muted-foreground line-clamp-1 mb-2">
                          {task.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <div className={`flex items-center gap-1 ${overdue ? 'text-red-500' : ''}`}>
                          <Calendar className="h-3 w-3" />
                          {formatDate(task.due_date)}
                        </div>
                        {task.supplier?.name && (
                          <span>Supplier: {task.supplier.name}</span>
                        )}
                        {task.project?.name && (
                          <span>Project: {task.project.name}</span>
                        )}
                      </div>
                      </div>
                    </div>
                    {task.status && statusConfig[task.status as TaskStatus] && (
                      <Badge variant={statusConfig[task.status as TaskStatus].variant} className="gap-1 shrink-0">
                        <StatusIcon className="h-3 w-3" />
                        {statusConfig[task.status as TaskStatus].label}
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && (!filteredTasks || filteredTasks.length === 0) && (
        <div className="text-center py-12">
          <CheckSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            {filterStatus === 'all' ? 'No tasks yet' : `No ${filterStatus.replace('_', ' ')} tasks`}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Tasks will appear here once created
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
        entityType="tasks"
      />
    </div>
  );
}
