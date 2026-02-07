/**
 * MODULE-1C: Quote Approval Workflow
 * API Route: POST /api/quotes/[quoteId]/accept
 *
 * Accept an approved quote (approved → accepted)
 * Requires: Quote owner (Procurement)
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

    // Parse request body (notes optional)
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
        { error: 'You can only accept your own quotes' },
        { status: 403 }
      );
    }

    // Check if quote is in approved status
    if (quote.status !== 'approved') {
      return NextResponse.json(
        { error: `Cannot accept quote with status: ${quote.status}` },
        { status: 400 }
      );
    }

    // Update quote status to accepted
    const { data: updatedQuote, error: updateError } = await supabase
      .from('quotes')
      .update({
        status: 'accepted',
        updated_at: new Date().toISOString(),
      })
      .eq('id', quoteId)
      .select()
      .single();

    if (updateError) {
      console.error('Error accepting quote:', updateError);
      return NextResponse.json(
        { error: 'Failed to accept quote' },
        { status: 500 }
      );
    }

    // Send notifications to team (async, don't block response)
    after(async () => {
      try {
        // Get acceptor name
        const { data: acceptorProfile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', user.id)
          .single();

        const actorName = acceptorProfile?.full_name || user.email?.split('@')[0] || 'The owner';

        // Notify the approver (if different from owner)
        if (quote.approved_by && quote.approved_by !== user.id) {
          const { data: approverProfile } = await supabase
            .from('profiles')
            .select('email, full_name')
            .eq('id', quote.approved_by)
            .single();

          if (approverProfile?.email) {
            await sendQuoteNotification({
              type: 'quote_accepted',
              quoteId: updatedQuote.id,
              quoteNumber: updatedQuote.quote_number,
              title: updatedQuote.title,
              total: updatedQuote.total,
              currency: updatedQuote.currency,
              recipientEmail: approverProfile.email,
              recipientName: approverProfile.full_name || 'Team Member',
              actorName,
            });
          }
        }
      } catch (notifyError) {
        console.error('[Accept Quote] Notification error:', notifyError);
      }
    });

    return NextResponse.json({
      success: true,
      quote: updatedQuote,
      message: 'Quote accepted successfully',
    });
  } catch (error: any) {
    console.error('Accept quote error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
