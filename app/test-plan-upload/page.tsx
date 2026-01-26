'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

export default function TestPlanUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [authStatus, setAuthStatus] = useState<string>('Checking...');
  const [userEmail, setUserEmail] = useState<string>('');

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setAuthStatus('✅ Authenticated');
        setUserEmail(user.email || 'No email');
      } else {
        setAuthStatus('❌ Not authenticated - Please log in first');
      }
    };
    checkAuth();
  }, [supabase]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
      setResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file first');
      return;
    }

    setUploading(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/plans/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        const errorDetails = [
          `Status: ${response.status}`,
          `Error: ${data.error || 'Unknown'}`,
          data.details ? `Details: ${data.details}` : null,
        ].filter(Boolean).join('\n');

        throw new Error(errorDetails);
      }

      setResult(data);
    } catch (err) {
      console.error('Upload error:', err);
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">Construction Plan Intelligence - Test Upload</h1>

      {/* Auth Status */}
      <Alert className="mb-6">
        <AlertDescription>
          <p><strong>Auth Status:</strong> {authStatus}</p>
          {userEmail && <p className="text-sm text-muted-foreground mt-1">User: {userEmail}</p>}
        </AlertDescription>
      </Alert>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Upload Test Plan</CardTitle>
          <CardDescription>
            Test the plan upload API endpoint
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.webp"
              onChange={handleFileChange}
              disabled={uploading}
            />
          </div>

          <Button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="w-full"
          >
            {uploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Upload Plan
              </>
            )}
          </Button>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <pre className="whitespace-pre-wrap text-xs">{error}</pre>
              </AlertDescription>
            </Alert>
          )}

          {result && (
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p><strong>Success!</strong> File uploaded successfully.</p>
                  <div className="text-xs space-y-1 mt-2">
                    <p><strong>Job ID:</strong> {result.jobId}</p>
                    <p><strong>File Path:</strong> {result.filePath}</p>
                    <p><strong>Status:</strong> {result.status}</p>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Test Instructions</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <p><strong>1. Upload a PDF or image</strong> - Any construction plan or even a test image</p>
          <p><strong>2. Check the result</strong> - You should get a Job ID and status "queued"</p>
          <p><strong>3. Verify in database:</strong></p>
          <pre className="bg-gray-100 p-2 rounded text-xs">
            SELECT id, file_path, status FROM plan_jobs ORDER BY created_at DESC LIMIT 1;
          </pre>
          <p className="text-muted-foreground mt-4">
            Note: The job will stay in "queued" status until you start the Python worker.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
