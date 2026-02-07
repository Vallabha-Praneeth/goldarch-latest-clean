/**
 * PRODUCTION API: Contracts
 * Module A - READY FOR INTEGRATION
 *
 * Endpoints:
 * GET /api/contracts - List all contracts
 * POST /api/contracts - Create new contract
 */

import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Validation schema
const createContractSchema = z.object({
  quote_id: z.string().uuid().optional(),
  project_id: z.string().uuid().optional(),
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  total_value: z.number().positive().optional(),
  currency: z.enum(['USD', 'EUR', 'GBP', 'CAD', 'AUD']).default('USD'),
  terms_and_conditions: z.string().optional(),
  effective_date: z.string().optional(),
  expiration_date: z.string().optional(),
});

/**
 * GET /api/contracts
 * List all contracts (filtered by RLS)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const project_id = searchParams.get('project_id');

    // Build query
    let query = supabase
      .from('sandbox_contracts')
      .select(`
        *,
        checkpoints:sandbox_approval_checkpoints(
          id,
          checkpoint_name,
          checkpoint_order,
          status,
          required_role,
          approved_by,
          approved_at
        ),
        esign_requests:sandbox_esign_requests(
          id,
          signer_email,
          status,
          signed_at
        )
      `)
      .order('created_at', { ascending: false });

    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }
    if (project_id) {
      query = query.eq('project_id', project_id);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Contracts fetch error:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/contracts
 * Create new contract
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = createContractSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.errors },
        { status: 400 }
      );
    }

    // Generate contract number (CTR-YYYYMMDD-XXX)
    const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const contract_number = `CTR-${date}-${random}`;

    // Insert contract
    const { data, error } = await supabase
      .from('sandbox_contracts')
      .insert({
        ...validation.data,
        contract_number,
        created_by: user.id,
        status: 'draft',
      })
      .select(`
        *,
        checkpoints:sandbox_approval_checkpoints(*),
        esign_requests:sandbox_esign_requests(*)
      `)
      .single();

    if (error) {
      console.error('Contract creation error:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    // Log audit trail
    await supabase.from('sandbox_audit_trail').insert({
      entity_type: 'contract',
      entity_id: data.id,
      action: 'created',
      actor_id: user.id,
      new_values: data,
    });

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
