/**
 * MODULE-1C: Quote Approval Workflow
 * API Route: POST /api/quotes/[quoteId]/submit
 *
 * Submit a draft quote for approval (draft → pending)
 */

import { NextRequest, NextResponse } from 'next/server';
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
    // Await params (Next.js 15+)
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

    // Parse request body
    const body = await request.json();
    const { notes } = body;

    // Fetch quote to validate ownership and status
    const { data: quote, error: fetchError } = await supabase
      .from('quotes')
      .select('*')
      .eq('id', quoteId)
      .single();

    if (fetchError || !quote) {
      return NextResponse.json({ error: 'Quote not found' }, { status: 404 });
    }

    // Check if user owns the quote
    if (quote.created_by !== user.id) {
      return NextResponse.json(
        { error: 'You can only submit your own quotes' },
        { status: 403 }
      );
    }

    // Check if quote is in draft status
    if (quote.status !== 'draft') {
      return NextResponse.json(
        { error: `Cannot submit quote with status: ${quote.status}` },
        { status: 400 }
      );
    }

    // Update quote status to pending
    const { data: updatedQuote, error: updateError } = await supabase
      .from('quotes')
      .update({
        status: 'pending',
        submitted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', quoteId)
      .select()
      .single();

    if (updateError) {
      console.error('Error submitting quote:', updateError);
      return NextResponse.json(
        { error: 'Failed to submit quote' },
        { status: 500 }
      );
    }

    // Send notifications to managers/admins (async, don't block response)
    (async () => {
      try {
        // Find managers and admins to notify
        const { data: approvers } = await supabase
          .from('user_roles')
          .select('user_id, role')
          .in('role', ['Admin', 'Manager']);

        if (approvers && approvers.length > 0) {
          // Get submitter name
          const { data: submitterProfile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', user.id)
            .single();

          const actorName = submitterProfile?.full_name || user.email?.split('@')[0] || 'A team member';

          for (const approver of approvers) {
            // Get approver email
            const { data: approverProfile } = await supabase
              .from('profiles')
              .select('email, full_name')
              .eq('id', approver.user_id)
              .single();

            if (approverProfile?.email) {
              await sendQuoteNotification({
                type: 'quote_submitted',
                quoteId: updatedQuote.id,
                quoteNumber: updatedQuote.quote_number,
                title: updatedQuote.title,
                total: updatedQuote.total,
                currency: updatedQuote.currency,
                recipientEmail: approverProfile.email,
                recipientName: approverProfile.full_name || 'Approver',
                actorName,
                notes,
              });
            }
          }
        }
      } catch (notifyError) {
        console.error('[Submit Quote] Notification error:', notifyError);
      }
    })();

    return NextResponse.json({
      success: true,
      quote: updatedQuote,
      message: 'Quote submitted for approval',
    });
  } catch (error: any) {
    console.error('Submit quote error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
