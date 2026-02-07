/**
 * PRODUCTION API: Contract Checkpoints
 * Module A - READY FOR INTEGRATION
 *
 * Endpoints:
 * GET /api/contracts/[id]/checkpoints - List checkpoints
 * POST /api/contracts/[id]/checkpoints - Create checkpoint
 */

import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { checkpointSchema } from '@/lib/validation/contracts';

/**
 * GET /api/contracts/[id]/checkpoints
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
      .from('sandbox_approval_checkpoints')
      .select(`
        *,
        approver:profiles!approved_by(id, full_name, email)
      `)
      .eq('contract_id', params.id)
      .order('checkpoint_order', { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/contracts/[id]/checkpoints
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Validate input
    const body = await request.json();
    const validation = checkpointSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.errors },
        { status: 400 }
      );
    }

    // Insert checkpoint
    const { data, error } = await supabase
      .from('sandbox_approval_checkpoints')
      .insert({
        contract_id: params.id,
        ...validation.data,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Log audit trail
    await supabase.from('sandbox_audit_trail').insert({
      entity_type: 'checkpoint',
      entity_id: data.id,
      action: 'created',
      actor_id: user.id,
      new_values: data,
    });

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
