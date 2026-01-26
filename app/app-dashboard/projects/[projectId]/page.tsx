'use client';

import { use, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  FolderKanban,
  MapPin,
  Calendar,
  DollarSign,
  ArrowLeft,
  Edit,
  Trash2,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { RelatedEntities } from '@/components/cross-section/RelatedEntities';
import { Breadcrumbs } from '@/components/cross-section/Breadcrumbs';

interface PageProps {
  params: Promise<{ projectId: string }>;
}

type ProjectStatus = 'planning' | 'design' | 'procurement' | 'construction' | 'completed' | 'on_hold';

const statusConfig: Record<ProjectStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  planning: { label: 'Planning', variant: 'secondary' },
  design: { label: 'Design', variant: 'outline' },
  procurement: { label: 'Procurement', variant: 'default' },
  construction: { label: 'Construction', variant: 'default' },
  completed: { label: 'Completed', variant: 'secondary' },
  on_hold: { label: 'On Hold', variant: 'destructive' },
};

export default function ProjectDetailPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const projectId = resolvedParams.projectId;
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  const { data: project, isLoading, error } = useQuery({
    queryKey: ['project', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (error) throw error;
      return data;
    },
  });

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      return;
    }

    setDeleting(true);
    try {
      const { error } = await supabase.from('projects').delete().eq('id', projectId);
      if (error) throw error;

      toast.success('Project deleted successfully');
      router.push('/app-dashboard/projects');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete project');
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

  const calculateDuration = () => {
    if (!project?.start_date || !project?.end_date) return null;
    const start = new Date(project.start_date);
    const end = new Date(project.end_date);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return days;
  };

  if (error) {
    return (
      <div className="space-y-6">
        <Breadcrumbs />
        <div className="text-center py-12">
          <FolderKanban className="h-12 w-12 mx-auto text-destructive mb-4" />
          <p className="text-destructive">Failed to load project</p>
          <p className="text-sm text-muted-foreground mt-1">{(error as Error).message}</p>
          <Button className="mt-4" asChild>
            <Link href="/app-dashboard/projects">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Projects
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
            <Link href="/app-dashboard/projects">
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
                  <FolderKanban className="h-8 w-8" />
                  {project?.name}
                </h1>
                <p className="text-muted-foreground flex items-center gap-2 mt-1">
                  {project?.location && (
                    <>
                      <MapPin className="h-4 w-4" />
                      {project.location}
                    </>
                  )}
                </p>
              </>
            )}
          </div>
        </div>

        {!isLoading && project && (
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
        {/* Left Column */}
        <div className="md:col-span-2 space-y-6">
          {/* Overview Card */}
          <Card>
            <CardHeader>
              <CardTitle>Project Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Status</p>
                      {project?.status && statusConfig[project.status as ProjectStatus] && (
                        <Badge variant={statusConfig[project.status as ProjectStatus].variant}>
                          {statusConfig[project.status as ProjectStatus].label}
                        </Badge>
                      )}
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Budget</p>
                      <p className="text-lg font-semibold text-green-600">
                        {formatCurrency(project?.budget)}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Start Date</p>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <p className="font-medium">{formatDate(project?.start_date)}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">End Date</p>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <p className="font-medium">{formatDate(project?.end_date)}</p>
                      </div>
                    </div>
                  </div>

                  {project?.description && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Description</p>
                      <p className="text-sm border rounded-lg p-3 bg-muted/30">
                        {project.description}
                      </p>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Related Entities */}
          <RelatedEntities entityType="project" entityId={projectId} />
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Metrics Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Project Metrics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {isLoading ? (
                <Skeleton className="h-16 w-full" />
              ) : (
                <>
                  {calculateDuration() && (
                    <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <span className="text-sm text-muted-foreground">Duration</span>
                      <span className="font-semibold">{calculateDuration()} days</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <span className="text-sm text-muted-foreground">Created</span>
                    <span className="font-semibold">{formatDate(project?.created_at)}</span>
                  </div>
                  {project?.start_date && (
                    <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <span className="text-sm text-muted-foreground">Days Since Start</span>
                      <span className="font-semibold">
                        {Math.floor(
                          (Date.now() - new Date(project.start_date).getTime()) /
                            (1000 * 60 * 60 * 24)
                        )}
                      </span>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" size="sm" className="w-full justify-start">
                Create Deal
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start">
                Add Task
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start">
                Log Activity
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
