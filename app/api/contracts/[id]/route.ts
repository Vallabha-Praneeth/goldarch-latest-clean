/**
 * PRODUCTION API: Single Contract
 * Module A - READY FOR INTEGRATION
 *
 * Endpoints:
 * GET /api/contracts/[id] - Get contract details
 * PATCH /api/contracts/[id] - Update contract
 * DELETE /api/contracts/[id] - Delete contract
 */

import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const updateContractSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  total_value: z.number().positive().optional(),
  status: z.enum(['draft', 'pending_approval', 'approved', 'signed', 'active', 'completed', 'cancelled']).optional(),
  terms_and_conditions: z.string().optional(),
  effective_date: z.string().optional(),
  expiration_date: z.string().optional(),
});

/**
 * GET /api/contracts/[id]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('sandbox_contracts')
      .select(`
        *,
        checkpoints:sandbox_approval_checkpoints(
          *,
          approver:profiles!approved_by(id, full_name, email)
        ),
        esign_requests:sandbox_esign_requests(*),
        creator:profiles!created_by(id, full_name, email)
      `)
      .eq('id', params.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PATCH /api/contracts/[id]
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get existing contract for audit
    const { data: existing } = await supabase
      .from('sandbox_contracts')
      .select('*')
      .eq('id', params.id)
      .single();

    if (!existing) {
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
    }

    // Validate request
    const body = await request.json();
    const validation = updateContractSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.errors },
        { status: 400 }
      );
    }

    // Update contract
    const { data, error } = await supabase
      .from('sandbox_contracts')
      .update(validation.data)
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Log audit trail
    await supabase.from('sandbox_audit_trail').insert({
      entity_type: 'contract',
      entity_id: params.id,
      action: 'updated',
      actor_id: user.id,
      old_values: existing,
      new_values: data,
    });

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/contracts/[id]
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || !['admin', 'owner'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { error } = await supabase
      .from('sandbox_contracts')
      .delete()
      .eq('id', params.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Log audit trail
    await supabase.from('sandbox_audit_trail').insert({
      entity_type: 'contract',
      entity_id: params.id,
      action: 'deleted',
      actor_id: user.id,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
