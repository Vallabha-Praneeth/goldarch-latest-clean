/**
 * PRODUCTION API: E-sign Requests
 * Module A - READY FOR INTEGRATION
 *
 * Endpoints:
 * GET /api/contracts/[id]/esign - Get e-sign requests
 * POST /api/contracts/[id]/esign - Create e-sign request
 */

import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { esignRequestSchema } from '@/lib/validation/contracts';

/**
 * GET /api/contracts/[id]/esign
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
      .from('sandbox_esign_requests')
      .select('*')
      .eq('contract_id', params.id)
      .order('created_at', { ascending: false });

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
 * POST /api/contracts/[id]/esign
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
    const validation = esignRequestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.errors },
        { status: 400 }
      );
    }

    // Check contract exists
    const { data: contract, error: contractError } = await supabase
      .from('sandbox_contracts')
      .select('id, status')
      .eq('id', params.id)
      .single();

    if (contractError || !contract) {
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
    }

    // Contract must be approved before e-sign
    if (contract.status !== 'approved') {
      return NextResponse.json(
        { error: 'Contract must be approved before requesting signatures' },
        { status: 400 }
      );
    }

    // Create e-sign request
    const { data, error } = await supabase
      .from('sandbox_esign_requests')
      .insert({
        contract_id: params.id,
        signers: validation.data.signers,
        provider: validation.data.provider || 'docusign',
        message: validation.data.message,
        status: 'pending',
        requested_by: user.id,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Update contract status
    await supabase
      .from('sandbox_contracts')
      .update({ status: 'pending_signature' })
      .eq('id', params.id);

    // Log audit trail
    await supabase.from('sandbox_audit_trail').insert({
      entity_type: 'esign_request',
      entity_id: data.id,
      action: 'created',
      actor_id: user.id,
      new_values: data,
    });

    // TODO: Integration with actual e-sign provider (DocuSign, HelloSign, etc.)
    // This would send the actual signature requests via the provider's API

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
