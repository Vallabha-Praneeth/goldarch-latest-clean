/**
 * /api/quote/[quoteId]/items/[itemId]
 * PATCH - Update line item (AUTHENTICATED)
 * DELETE - Delete line item (AUTHENTICATED)
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, createAuthenticatedSupabaseClient } from '@/lib/auth-helpers';

interface RouteContext {
  params: Promise<{ quoteId: string; itemId: string }>;
}

/**
 * PATCH /api/quote/[quoteId]/items/[itemId]
 * Update line item
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

    const { quoteId, itemId } = await context.params;
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

    // Update line item
    const { data: item, error } = await supabase
      .from('quotation_lines')
      .update(body)
      .eq('id', itemId)
      .eq('quotation_id', quoteId)
      .select()
      .single();

    if (error) {
      console.error('Error updating line item:', error);
      return NextResponse.json(
        { error: 'Failed to update line item', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ item });
  } catch (error) {
    console.error('PATCH line item error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/quote/[quoteId]/items/[itemId]
 * Delete line item
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

    const { quoteId, itemId } = await context.params;
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

    // Delete line item
    const { error } = await supabase
      .from('quotation_lines')
      .delete()
      .eq('id', itemId)
      .eq('quotation_id', quoteId);

    if (error) {
      console.error('Error deleting line item:', error);
      return NextResponse.json(
        { error: 'Failed to delete line item', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE line item error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
