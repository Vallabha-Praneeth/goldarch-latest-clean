/**
 * /api/quote
 * GET - List all quotes (AUTHENTICATED)
 * POST - Create new quote (AUTHENTICATED)
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, createAuthenticatedSupabaseClient } from '@/lib/auth-helpers';

/**
 * GET /api/quote
 * List all quotes for authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (auth.response) {
      return auth.response;
    }

    const supabase = await createAuthenticatedSupabaseClient();

    // Fetch quotes (RLS enforced - user can only see their own)
    const { data: quotes, error } = await supabase
      .from('quotations')
      .select(`
        *,
        lead:quote_leads(id, name, email, company)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching quotes:', error);
      return NextResponse.json(
        { error: 'Failed to fetch quotes', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ quotes: quotes || [] });
  } catch (error) {
    console.error('GET quotes error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/quote
 * Create a new quote
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (auth.response) {
      return auth.response;
    }
    const { user } = auth;

    const supabase = await createAuthenticatedSupabaseClient();
    const body = await request.json();

    const {
      lead_id,
      extraction_job_id,
      status = 'draft',
      subtotal = 0,
      tax_placeholder = 0,
      discount_amount = 0,
      total = 0,
      currency = 'USD',
      valid_until,
      internal_notes,
      customer_notes,
      terms_and_conditions,
    } = body;

    // Validate required fields
    if (!lead_id) {
      return NextResponse.json(
        { error: 'lead_id is required' },
        { status: 400 }
      );
    }

    // Create quote (RLS enforced)
    const { data: quote, error } = await supabase
      .from('quotations')
      .insert({
        lead_id,
        user_id: user.id,
        extraction_job_id,
        status,
        subtotal,
        tax_placeholder,
        discount_amount,
        total,
        currency,
        valid_until,
        internal_notes,
        customer_notes,
        terms_and_conditions,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating quote:', error);
      return NextResponse.json(
        { error: 'Failed to create quote', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ quote }, { status: 201 });
  } catch (error) {
    console.error('POST quote error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
