/**
 * /api/quote/[quoteId]/items
 * GET - List all line items for a quote (AUTHENTICATED)
 * POST - Add new line item to quote (AUTHENTICATED)
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, createAuthenticatedSupabaseClient } from '@/lib/auth-helpers';

interface RouteContext {
  params: Promise<{ quoteId: string }>;
}

/**
 * GET /api/quote/[quoteId]/items
 * List all line items for a quote
 */
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const auth = await requireAuth(request);
    if (auth.response) {
      return auth.response;
    }

    const { quoteId } = await context.params;
    const supabase = await createAuthenticatedSupabaseClient();

    // Verify quote access (RLS enforced)
    const { data: quote, error: quoteError } = await supabase
      .from('quotations')
      .select('id')
      .eq('id', quoteId)
      .single();

    if (quoteError || !quote) {
      return NextResponse.json(
        { error: 'Quote not found or access denied' },
        { status: 404 }
      );
    }

    // Fetch line items
    const { data: items, error } = await supabase
      .from('quotation_lines')
      .select('*')
      .eq('quotation_id', quoteId)
      .order('line_number', { ascending: true });

    if (error) {
      console.error('Error fetching line items:', error);
      return NextResponse.json(
        { error: 'Failed to fetch line items', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ items: items || [] });
  } catch (error) {
    console.error('GET line items error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/quote/[quoteId]/items
 * Add new line item to quote
 */
export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const auth = await requireAuth(request);
    if (auth.response) {
      return auth.response;
    }

    const { quoteId } = await context.params;
    const body = await request.json();
    const supabase = await createAuthenticatedSupabaseClient();

    // Verify quote access
    const { data: quote, error: quoteError } = await supabase
      .from('quotations')
      .select('id')
      .eq('id', quoteId)
      .single();

    if (quoteError || !quote) {
      return NextResponse.json(
        { error: 'Quote not found or access denied' },
        { status: 404 }
      );
    }

    const {
      line_number,
      category,
      subcategory,
      product_id,
      description,
      quantity = 1,
      unit_of_measure = 'ea',
      unit_price,
      extraction_evidence,
      notes,
    } = body;

    // Validate required fields
    if (!category || !description || unit_price === undefined) {
      return NextResponse.json(
        { error: 'category, description, and unit_price are required' },
        { status: 400 }
      );
    }

    // If line_number not provided, get next number
    let lineNumber = line_number;
    if (!lineNumber) {
      const { data: maxLine } = await supabase
        .from('quotation_lines')
        .select('line_number')
        .eq('quotation_id', quoteId)
        .order('line_number', { ascending: false })
        .limit(1)
        .single();

      lineNumber = (maxLine?.line_number || 0) + 1;
    }

    // Create line item
    const { data: item, error } = await supabase
      .from('quotation_lines')
      .insert({
        quotation_id: quoteId,
        line_number: lineNumber,
        category,
        subcategory,
        product_id,
        description,
        quantity,
        unit_of_measure,
        unit_price,
        extraction_evidence,
        notes,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating line item:', error);
      return NextResponse.json(
        { error: 'Failed to create line item', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    console.error('POST line item error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
