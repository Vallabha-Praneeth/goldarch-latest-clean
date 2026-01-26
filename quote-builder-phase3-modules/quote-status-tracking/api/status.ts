/**
 * Quote Status API
 * Path: app/api/quote/[quoteId]/status/route.ts
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const STATUS_TRANSITIONS: Record<string, string[]> = {
  draft: ['sent'],
  sent: ['viewed', 'revised', 'expired'],
  viewed: ['accepted', 'rejected', 'revised'],
  accepted: [],
  rejected: ['revised'],
  expired: ['revised'],
  revised: ['sent'],
};

// GET - Get status history
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ quoteId: string }> }
) {
  try {
    const params = await context.params;
    const { quoteId } = params;

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: quote } = await supabase
      .from('quotations')
      .select('status')
      .eq('id', quoteId)
      .single();

    const { data: history } = await supabase
      .from('quote_status_history')
      .select('*')
      .eq('quotation_id', quoteId)
      .order('changed_at', { ascending: false });

    const currentStatus = quote?.status || 'draft';
    const canTransitionTo = STATUS_TRANSITIONS[currentStatus] || [];

    return NextResponse.json({
      current_status: currentStatus,
      status_history: history || [],
      can_transition_to: canTransitionTo,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch status' },
      { status: 500 }
    );
  }
}

// POST - Update status
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ quoteId: string }> }
) {
  try {
    const params = await context.params;
    const { quoteId } = params;

    const body = await request.json();
    const { status, notes } = body;

    if (!status) {
      return NextResponse.json(
        { error: 'Status is required' },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get current status
    const { data: quote } = await supabase
      .from('quotations')
      .select('status')
      .eq('id', quoteId)
      .single();

    if (!quote) {
      return NextResponse.json(
        { error: 'Quotation not found' },
        { status: 404 }
      );
    }

    const currentStatus = quote.status;
    const allowedTransitions = STATUS_TRANSITIONS[currentStatus] || [];

    // Validate transition
    if (!allowedTransitions.includes(status)) {
      return NextResponse.json(
        {
          error: `Cannot transition from ${currentStatus} to ${status}`,
          allowed: allowedTransitions,
        },
        { status: 400 }
      );
    }

    // Update status (trigger will log history)
    const { error: updateError } = await supabase
      .from('quotations')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', quoteId);

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to update status' },
        { status: 500 }
      );
    }

    // Add notes if provided
    if (notes) {
      await supabase
        .from('quote_status_history')
        .update({ notes })
        .eq('quotation_id', quoteId)
        .eq('to_status', status)
        .order('changed_at', { ascending: false })
        .limit(1);
    }

    return NextResponse.json({
      success: true,
      status,
      previous_status: currentStatus,
    });
  } catch (error) {
    console.error('Status update error:', error);
    return NextResponse.json(
      { error: 'Failed to update status' },
      { status: 500 }
    );
  }
}
