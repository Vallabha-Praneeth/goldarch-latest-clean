/**
 * Quote Notification API Route
 * POST /api/notifications/quote
 *
 * Sends email notifications for quote workflow events.
 * Typically called internally by other API routes after quote status changes.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendQuoteNotification } from '@/lib/notifications/quote-notifications';
import { QuoteNotificationType } from '@/lib/notifications/types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: NextRequest) {
  try {
    // Verify authorization
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify the token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { type, quoteId, recipientUserId, notes, reason } = body;

    if (!type || !quoteId) {
      return NextResponse.json(
        { error: 'Missing required fields: type, quoteId' },
        { status: 400 }
      );
    }

    // Validate notification type
    const validTypes: QuoteNotificationType[] = [
      'quote_submitted',
      'quote_approved',
      'quote_rejected',
      'quote_accepted',
      'quote_declined',
    ];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: `Invalid notification type. Valid types: ${validTypes.join(', ')}` },
        { status: 400 }
      );
    }

    // Fetch quote details
    const { data: quote, error: quoteError } = await supabase
      .from('quotes')
      .select('id, quote_number, title, total, currency, created_by')
      .eq('id', quoteId)
      .single();

    if (quoteError || !quote) {
      return NextResponse.json({ error: 'Quote not found' }, { status: 404 });
    }

    // Determine recipient
    let recipientId = recipientUserId || quote.created_by;

    // Fetch recipient user info
    const { data: recipientProfile } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', recipientId)
      .single();

    // If no profile, try to get from auth.users
    let recipientEmail = recipientProfile?.email;
    let recipientName = recipientProfile?.full_name || 'Team Member';

    if (!recipientEmail) {
      const { data: { user: recipientUser } } = await supabase.auth.admin.getUserById(recipientId);
      recipientEmail = recipientUser?.email;
      recipientName = recipientUser?.user_metadata?.full_name || recipientName;
    }

    if (!recipientEmail) {
      return NextResponse.json(
        { error: 'Could not determine recipient email' },
        { status: 400 }
      );
    }

    // Get actor name (current user)
    const { data: actorProfile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single();

    const actorName = actorProfile?.full_name || user.email?.split('@')[0] || 'A team member';

    // Send notification
    const result = await sendQuoteNotification({
      type,
      quoteId: quote.id,
      quoteNumber: quote.quote_number,
      title: quote.title,
      total: quote.total,
      currency: quote.currency,
      recipientEmail,
      recipientName,
      actorName,
      notes,
      reason,
    });

    if (!result.success) {
      console.error('[Notifications API] Failed to send:', result.error);
      // Don't fail the request - notification failure shouldn't block workflow
      return NextResponse.json({
        success: false,
        message: 'Notification queued but delivery failed',
        error: result.error,
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Notification sent',
      emailId: result.emailId,
    });
  } catch (error) {
    console.error('[Notifications API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
