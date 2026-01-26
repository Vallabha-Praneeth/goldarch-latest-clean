'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Upload,
  Loader2,
  CheckCircle2,
  AlertCircle,
  FileText,
  Clock,
  XCircle,
  AlertTriangle,
  DollarSign,
  Eye
} from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';

interface PlanJob {
  id: string;
  file_path: string;
  file_type: string;
  status: string;
  error?: string;
  created_at: string;
  updated_at: string;
}

export default function PlansPage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [jobs, setJobs] = useState<PlanJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState<string | null>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Fetch user's jobs
  const fetchJobs = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('plan_jobs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setJobs(data || []);
    } catch (err) {
      console.error('Failed to fetch jobs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
    // Refresh every 5 seconds to show progress
    const interval = setInterval(fetchJobs, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const validTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!validTypes.includes(selectedFile.type)) {
        setError('Invalid file type. Please upload a PDF or image.');
        return;
      }

      const maxSize = 50 * 1024 * 1024;
      if (selectedFile.size > maxSize) {
        setError('File too large. Maximum size is 50MB.');
        return;
      }

      setFile(selectedFile);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/plans/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.details || data.error || 'Upload failed');
      }

      setFile(null);
      fetchJobs(); // Refresh job list

      // Switch to Jobs tab to see the new job
      const jobsTab = document.querySelector('[value="jobs"]') as HTMLElement;
      jobsTab?.click();

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'queued':
        return <Badge variant="secondary"><Clock className="mr-1 h-3 w-3" />Queued</Badge>;
      case 'processing':
        return <Badge variant="default" className="bg-blue-500"><Loader2 className="mr-1 h-3 w-3 animate-spin" />Processing</Badge>;
      case 'completed':
        return <Badge variant="default" className="bg-green-500"><CheckCircle2 className="mr-1 h-3 w-3" />Completed</Badge>;
      case 'needs_review':
        return <Badge variant="default" className="bg-yellow-500"><AlertTriangle className="mr-1 h-3 w-3" />Needs Review</Badge>;
      case 'failed':
        return <Badge variant="destructive"><XCircle className="mr-1 h-3 w-3" />Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Construction Plans</h1>
          <p className="text-muted-foreground mt-1">
            Upload plans and generate quotes automatically with AI
          </p>
        </div>
      </div>

      <Tabs defaultValue="upload" className="space-y-6">
        <TabsList>
          <TabsTrigger value="upload">
            <Upload className="mr-2 h-4 w-4" />
            Upload Plan
          </TabsTrigger>
          <TabsTrigger value="jobs">
            <FileText className="mr-2 h-4 w-4" />
            My Plans ({jobs.length})
          </TabsTrigger>
        </TabsList>

        {/* Upload Tab */}
        <TabsContent value="upload">
          <Card>
            <CardHeader>
              <CardTitle>Upload Construction Plan</CardTitle>
              <CardDescription>
                Upload a PDF or image of your construction plan. Our AI will extract quantities and generate a quote.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="plan-file" className="text-sm font-medium">
                  Select Plan File
                </label>
                <Input
                  id="plan-file"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.webp"
                  onChange={handleFileChange}
                  disabled={uploading}
                />
                {file && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <FileText className="h-4 w-4" />
                    <span>{file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                  </div>
                )}
              </div>

              <Button
                onClick={handleUpload}
                disabled={!file || uploading}
                className="w-full"
                size="lg"
              >
                {uploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload and Process Plan
                  </>
                )}
              </Button>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="bg-muted p-4 rounded-lg space-y-2 text-sm">
                <p className="font-medium">What happens next:</p>
                <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                  <li>Your plan is uploaded and queued for processing</li>
                  <li>AI analyzes the plan and extracts quantities (2-5 minutes)</li>
                  <li>You can review the results and generate a quote</li>
                  <li>Customize products and finalize pricing</li>
                </ol>
                <p className="text-xs text-muted-foreground mt-3">
                  <strong>Accepted formats:</strong> PDF, JPEG, PNG, WebP • <strong>Max size:</strong> 50MB
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Jobs Tab */}
        <TabsContent value="jobs">
          {loading ? (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </CardContent>
            </Card>
          ) : jobs.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No plans uploaded yet</h3>
                <p className="text-muted-foreground mb-4">
                  Upload your first construction plan to get started
                </p>
                <Button onClick={() => {
                  const uploadTab = document.querySelector('[value="upload"]') as HTMLElement;
                  uploadTab?.click();
                }}>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Plan
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {jobs.map((job) => (
                <Card key={job.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-base flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          {job.file_path.split('/').pop()}
                        </CardTitle>
                        <CardDescription className="mt-1">
                          Uploaded {formatDate(job.created_at)}
                        </CardDescription>
                      </div>
                      {getStatusBadge(job.status)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      {(job.status === 'completed' || job.status === 'needs_review') && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.location.href = `/app-dashboard/plans/${job.id}/results`}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            View Results
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => window.location.href = `/app-dashboard/plans/${job.id}/quote`}
                          >
                            <DollarSign className="mr-2 h-4 w-4" />
                            Generate Quote
                          </Button>
                        </>
                      )}
                      {job.status === 'failed' && job.error && (
                        <Alert variant="destructive" className="mt-2">
                          <AlertDescription className="text-xs">{job.error}</AlertDescription>
                        </Alert>
                      )}
                      {job.status === 'processing' && (
                        <p className="text-sm text-muted-foreground">
                          AI is analyzing your plan... This usually takes 2-5 minutes.
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
