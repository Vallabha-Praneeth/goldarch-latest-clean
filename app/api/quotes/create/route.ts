/**
 * MODULE-1C: Quote Creation
 * API Route: POST /api/quotes/create
 *
 * Create a new quote with proper server-side validation.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

interface CreateQuoteRequest {
  quote_number: string;
  title?: string;
  status?: string;
  supplier_id?: string | null;
  deal_id?: string | null;
  valid_until?: string | null;
  subtotal?: number;
  tax?: number;
  total?: number;
  currency?: string;
  notes?: string | null;
}

export async function POST(request: NextRequest) {
  try {
    // Create Supabase client
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: (cookiesToSet) => {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          },
        },
      }
    );

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body: CreateQuoteRequest = await request.json();

    // Validate required fields
    if (!body.quote_number || !body.quote_number.trim()) {
      return NextResponse.json(
        { error: 'Quote number is required' },
        { status: 400 }
      );
    }

    // Calculate total if not provided
    const subtotal = body.subtotal ?? 0;
    const tax = body.tax ?? 0;
    const total = body.total ?? (subtotal + tax);

    // Prepare insert data
    const insertData: Record<string, any> = {
      quote_number: body.quote_number.trim(),
      title: body.title?.trim() || body.quote_number.trim(),
      status: body.status || 'draft',
      subtotal,
      tax,
      total,
      currency: body.currency || 'USD',
      created_by: user.id,
    };

    // Add optional fields only if they have values
    if (body.supplier_id && body.supplier_id.trim()) {
      insertData.supplier_id = body.supplier_id;
    }
    if (body.deal_id && body.deal_id.trim()) {
      insertData.deal_id = body.deal_id;
    }
    if (body.valid_until && body.valid_until.trim()) {
      insertData.valid_until = body.valid_until;
    }
    if (body.notes && body.notes.trim()) {
      insertData.notes = body.notes.trim();
    }

    // Create quote
    const { data: quote, error: insertError } = await supabase
      .from('quotes')
      .insert(insertData)
      .select()
      .single();

    if (insertError) {
      console.error('[Create Quote] Insert error:', insertError);
      return NextResponse.json(
        { error: insertError.message || 'Failed to create quote' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      quote,
      message: 'Quote created successfully',
    });
  } catch (error: unknown) {
    console.error('[Create Quote] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
