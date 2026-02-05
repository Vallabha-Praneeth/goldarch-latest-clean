'use client';

import { use, useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Printer, FileDown, Pencil, Loader2 } from 'lucide-react';
import QuoteBOMPreview from '@/components/quote/QuoteBOMPreview';
import { downloadQuotePDF } from '@/lib/utils/generate-pdf';
import type { QuoteBOMData } from '@/lib/types/quotation.types';
import type { Quotation } from '@/lib/types/quotation.types';

function mapQuotationToBOM(raw: Quotation): QuoteBOMData {
  return {
    quoteNumber: raw.quote_number,
    createdAt: raw.created_at,
    validUntil: raw.valid_until,
    lead: {
      name: raw.lead_name || 'Customer',
      email: raw.lead_email || '',
      phone: raw.lead_phone || undefined,
      company: raw.lead_company || undefined,
    },
    lineItems: (raw.quotation_lines || [])
      .sort((a, b) => a.line_number - b.line_number)
      .map((line) => ({
        lineNumber: line.line_number,
        description: line.description || line.title || 'Unnamed item',
        category: line.category || undefined,
        quantity: line.quantity,
        unit: line.unit_of_measure || line.unit || undefined,
        unitPrice: line.unit_price,
        lineTotal: line.line_total,
      })),
    subtotal: raw.subtotal || 0,
    tax: raw.tax_placeholder || 0,
    discount: raw.discount_amount || 0,
    total: raw.total || 0,
    currency: 'USD',
    termsAndConditions: raw.terms_and_conditions || null,
  };
}

interface PageProps {
  params: Promise<{ quoteId: string }>;
}

export default function QuoteDetailPage({ params }: PageProps) {
  const { quoteId } = use(params);
  const router = useRouter();
  const bomRef = useRef<HTMLDivElement>(null);

  const [quote, setQuote] = useState<Quotation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);

  useEffect(() => {
    const fetchQuote = async () => {
      try {
        const response = await fetch(`/api/quote/${quoteId}`);
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to fetch quote');
        }
        const data = await response.json();
        setQuote(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load quote');
      } finally {
        setLoading(false);
      }
    };

    fetchQuote();
  }, [quoteId]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    if (!bomRef.current) return;
    setDownloading(true);
    setPdfError(null);
    try {
      await downloadQuotePDF(bomRef.current, quote?.quote_number ?? 'quote');
    } catch (err) {
      setPdfError('Failed to generate PDF. Please try printing instead.');
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-12 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !quote) {
    return (
      <div className="container mx-auto py-6 max-w-4xl">
        <Button
          variant="ghost"
          onClick={() => router.push('/app-dashboard/quotes')}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Quotes
        </Button>
        <Alert variant="destructive">
          <AlertDescription>{error || 'Quote not found'}</AlertDescription>
        </Alert>
      </div>
    );
  }

  const bomData = mapQuotationToBOM(quote);

  return (
    <>
      {/* Screen-only toolbar */}
      <div className="container mx-auto py-6 max-w-4xl" data-print-hide>
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            onClick={() => router.push('/app-dashboard/quotes')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Quotes
          </Button>

          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handlePrint}>
              <Printer className="mr-2 h-4 w-4" />
              Print
            </Button>
            <Button
              variant="outline"
              onClick={handleDownloadPDF}
              disabled={downloading}
            >
              {downloading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <FileDown className="mr-2 h-4 w-4" />
              )}
              {downloading ? 'Generating...' : 'Download PDF'}
            </Button>
            <Button
              onClick={() =>
                router.push(`/app-dashboard/quotes/${quoteId}/review`)
              }
            >
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </Button>
          </div>
        </div>
      </div>

      {/* PDF error feedback */}
      {pdfError && (
        <div className="container mx-auto max-w-4xl" data-print-hide>
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{pdfError}</AlertDescription>
          </Alert>
        </div>
      )}

      {/* BOM Preview — visible on screen and print */}
      <div className="container mx-auto max-w-4xl pb-12">
        <Card className="bom-print-card">
          <CardContent className="p-8">
            <QuoteBOMPreview ref={bomRef} data={bomData} />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
