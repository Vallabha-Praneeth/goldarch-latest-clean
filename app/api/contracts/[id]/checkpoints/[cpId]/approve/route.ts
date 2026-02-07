/**
 * PRODUCTION API: Approve/Reject Checkpoint
 * Module A - READY FOR INTEGRATION
 *
 * Endpoints:
 * POST /api/contracts/[id]/checkpoints/[cpId]/approve - Approve or reject checkpoint
 */

import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { approveCheckpointSchema } from '@/lib/validation/contracts';

/**
 * POST /api/contracts/[id]/checkpoints/[cpId]/approve
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; cpId: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Validate input
    const body = await request.json();
    const validation = approveCheckpointSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { decision, notes, rejected_reason } = validation.data;

    // Get checkpoint
    const { data: checkpoint, error: fetchError } = await supabase
      .from('sandbox_approval_checkpoints')
      .select('*, contract:sandbox_contracts(*)')
      .eq('id', params.cpId)
      .single();

    if (fetchError || !checkpoint) {
      return NextResponse.json({ error: 'Checkpoint not found' }, { status: 404 });
    }

    // Check if user has permission (role check)
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (checkpoint.required_role && profile?.role !== checkpoint.required_role) {
      const allowedRoles = ['admin', 'owner'];
      if (!allowedRoles.includes(profile?.role || '')) {
        return NextResponse.json(
          { error: 'Insufficient permissions for this checkpoint' },
          { status: 403 }
        );
      }
    }

    // Update checkpoint
    const updateData: any = {
      approved: decision === 'approve',
      approved_by: user.id,
      approved_at: new Date().toISOString(),
      notes: notes,
    };

    if (decision === 'reject' && rejected_reason) {
      updateData.rejected_reason = rejected_reason;
    }

    const { data, error } = await supabase
      .from('sandbox_approval_checkpoints')
      .update(updateData)
      .eq('id', params.cpId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Update contract status if all checkpoints approved
    if (decision === 'approve') {
      const { data: allCheckpoints } = await supabase
        .from('sandbox_approval_checkpoints')
        .select('approved')
        .eq('contract_id', params.id);

      const allApproved = allCheckpoints?.every(cp => cp.approved === true);

      if (allApproved) {
        await supabase
          .from('sandbox_contracts')
          .update({ status: 'approved' })
          .eq('id', params.id);
      }
    } else {
      // If rejected, update contract status
      await supabase
        .from('sandbox_contracts')
        .update({ status: 'draft' })
        .eq('id', params.id);
    }

    // Log audit trail
    await supabase.from('sandbox_audit_trail').insert({
      entity_type: 'checkpoint',
      entity_id: params.cpId,
      action: decision === 'approve' ? 'approved' : 'rejected',
      actor_id: user.id,
      new_values: data,
    });

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
