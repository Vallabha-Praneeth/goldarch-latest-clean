/**
 * MODULE-1C: Quote Approval Workflow
 * API Route: POST /api/quotes/[quoteId]/reject
 *
 * Reject a pending quote (pending → rejected)
 * Requires: Manager or Admin role
 */

import { NextRequest, NextResponse, after } from 'next/server';
import { sendQuoteNotification } from '@/lib/notifications/quote-notifications';
import { requireUser } from '@/lib/server/require-user';

interface RouteContext {
  params: Promise<{ quoteId: string }>;
}

export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { quoteId } = await context.params;

    // Check authentication (supports both cookies and Bearer token)
    const auth = await requireUser();
    if (!auth?.ok || !auth.user || !auth.supabase) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { user, supabase } = auth;

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

    // Send notification to quote owner (runs after response is sent)
    after(async () => {
      try {
        // Get owner email
        const { data: ownerProfile } = await supabase
          .from('profiles')
          .select('email, full_name')
          .eq('id', quote.created_by)
          .single();

        // Get rejector name
        const { data: rejectorProfile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', user.id)
          .single();

        const actorName = rejectorProfile?.full_name || user.email?.split('@')[0] || 'A manager';

        if (ownerProfile?.email) {
          await sendQuoteNotification({
            type: 'quote_rejected',
            quoteId: updatedQuote.id,
            quoteNumber: updatedQuote.quote_number,
            title: updatedQuote.title,
            total: updatedQuote.total,
            currency: updatedQuote.currency,
            recipientEmail: ownerProfile.email,
            recipientName: ownerProfile.full_name || 'Team Member',
            actorName,
            reason: reason.trim(),
          });
        }
      } catch (notifyError) {
        console.error('[Reject Quote] Notification error:', notifyError);
      }
    });

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
