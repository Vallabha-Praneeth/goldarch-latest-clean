/**
 * Job Status Tracker Component
 * Real-time status tracking for plan processing jobs
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';

interface JobStatusTrackerProps {
  jobId: string;
  onComplete?: (analysisId: string) => void;
  pollInterval?: number; // in milliseconds
}

export function JobStatusTracker({
  jobId,
  onComplete,
  pollInterval = 3000
}: JobStatusTrackerProps) {
  const [status, setStatus] = useState<string>('queued');
  const [progress, setProgress] = useState<{ stage: string; percentage: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [analysisId, setAnalysisId] = useState<string | null>(null);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    const fetchStatus = async () => {
      try {
        const response = await fetch(`/api/plans/${jobId}/status`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch status');
        }

        setStatus(data.job.status);
        setProgress(data.progress);

        if (data.job.error) {
          setError(data.job.error);
        }

        if (data.analysisId) {
          setAnalysisId(data.analysisId);

          // Notify parent component
          if (onComplete) {
            onComplete(data.analysisId);
          }

          // Stop polling when complete
          if (data.job.status === 'completed' || data.job.status === 'needs_review') {
            clearInterval(intervalId);
          }
        }

        // Stop polling on failure
        if (data.job.status === 'failed') {
          clearInterval(intervalId);
        }

      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch status');
      }
    };

    // Initial fetch
    fetchStatus();

    // Set up polling
    intervalId = setInterval(fetchStatus, pollInterval);

    // Cleanup
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [jobId, pollInterval, onComplete]);

  // Status badge
  const getStatusBadge = () => {
    switch (status) {
      case 'queued':
        return <Badge variant="secondary">Queued</Badge>;
      case 'processing':
        return (
          <Badge variant="default" className="bg-blue-500">
            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
            Processing
          </Badge>
        );
      case 'completed':
        return (
          <Badge variant="default" className="bg-green-500">
            <CheckCircle2 className="mr-1 h-3 w-3" />
            Completed
          </Badge>
        );
      case 'needs_review':
        return (
          <Badge variant="default" className="bg-yellow-500">
            <AlertTriangle className="mr-1 h-3 w-3" />
            Needs Review
          </Badge>
        );
      case 'failed':
        return (
          <Badge variant="destructive">
            <XCircle className="mr-1 h-3 w-3" />
            Failed
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Processing Status</CardTitle>
          {getStatusBadge()}
        </div>
        <CardDescription>Job ID: {jobId}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress */}
        {progress && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{progress.stage}</span>
              <span className="font-medium">{progress.percentage}%</span>
            </div>
            <Progress value={progress.percentage} />
          </div>
        )}

        {/* Error Alert */}
        {error && status === 'failed' && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Success Info */}
        {status === 'completed' && analysisId && (
          <Alert>
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>
              Analysis completed successfully! You can now generate a quote.
            </AlertDescription>
          </Alert>
        )}

        {/* Needs Review Info */}
        {status === 'needs_review' && analysisId && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Analysis completed, but some items have low confidence. Please review before generating a quote.
            </AlertDescription>
          </Alert>
        )}

        {/* Processing Info */}
        {status === 'processing' && (
          <div className="text-xs text-muted-foreground space-y-1">
            <p>• Analyzing construction plan pages</p>
            <p>• Extracting quantities from schedules and symbols</p>
            <p>• Validating results</p>
            <p className="font-medium mt-2">This usually takes 2-5 minutes...</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
