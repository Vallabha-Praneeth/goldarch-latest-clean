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
import { FolderKanban, Plus, MapPin, Calendar, DollarSign, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useState } from 'react';
import { toast } from 'sonner';
import { useBulkSelection } from '@/lib/hooks/use-bulk-selection';
import { SelectionCheckbox } from '@/components/bulk-operations/SelectionCheckbox';
import { BulkActionsToolbar } from '@/components/bulk-operations/BulkActionsToolbar';
import { QuickActions } from '@/components/cross-section/QuickActions';
import { Breadcrumbs } from '@/components/cross-section/Breadcrumbs';
import Link from 'next/link';

type ProjectStatus = 'planning' | 'design' | 'procurement' | 'construction' | 'completed' | 'on_hold';

const statusConfig: Record<ProjectStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  planning: { label: 'Planning', variant: 'secondary' },
  design: { label: 'Design', variant: 'outline' },
  procurement: { label: 'Procurement', variant: 'default' },
  construction: { label: 'Construction', variant: 'default' },
  completed: { label: 'Completed', variant: 'secondary' },
  on_hold: { label: 'On Hold', variant: 'destructive' },
};

export default function ProjectsPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    location: '',
    budget: '',
    status: 'planning' as ProjectStatus,
    start_date: '',
    end_date: '',
  });

  const { data: projects, isLoading, error } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  // Bulk selection state (must come after projects is fetched)
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
  } = useBulkSelection(projects);

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      location: '',
      budget: '',
      status: 'planning',
      start_date: '',
      end_date: '',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('Project name is required');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.from('projects').insert({
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        location: formData.location.trim() || null,
        budget: formData.budget ? parseFloat(formData.budget) : null,
        status: formData.status,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
      });

      if (error) throw error;

      toast.success('Project created successfully');
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setDialogOpen(false);
      resetForm();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create project');
    } finally {
      setLoading(false);
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
    return new Date(date).toLocaleDateString();
  };

  // Bulk delete handler
  const handleBulkDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedCount} project${selectedCount > 1 ? 's' : ''}? This action cannot be undone.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .in('id', Array.from(selectedIds));

      if (error) throw error;

      toast.success(`${selectedCount} project${selectedCount > 1 ? 's' : ''} deleted successfully`);
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      clearSelection();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete projects');
    }
  };

  // Bulk update status handler
  const handleBulkUpdateStatus = async (status: string) => {
    try {
      const { error } = await supabase
        .from('projects')
        .update({ status })
        .in('id', Array.from(selectedIds));

      if (error) throw error;

      toast.success(`${selectedCount} project${selectedCount > 1 ? 's' : ''} updated successfully`);
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      clearSelection();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update projects');
    }
  };

  return (
    <div className="space-y-6">
      <Breadcrumbs />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <FolderKanban className="h-8 w-8" />
            Projects
          </h1>
          <p className="text-muted-foreground">Manage your construction projects</p>
        </div>
        <Button className="gap-2" onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4" />
          New Project
        </Button>
      </div>

      {/* Add Project Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New Project</DialogTitle>
            <DialogDescription>
              Create a new construction project
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Project Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Residential Complex A"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Project description and details"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="City, State"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="budget">Budget ($)</Label>
                <Input
                  id="budget"
                  type="number"
                  value={formData.budget}
                  onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                  placeholder="50000"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value as ProjectStatus })}
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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start_date">Start Date</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="end_date">End Date</Label>
                <Input
                  id="end_date"
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Project
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Loading State */}
      {isLoading && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2 mt-2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="text-center py-12">
          <FolderKanban className="h-12 w-12 mx-auto text-destructive mb-4" />
          <p className="text-destructive">Failed to load projects</p>
          <p className="text-sm text-muted-foreground mt-1">{(error as Error).message}</p>
        </div>
      )}

      {/* Projects Grid */}
      {!isLoading && !error && projects && projects.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Card key={project.id} className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1">
                    <SelectionCheckbox
                      checked={isSelected(project.id)}
                      onCheckedChange={() => toggleSelection(project.id)}
                      aria-label={`Select ${project.name}`}
                    />
                    <Link href={`/app-dashboard/projects/${project.id}`} className="flex-1">
                      <CardTitle className="text-lg hover:text-primary transition-colors">{project.name}</CardTitle>
                    </Link>
                  </div>
                  <div className="flex items-center gap-2">
                    {project.status && statusConfig[project.status as ProjectStatus] && (
                      <Badge variant={statusConfig[project.status as ProjectStatus].variant}>
                        {statusConfig[project.status as ProjectStatus].label}
                      </Badge>
                    )}
                    <QuickActions entityType="project" entityId={project.id} />
                  </div>
                </div>
                {project.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2 mt-2">
                    {project.description}
                  </p>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  {project.location && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      {project.location}
                    </div>
                  )}
                  {project.budget && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <DollarSign className="h-4 w-4" />
                      Budget: {formatCurrency(project.budget)}
                    </div>
                  )}
                  {(project.start_date || project.end_date) && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      {formatDate(project.start_date)} - {formatDate(project.end_date)}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && (!projects || projects.length === 0) && (
        <div className="text-center py-12">
          <FolderKanban className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No projects yet</p>
          <p className="text-sm text-muted-foreground mt-1">
            Projects will appear here once created
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
        entityType="projects"
      />
    </div>
  );
}
