/**
 * MODULE-1C: Quote Approval Workflow
 * API Route: POST /api/quotes/[quoteId]/approve
 *
 * Approve a pending quote (pending → approved)
 * Requires: Manager or Admin role
 */

import { NextRequest, NextResponse, after } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { sendQuoteNotification } from '@/lib/notifications/quote-notifications';

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
        { error: 'Only Managers and Admins can approve quotes' },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { notes } = body;

    if (!notes || !notes.trim()) {
      return NextResponse.json(
        { error: 'Approval notes are required' },
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
        { error: `Cannot approve quote with status: ${quote.status}` },
        { status: 400 }
      );
    }

    // Update quote status to approved
    const { data: updatedQuote, error: updateError } = await supabase
      .from('quotes')
      .update({
        status: 'approved',
        approved_by: user.id,
        approved_at: new Date().toISOString(),
        approval_notes: notes.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', quoteId)
      .select()
      .single();

    if (updateError) {
      console.error('Error approving quote:', updateError);
      return NextResponse.json(
        { error: 'Failed to approve quote' },
        { status: 500 }
      );
    }

    // Send notification to quote owner (async, don't block response)
    after(async () => {
      try {
        // Get owner email
        const { data: ownerProfile } = await supabase
          .from('profiles')
          .select('email, full_name')
          .eq('id', quote.created_by)
          .single();

        // Get approver name
        const { data: approverProfile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', user.id)
          .single();

        const actorName = approverProfile?.full_name || user.email?.split('@')[0] || 'A manager';

        if (ownerProfile?.email) {
          await sendQuoteNotification({
            type: 'quote_approved',
            quoteId: updatedQuote.id,
            quoteNumber: updatedQuote.quote_number,
            title: updatedQuote.title,
            total: updatedQuote.total,
            currency: updatedQuote.currency,
            recipientEmail: ownerProfile.email,
            recipientName: ownerProfile.full_name || 'Team Member',
            actorName,
            notes: notes.trim(),
          });
        }
      } catch (notifyError) {
        console.error('[Approve Quote] Notification error:', notifyError);
      }
    });

    return NextResponse.json({
      success: true,
      quote: updatedQuote,
      message: 'Quote approved successfully',
    });
  } catch (error: any) {
    console.error('Approve quote error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
