/**
 * MODULE-1C: Quote Approval Workflow
 * API Route: POST /api/quotes/[quoteId]/reject
 *
 * Reject a pending quote (pending → rejected)
 * Requires: Manager or Admin role
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

interface RouteContext {
  params: Promise<{ quoteId: string }>;
}

export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { quoteId } = await context.params;

    // Create Supabase client
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: (cookiesToSet) => {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check user role (must be Manager or Admin)
    const { data: userRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (!userRole || !['Admin', 'Manager'].includes(userRole.role)) {
      return NextResponse.json(
        { error: 'Only Managers and Admins can reject quotes' },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { reason } = body;

    if (!reason || !reason.trim()) {
      return NextResponse.json(
        { error: 'Rejection reason is required' },
        { status: 400 }
      );
    }

    // Fetch quote to validate status
    const { data: quote, error: fetchError } = await supabase
      .from('quotes')
      .select('*')
      .eq('id', quoteId)
      .single();

    if (fetchError || !quote) {
      return NextResponse.json({ error: 'Quote not found' }, { status: 404 });
    }

    // Check if quote is in pending status
    if (quote.status !== 'pending') {
      return NextResponse.json(
        { error: `Cannot reject quote with status: ${quote.status}` },
        { status: 400 }
      );
    }

    // Update quote status to rejected
    const { data: updatedQuote, error: updateError } = await supabase
      .from('quotes')
      .update({
        status: 'rejected',
        rejected_by: user.id,
        rejected_at: new Date().toISOString(),
        rejection_reason: reason.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', quoteId)
      .select()
      .single();

    if (updateError) {
      console.error('Error rejecting quote:', updateError);
      return NextResponse.json(
        { error: 'Failed to reject quote' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      quote: updatedQuote,
      message: 'Quote rejected successfully',
    });
  } catch (error: any) {
    console.error('Reject quote error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
