/**
 * PDF Generation Module - API Route
 * Phase 2 - Modular Implementation
 *
 * Installation Instructions:
 * 1. Copy this file to: app/api/quote/pdf/[quoteId]/route.ts
 * 2. Make sure pdf-generator.ts is at: lib/pdf/pdf-generator.ts
 * 3. Install dependencies: npm install puppeteer
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateQuotePDF, validateQuoteData } from '@/lib/pdf/pdf-generator';
import { QuotePDFData } from '@/lib/pdf/types';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ quoteId: string }> }
) {
  try {
    const params = await context.params;
    const { quoteId } = params;

    // Initialize Supabase with service role
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Fetch quotation with related data
    const { data: quotation, error } = await supabase
      .from('quotations')
      .select(`
        *,
        quotation_lines(*),
        quote_leads(*)
      `)
      .eq('id', quoteId)
      .single();

    if (error || !quotation) {
      return NextResponse.json(
        { error: 'Quotation not found' },
        { status: 404 }
      );
    }

    // Transform data for PDF
    const pdfData: QuotePDFData = {
      quoteNumber: quotation.quote_number,
      createdAt: quotation.created_at,
      validUntil: quotation.valid_until,
      lead: {
        name: quotation.quote_leads.name,
        email: quotation.quote_leads.email,
        phone: quotation.quote_leads.phone,
        company: quotation.quote_leads.company,
      },
      lineItems: quotation.quotation_lines.map((line: any) => ({
        description: line.description,
        quantity: line.quantity,
        unitPrice: line.unit_price,
        lineTotal: line.line_total,
      })),
      subtotal: quotation.subtotal,
      discount: quotation.discount_amount || 0,
      tax: quotation.tax_placeholder || 0,
      total: quotation.total,
      currency: quotation.currency || 'USD',
    };

    // Validate data
    const validation = validateQuoteData(pdfData);
    if (!validation.valid) {
      return NextResponse.json(
        { error: 'Invalid quote data', details: validation.errors },
        { status: 400 }
      );
    }

    // Generate PDF
    const result = await generateQuotePDF(pdfData, {
      includeTerms: true,
      format: 'A4',
    });

    if (!result.success || !result.buffer) {
      return NextResponse.json(
        { error: result.error || 'Failed to generate PDF' },
        { status: 500 }
      );
    }

    // Return PDF
    return new NextResponse(result.buffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${result.fileName}"`,
        'Content-Length': result.buffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('PDF generation error:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate PDF',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
