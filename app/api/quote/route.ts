/**
 * /api/quote
 * GET - List all quotes (AUTHENTICATED)
 * POST - Create new quote (AUTHENTICATED)
 *
 * NOTE:
 * Avoid PostgREST embedded relationship selects (e.g. lead:quote_leads(...))
 * because production schema cache may not have the relationship configured.
 * We fetch quotes first, then fetch leads separately and stitch in-memory.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import { supabaseAdmin } from '@/lib/supabase-service';

type QuoteRow = Record<string, any>;
type LeadRow = { id: string; name?: string | null; email?: string | null; company?: string | null };

/**
 * GET /api/quote
 * List all quotes for authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (auth.response) return auth.response;

    const { user } = auth;

    // Fetch quotes (filtered by user_id — bypasses RLS via service role)
    const { data: quotes, error } = await supabaseAdmin
      .from('quotations')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching quotes:', error);
      return NextResponse.json(
        { error: 'Failed to fetch quotes', details: error.message },
        { status: 500 }
      );
    }

    const safeQuotes: QuoteRow[] = quotes || [];

    // Collect unique lead_ids
    const leadIds = Array.from(
      new Set(
        safeQuotes
          .map((q) => q.lead_id)
          .filter((v): v is string => typeof v === 'string' && v.length > 0)
      )
    );

    // Fetch leads separately (no relationship required)
    let leadsById: Record<string, LeadRow> = {};
    if (leadIds.length > 0) {
      const { data: leads, error: leadsError } = await supabaseAdmin
        .from('quote_leads')
        .select('id, name, email, company')
        .in('id', leadIds);

      if (leadsError) {
        // Fail-soft: still return quotes list without embedded lead data
        console.warn('Warning fetching quote leads:', leadsError);
      } else {
        (leads || []).forEach((l: any) => {
          if (l?.id) leadsById[String(l.id)] = l as LeadRow;
        });
      }
    }

    const hydrated = safeQuotes.map((q) => ({
      ...q,
      lead: q.lead_id ? leadsById[String(q.lead_id)] ?? null : null,
    }));

    return NextResponse.json({ quotes: hydrated });
  } catch (error) {
    console.error('GET quotes error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/quote
 * Create a new quote
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (auth.response) return auth.response;
    const { user } = auth;

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
      return NextResponse.json({ error: 'lead_id is required' }, { status: 400 });
    }

    // Create quote (service role — bypasses RLS)
    const { data: quote, error } = await supabaseAdmin
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
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
