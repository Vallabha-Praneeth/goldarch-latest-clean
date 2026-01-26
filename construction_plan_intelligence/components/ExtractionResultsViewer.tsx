/**
 * Extraction Results Viewer Component
 * Displays extracted quantities with confidence indicators
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import {
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  DoorOpen,
  Home,
  Bath,
  Utensils,
  FileText,
  Loader2
} from 'lucide-react';

interface ExtractionResultsViewerProps {
  jobId: string;
  onGenerateQuote?: () => void;
}

export function ExtractionResultsViewer({
  jobId,
  onGenerateQuote
}: ExtractionResultsViewerProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<any>(null);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const response = await fetch(`/api/plans/${jobId}/result`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch results');
        }

        setResults(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load results');
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [jobId]);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!results) {
    return null;
  }

  const { analysis, quote } = results;
  const quantities = analysis.quantities;

  // Confidence badge helper
  const getConfidenceBadge = (confidence: string) => {
    switch (confidence) {
      case 'high':
        return <Badge variant="default" className="bg-green-500">High Confidence</Badge>;
      case 'medium':
        return <Badge variant="default" className="bg-yellow-500">Medium Confidence</Badge>;
      case 'low':
        return <Badge variant="destructive">Low Confidence</Badge>;
      default:
        return <Badge variant="outline">{confidence}</Badge>;
    }
  };

  // Confidence icon helper
  const getConfidenceIcon = (confidence: string) => {
    switch (confidence) {
      case 'high':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'medium':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'low':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle>Extraction Results</CardTitle>
          <CardDescription>
            AI-extracted quantities from construction plan
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Meta Info */}
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Plan Type:</span>
              <p className="font-medium capitalize">{quantities.meta.plan_type}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Floors Detected:</span>
              <p className="font-medium">{quantities.meta.floors_detected}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Units:</span>
              <p className="font-medium capitalize">{quantities.meta.units}</p>
            </div>
          </div>

          {quantities.meta.notes && (
            <Alert className="mt-4">
              <FileText className="h-4 w-4" />
              <AlertDescription>{quantities.meta.notes}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Review Flags */}
      {analysis.needs_review && quantities.review.flags.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Review Required:</strong>
            <ul className="list-disc list-inside mt-2">
              {quantities.review.flags.map((flag: string, idx: number) => (
                <li key={idx}>{flag}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Doors */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DoorOpen className="h-5 w-5" />
              <CardTitle className="text-lg">Doors</CardTitle>
            </div>
            {getConfidenceBadge(quantities.doors.confidence)}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-3xl font-bold">{quantities.doors.total} Total</div>
          <Separator />
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-muted-foreground">Entry:</span>
              <span className="ml-2 font-medium">{quantities.doors.by_type.entry}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Interior:</span>
              <span className="ml-2 font-medium">{quantities.doors.by_type.interior}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Sliding:</span>
              <span className="ml-2 font-medium">{quantities.doors.by_type.sliding}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Bifold:</span>
              <span className="ml-2 font-medium">{quantities.doors.by_type.bifold}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Windows */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Home className="h-5 w-5" />
              <CardTitle className="text-lg">Windows</CardTitle>
            </div>
            {getConfidenceBadge(quantities.windows.confidence)}
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{quantities.windows.total} Total</div>
        </CardContent>
      </Card>

      {/* Kitchen */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Utensils className="h-5 w-5" />
              <CardTitle className="text-lg">Kitchen</CardTitle>
            </div>
            {getConfidenceBadge(quantities.kitchen.confidence)}
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <div>
            <span className="text-muted-foreground">Cabinets (count):</span>
            <span className="ml-2 font-medium text-lg">{quantities.kitchen.cabinets_count_est}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Linear Feet:</span>
            <span className="ml-2 font-medium text-lg">{quantities.kitchen.linear_ft_est}</span>
          </div>
        </CardContent>
      </Card>

      {/* Bathrooms */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bath className="h-5 w-5" />
              <CardTitle className="text-lg">Bathrooms</CardTitle>
            </div>
            {getConfidenceBadge(quantities.bathrooms.confidence)}
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-muted-foreground">Bathrooms:</span>
            <span className="ml-2 font-medium">{quantities.bathrooms.bathroom_count}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Toilets:</span>
            <span className="ml-2 font-medium">{quantities.bathrooms.toilets}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Sinks:</span>
            <span className="ml-2 font-medium">{quantities.bathrooms.sinks}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Showers:</span>
            <span className="ml-2 font-medium">{quantities.bathrooms.showers}</span>
          </div>
        </CardContent>
      </Card>

      {/* Generate Quote Button */}
      {!quote && (
        <Button
          onClick={onGenerateQuote}
          size="lg"
          className="w-full"
        >
          Generate Quote from These Quantities
        </Button>
      )}

      {/* Existing Quote Info */}
      {quote && (
        <Alert>
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription>
            Quote already generated: {quote.currency} {quote.total.toFixed(2)} ({quote.status})
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
