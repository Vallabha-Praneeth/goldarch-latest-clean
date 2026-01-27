/**
 * /api/quote/[quoteId]
 * GET - Fetch full quote details including line items (AUTHENTICATED)
 * PATCH - Update quote (AUTHENTICATED)
 * DELETE - Delete quote (AUTHENTICATED)
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, createAuthenticatedSupabaseClient } from '@/lib/auth-helpers';

interface RouteContext {
  params: Promise<{ quoteId: string }>;
}

/**
 * GET /api/quote/[quoteId]
 * Fetch quote with line items (requires auth)
 */
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    // Require authentication
    const auth = await requireAuth(request);
    if (auth.response) {
      return auth.response;
    }

    const { quoteId } = await context.params;
    const supabase = await createAuthenticatedSupabaseClient();

    // Fetch quote with line items (RLS enforced)
    const { data: quote, error: quoteError } = await supabase
      .from('quotations')
      .select(`
        *,
        quotation_lines (*)
      `)
      .eq('id', quoteId)
      .single();

    if (quoteError) {
      console.error('Quote fetch error:', quoteError);
      return NextResponse.json(
        { error: 'Quote not found' },
        { status: 404 }
      );
    }

    if (!quote) {
      return NextResponse.json(
        { error: 'Quote not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(quote);
  } catch (error) {
    console.error('Error fetching quote:', error);
    return NextResponse.json(
      { error: 'Failed to fetch quote' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/quote/[quoteId]
 * Update quote fields (requires auth)
 */
export async function PATCH(
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

    // Whitelist allowed update fields
    const allowedFields = [
      'lead_id',
      'extraction_job_id',
      'status',
      'subtotal',
      'tax_placeholder',
      'discount_amount',
      'total',
      'currency',
      'valid_until',
      'internal_notes',
      'customer_notes',
      'terms_and_conditions',
      'sent_at',
      'sent_to_email',
    ];
    const updateData: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (field in body) {
        updateData[field] = body[field];
      }
    }

    // Update quote (RLS enforced)
    const { data: quote, error } = await supabase
      .from('quotations')
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', quoteId)
      .select()
      .single();

    if (error) {
      console.error('Quote update error:', error);
      return NextResponse.json(
        { error: 'Failed to update quote', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ quote });
  } catch (error) {
    console.error('Error updating quote:', error);
    return NextResponse.json(
      { error: 'Failed to update quote' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/quote/[quoteId]
 * Delete quote (requires auth, cascade deletes line items)
 */
export async function DELETE(
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

    // Delete quote (RLS enforced, cascade deletes quotation_lines)
    const { data, error } = await supabase
      .from('quotations')
      .delete()
      .eq('id', quoteId)
      .select();

    if (error) {
      console.error('Quote delete error:', error);
      return NextResponse.json(
        { error: 'Failed to delete quote', details: error.message },
        { status: 500 }
      );
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: 'Quote not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting quote:', error);
    return NextResponse.json(
      { error: 'Failed to delete quote' },
      { status: 500 }
    );
  }
}
