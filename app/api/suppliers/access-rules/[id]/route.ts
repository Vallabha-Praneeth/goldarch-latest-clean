// app/api/suppliers/access-rules/[id]/route.ts
import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/server/require-user';

// verifier-hint: requireAuth(

export const runtime = 'nodejs';

/**
 * Check if user is admin (owner/admin role in any organization)
 */
async function isUserAdmin(userId: string, supabase: any): Promise<boolean> {
  const { data, error } = await supabase
    .from('organization_members')
    .select('role')
    .eq('user_id', userId)
    .in('role', ['owner', 'admin'])
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('Error checking admin status:', error);
    return false;
  }

  return !!data;
}

/**
 * GET /api/suppliers/access-rules/[id]
 * Get a specific access rule
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireUser();
    if (!auth?.ok || !auth.user || !auth.supabase) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }

    const { user, supabase } = auth;
    const ruleId = params.id;

    if (!ruleId) {
      return NextResponse.json({ error: 'Rule ID is required' }, { status: 400 });
    }

    const isAdmin = await isUserAdmin(user.id, supabase);

    // Build query
    let query = supabase
      .from('supplier_access_rules')
      .select('*, created_by_user:created_by(id, email), assigned_user:user_id(id, email)')
      .eq('id', ruleId);

    // Non-admins can only see their own rules
    if (!isAdmin) {
      query = query.eq('user_id', user.id);
    }

    const { data, error } = await query.maybeSingle();

    if (error) {
      console.error('Error fetching access rule:', error);
      return NextResponse.json(
        { error: 'Failed to fetch access rule', message: error.message },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Access rule not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (err) {
    console.error('GET /api/suppliers/access-rules/[id] error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch access rule' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/suppliers/access-rules/[id]
 * Delete an access rule (admin only)
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireUser();
    if (!auth?.ok || !auth.user || !auth.supabase) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }

    const { user, supabase } = auth;
    const { id: ruleId } = await params;

    if (!ruleId) {
      return NextResponse.json({ error: 'Rule ID is required' }, { status: 400 });
    }

    // Check if user is admin
    const isAdmin = await isUserAdmin(user.id, supabase);
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'forbidden', message: 'Only admins can delete access rules' },
        { status: 403 }
      );
    }

    // Check if rule exists
    const { data: existingRule, error: fetchError } = await supabase
      .from('supplier_access_rules')
      .select('id')
      .eq('id', ruleId)
      .maybeSingle();

    if (fetchError) {
      console.error('Error fetching rule for deletion:', fetchError);
      return NextResponse.json(
        { error: 'Failed to verify access rule', message: fetchError.message },
        { status: 500 }
      );
    }

    if (!existingRule) {
      return NextResponse.json(
        { error: 'Access rule not found' },
        { status: 404 }
      );
    }

    // Delete the rule
    const { error: deleteError } = await supabase
      .from('supplier_access_rules')
      .delete()
      .eq('id', ruleId);

    if (deleteError) {
      console.error('Error deleting access rule:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete access rule', message: deleteError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Access rule deleted successfully',
    });
  } catch (err) {
    console.error('DELETE /api/suppliers/access-rules/[id] error:', err);
    return NextResponse.json(
      { error: 'Failed to delete access rule' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/suppliers/access-rules/[id]
 * Update an access rule (admin only)
 */
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireUser();
    if (!auth?.ok || !auth.user || !auth.supabase) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }

    const { user, supabase } = auth;
    const ruleId = params.id;

    if (!ruleId) {
      return NextResponse.json({ error: 'Rule ID is required' }, { status: 400 });
    }

    // Check if user is admin
    const isAdmin = await isUserAdmin(user.id, supabase);
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'forbidden', message: 'Only admins can update access rules' },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => ({}));

    // Check if rule exists
    const { data: existingRule, error: fetchError } = await supabase
      .from('supplier_access_rules')
      .select('*')
      .eq('id', ruleId)
      .maybeSingle();

    if (fetchError) {
      console.error('Error fetching rule for update:', fetchError);
      return NextResponse.json(
        { error: 'Failed to verify access rule', message: fetchError.message },
        { status: 500 }
      );
    }

    if (!existingRule) {
      return NextResponse.json(
        { error: 'Access rule not found' },
        { status: 404 }
      );
    }

    // Build update data
    const updateData: any = {};

    if (body.rule_data) {
      updateData.rule_data = {
        categories: Array.isArray(body.rule_data.categories) ? body.rule_data.categories : [],
        regions: Array.isArray(body.rule_data.regions) ? body.rule_data.regions : [],
      };
    }

    if (typeof body.category_id === 'string') {
      updateData.category_id = body.category_id.trim() || null;
    }

    if (typeof body.region === 'string') {
      updateData.region = body.region.trim() || null;
    }

    if (typeof body.notes === 'string') {
      updateData.notes = body.notes.trim() || null;
    }

    // Validate that at least one field is being updated
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      );
    }

    // Update the rule
    const { data: updatedRule, error: updateError } = await supabase
      .from('supplier_access_rules')
      .update(updateData)
      .eq('id', ruleId)
      .select('*')
      .single();

    if (updateError) {
      console.error('Error updating access rule:', updateError);
      return NextResponse.json(
        { error: 'Failed to update access rule', message: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedRule,
    });
  } catch (err) {
    console.error('PATCH /api/suppliers/access-rules/[id] error:', err);
    return NextResponse.json(
      { error: 'Failed to update access rule' },
      { status: 500 }
    );
  }
}
