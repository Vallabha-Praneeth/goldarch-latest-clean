'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft,
  Loader2,
  DollarSign,
  CheckCircle2,
  AlertTriangle,
  FileText
} from 'lucide-react';

export default function GenerateQuotePage({ params }: { params: Promise<{ jobId: string }> }) {
  const router = useRouter();
  const [jobId, setJobId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quote, setQuote] = useState<any>(null);
  const [analysis, setAnalysis] = useState<any>(null);

  useEffect(() => {
    params.then(p => {
      setJobId(p.jobId);
      checkExistingQuote(p.jobId);
    });
  }, [params]);

  const checkExistingQuote = async (id: string) => {
    try {
      const response = await fetch(`/api/plans/${id}/result`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch job');
      }

      setAnalysis(data.analysis);

      if (data.quote) {
        // Quote already exists
        setQuote(data.quote);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load job');
    } finally {
      setLoading(false);
    }
  };

  const generateQuote = async () => {
    setGenerating(true);
    setError(null);

    try {
      const response = await fetch('/api/quotes/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.details || data.error || 'Failed to generate quote');
      }

      setQuote(data);

      // Redirect to quotes page after short delay
      setTimeout(() => {
        router.push('/app-dashboard/quotes');
      }, 2000);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate quote');
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6 max-w-3xl">
      {/* Header */}
      <div>
        <Button
          variant="ghost"
          onClick={() => router.push('/app-dashboard/plans')}
          className="mb-2"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Plans
        </Button>
        <h1 className="text-3xl font-bold">Generate Quote</h1>
        <p className="text-muted-foreground mt-1">
          Create a quote from extracted quantities
        </p>
      </div>

      {/* Quote Already Exists */}
      {quote && !generating && (
        <Alert>
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-medium">Quote generated successfully!</p>
              <div className="text-sm text-muted-foreground">
                <p>Quote ID: {quote.quoteId || quote.id}</p>
                <p>Total: {quote.quote?.currency || quote.currency} {(quote.quote?.total || quote.total)?.toFixed(2)}</p>
              </div>
              <div className="flex gap-2 mt-3">
                <Button onClick={() => router.push('/app-dashboard/quotes')}>
                  View in Quotes
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.push(`/app-dashboard/plans/${jobId}/results`)}
                >
                  View Results
                </Button>
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Generate Quote */}
      {!quote && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Review Before Generating</CardTitle>
              <CardDescription>
                We'll use the extracted quantities to create a quote using your active price book
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {analysis?.needs_review && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Warning:</strong> This analysis has low confidence items.
                    The generated quote should be reviewed before sending to customers.
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <h3 className="font-medium">What will be included:</h3>
                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                  <li>Doors: {analysis?.quantities.doors.total} items</li>
                  <li>Windows: {analysis?.quantities.windows.total} items</li>
                  <li>Kitchen Cabinets: {analysis?.quantities.kitchen.linear_ft_est} linear ft</li>
                  <li>Bathroom Fixtures: {analysis?.quantities.bathrooms.toilets} toilets, {analysis?.quantities.bathrooms.sinks} sinks, {analysis?.quantities.bathrooms.showers} showers</li>
                </ul>
              </div>

              <Separator />

              <div className="bg-muted p-4 rounded-lg space-y-2 text-sm">
                <p className="font-medium">Pricing Information:</p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  <li>Prices are sourced from your active price book</li>
                  <li>Standard variants will be used for all items</li>
                  <li>18% GST will be added to the subtotal</li>
                  <li>You can customize products after quote generation</li>
                </ul>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button
                onClick={generateQuote}
                disabled={generating}
                className="w-full"
                size="lg"
              >
                {generating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating Quote...
                  </>
                ) : (
                  <>
                    <DollarSign className="mr-2 h-4 w-4" />
                    Generate Quote
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>After Generation</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <p>Once your quote is generated, you can:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Review and edit line items</li>
                <li>Select specific product variants from your catalog</li>
                <li>Adjust quantities if needed</li>
                <li>Add custom notes and terms</li>
                <li>Send the quote to your customer</li>
              </ul>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
