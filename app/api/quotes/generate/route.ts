/**
 * POST /api/quotes/generate
 * Generate a quote from plan analysis results
 * Deterministic mapping from quantities to price book items
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { PlanExtractionResult } from '@/lib/types/extraction-schema';

// Mapping rules: extraction path → price book lookup
const MAPPING_RULES = [
  {
    category: 'door',
    variant: 'standard',
    unit: 'each',
    path: 'doors.total',
    description: 'Standard Door',
  },
  {
    category: 'window',
    variant: 'standard',
    unit: 'each',
    path: 'windows.total',
    description: 'Standard Window',
  },
  {
    category: 'cabinet',
    variant: 'standard',
    unit: 'linear_ft',
    path: 'kitchen.linear_ft_est',
    fallbackPath: 'kitchen.cabinets_count_est',
    fallbackUnit: 'each',
    description: 'Kitchen Cabinets',
  },
  {
    category: 'toilet',
    variant: 'standard',
    unit: 'each',
    path: 'bathrooms.toilets',
    description: 'Standard Toilet',
  },
  {
    category: 'sink',
    variant: 'standard',
    unit: 'each',
    path: 'bathrooms.sinks',
    description: 'Standard Sink',
  },
  {
    category: 'shower',
    variant: 'standard',
    unit: 'each',
    path: 'bathrooms.showers',
    description: 'Standard Shower',
  },
];

// Helper: Extract value from nested object path
function getValueAtPath(obj: any, path: string): number {
  const parts = path.split('.');
  let value = obj;
  for (const part of parts) {
    value = value?.[part];
  }
  return typeof value === 'number' ? value : 0;
}

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: (cookies) => {
            cookies.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Parse request body
    const { jobId, priceBookId } = await request.json();

    if (!jobId) {
      return NextResponse.json({ error: 'jobId is required' }, { status: 400 });
    }

    // 3. Fetch job and verify ownership
    const { data: job, error: jobError } = await supabase
      .from('plan_jobs')
      .select('*')
      .eq('id', jobId)
      .single();

    if (jobError || !job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    if (job.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 4. Fetch analysis results
    const { data: analysis, error: analysisError } = await supabase
      .from('plan_analyses')
      .select('*')
      .eq('job_id', jobId)
      .single();

    if (analysisError || !analysis) {
      return NextResponse.json(
        { error: 'Analysis not found. Job must be completed first.' },
        { status: 404 }
      );
    }

    const quantities = analysis.quantities as PlanExtractionResult;

    // 5. Get active price book (use provided ID or default to active)
    let activePriceBook;
    if (priceBookId) {
      const { data, error } = await supabase
        .from('price_books')
        .select('*')
        .eq('id', priceBookId)
        .single();

      if (error || !data) {
        return NextResponse.json({ error: 'Price book not found' }, { status: 404 });
      }
      activePriceBook = data;
    } else {
      const { data, error } = await supabase
        .from('price_books')
        .select('*')
        .eq('is_active', true)
        .single();

      if (error || !data) {
        return NextResponse.json(
          { error: 'No active price book found. Please set a price book as active.' },
          { status: 404 }
        );
      }
      activePriceBook = data;
    }

    // 6. Fetch all price items for the price book
    const { data: priceItems, error: priceItemsError } = await supabase
      .from('price_items')
      .select('*')
      .eq('price_book_id', activePriceBook.id);

    if (priceItemsError) {
      return NextResponse.json(
        { error: 'Failed to fetch price items' },
        { status: 500 }
      );
    }

    // 7. Generate quote lines using deterministic mapping
    const quoteLines: Record<string, any>[] = [];
    let hasLowConfidence = false;

    for (const rule of MAPPING_RULES) {
      let qty = getValueAtPath(quantities, rule.path);
      let unit = rule.unit;

      // Handle fallback for kitchen cabinets
      if (qty === 0 && rule.fallbackPath) {
        qty = getValueAtPath(quantities, rule.fallbackPath);
        unit = rule.fallbackUnit || unit;
      }

      // Skip if quantity is 0
      if (qty === 0) continue;

      // Find matching price item
      const priceItem = priceItems?.find(
        (item) =>
          item.category === rule.category &&
          item.variant === rule.variant &&
          item.unit === unit
      );

      if (!priceItem) {
        console.warn(`No price item found for ${rule.category} - ${rule.variant} - ${unit}`);
        continue;
      }

      // Calculate line total
      const lineTotal = qty * parseFloat(priceItem.unit_price.toString());

      // Check confidence level for this section
      const confidencePath = rule.path.split('.')[0]; // e.g., "doors" from "doors.total"
      const confidence = quantities[confidencePath as keyof PlanExtractionResult];
      if (confidence && typeof confidence === 'object' && 'confidence' in confidence) {
        if (confidence.confidence === 'low') {
          hasLowConfidence = true;
        }
      }

      quoteLines.push({
        category: rule.category,
        title: rule.description,
        description: rule.description,
        quantity: qty,
        unit: unit,
        unit_price: parseFloat(priceItem.unit_price.toString()),
        line_total: lineTotal,
        extraction_meta: { sku: priceItem.sku, selections: {} },
      });
    }

    if (quoteLines.length === 0) {
      return NextResponse.json(
        { error: 'No items to quote. Analysis may not have found any quantities.' },
        { status: 400 }
      );
    }

    // 8. Calculate totals
    const subtotal = quoteLines.reduce((sum, line) => sum + (line.line_total || 0), 0);
    const taxRate = 0.18; // 18% GST (configurable)
    const tax = subtotal * taxRate;
    const total = subtotal + tax;

    // 9. Create quote record
    const notes = hasLowConfidence
      ? 'ESTIMATE - This quote contains items with low confidence. Please review the analysis before finalizing.'
      : 'Auto-generated quote from construction plan analysis.';

    const { data: quote, error: quoteError } = await supabase
      .from('quotations')
      .insert({
        user_id: user.id,
        extraction_job_id: jobId,
        status: 'draft',
        subtotal: subtotal,
        tax_placeholder: tax,
        discount_amount: 0,
        total: total,
        currency: activePriceBook.currency,
        internal_notes: notes,
        created_by: user.id,
      })
      .select()
      .single();

    if (quoteError) {
      console.error('Quote creation error:', quoteError);
      return NextResponse.json(
        { error: 'Failed to create quote', details: quoteError.message },
        { status: 500 }
      );
    }

    // 10. Create quotation line items
    const linesWithQuoteId = quoteLines.map((line, index) => ({
      ...line,
      quotation_id: quote.id,
      line_number: index + 1,
    }));

    const { data: createdLines, error: linesError } = await supabase
      .from('quotation_lines')
      .insert(linesWithQuoteId)
      .select();

    if (linesError) {
      console.error('Quote lines creation error:', linesError);
      // Rollback: delete the quote
      await supabase.from('quotations').delete().eq('id', quote.id);
      return NextResponse.json(
        { error: 'Failed to create quote lines', details: linesError.message },
        { status: 500 }
      );
    }

    // 11. Return success response
    return NextResponse.json({
      quoteId: quote.id,
      quote: quote,
      lines: createdLines,
      hasLowConfidence,
      message: hasLowConfidence
        ? 'Quote generated successfully, but contains low-confidence items. Please review.'
        : 'Quote generated successfully.',
    });

  } catch (error) {
    console.error('Quote generation error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
