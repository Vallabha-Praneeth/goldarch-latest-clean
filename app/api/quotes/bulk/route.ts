/**
 * MODULE-1C: Quote Approval Workflow
 * API Route: POST /api/quotes/bulk
 *
 * Bulk operations on quotes (approve/reject multiple)
 * Requires: Manager or Admin role
 */

import { NextRequest, NextResponse, after } from 'next/server';
import { sendQuoteNotification } from '@/lib/notifications/quote-notifications';
import { requireUser } from '@/lib/server/require-user';

type BulkAction = 'approve' | 'reject';

interface BulkRequest {
  action: BulkAction;
  quoteIds: string[];
  notes?: string;
  reason?: string;
}

interface BulkResult {
  quoteId: string;
  quoteNumber: string;
  success: boolean;
  error?: string;
}

export async function POST(request: NextRequest) {
  try {
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
        { error: 'Only Managers and Admins can perform bulk quote operations' },
        { status: 403 }
      );
    }

    // Parse request body
    const body: BulkRequest = await request.json();
    const { action, quoteIds, notes, reason } = body;

    // Validate request
    if (!action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be "approve" or "reject"' },
        { status: 400 }
      );
    }

    if (!quoteIds || !Array.isArray(quoteIds) || quoteIds.length === 0) {
      return NextResponse.json(
        { error: 'quoteIds must be a non-empty array' },
        { status: 400 }
      );
    }

    if (quoteIds.length > 50) {
      return NextResponse.json(
        { error: 'Maximum 50 quotes per bulk operation' },
        { status: 400 }
      );
    }

    if (action === 'approve' && (!notes || !notes.trim())) {
      return NextResponse.json(
        { error: 'Approval notes are required for bulk approval' },
        { status: 400 }
      );
    }

    if (action === 'reject' && (!reason || !reason.trim())) {
      return NextResponse.json(
        { error: 'Rejection reason is required for bulk rejection' },
        { status: 400 }
      );
    }

    // Get actor profile for notifications
    const { data: actorProfile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single();

    const actorName = actorProfile?.full_name || user.email?.split('@')[0] || 'A manager';

    // Process quotes
    const results: BulkResult[] = [];

    for (const quoteId of quoteIds) {
      try {
        // Fetch quote
        const { data: quote, error: fetchError } = await supabase
          .from('quotes')
          .select('*')
          .eq('id', quoteId)
          .single();

        if (fetchError || !quote) {
          results.push({
            quoteId,
            quoteNumber: 'N/A',
            success: false,
            error: 'Quote not found',
          });
          continue;
        }

        // Check if quote is in pending status
        if (quote.status !== 'pending') {
          results.push({
            quoteId,
            quoteNumber: quote.quote_number,
            success: false,
            error: `Cannot ${action} quote with status: ${quote.status}`,
          });
          continue;
        }

        // Perform the action
        const updateData =
          action === 'approve'
            ? {
                status: 'approved',
                approved_by: user.id,
                approved_at: new Date().toISOString(),
                approval_notes: notes?.trim(),
                updated_at: new Date().toISOString(),
              }
            : {
                status: 'rejected',
                rejected_by: user.id,
                rejected_at: new Date().toISOString(),
                rejection_reason: reason?.trim(),
                updated_at: new Date().toISOString(),
              };

        // Atomic update: only update if status is still 'pending' (prevents TOCTOU race)
        const { data: updatedQuote, error: updateError } = await supabase
          .from('quotes')
          .update(updateData)
          .eq('id', quoteId)
          .eq('status', 'pending')
          .select()
          .single();

        if (updateError || !updatedQuote) {
          results.push({
            quoteId,
            quoteNumber: quote.quote_number,
            success: false,
            error: updateError ? `Failed to ${action} quote` : 'Quote status changed by another user',
          });
          continue;
        }

        results.push({
          quoteId,
          quoteNumber: quote.quote_number,
          success: true,
        });

        // Send notification to quote owner (runs after response is sent)
        after(async () => {
          try {
            const { data: ownerProfile } = await supabase
              .from('profiles')
              .select('email, full_name')
              .eq('id', quote.created_by)
              .single();

            if (ownerProfile?.email) {
              await sendQuoteNotification({
                type: action === 'approve' ? 'quote_approved' : 'quote_rejected',
                quoteId: updatedQuote.id,
                quoteNumber: updatedQuote.quote_number,
                title: updatedQuote.title,
                total: updatedQuote.total,
                currency: updatedQuote.currency,
                recipientEmail: ownerProfile.email,
                recipientName: ownerProfile.full_name || 'Team Member',
                actorName,
                notes: action === 'approve' ? notes?.trim() : undefined,
                reason: action === 'reject' ? reason?.trim() : undefined,
              });
            }
          } catch (notifyError) {
            console.error(`[Bulk ${action}] Notification error for ${quoteId}:`, notifyError);
          }
        });
      } catch (error) {
        results.push({
          quoteId,
          quoteNumber: 'N/A',
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    const successCount = results.filter((r) => r.success).length;
    const failureCount = results.filter((r) => !r.success).length;

    return NextResponse.json({
      success: failureCount === 0,
      message: `Bulk ${action}: ${successCount} succeeded, ${failureCount} failed`,
      results,
      summary: {
        total: quoteIds.length,
        succeeded: successCount,
        failed: failureCount,
      },
    });
  } catch (error) {
    console.error('Bulk quote operation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
