// app/api/suppliers/access-rules/route.ts
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
 * GET /api/suppliers/access-rules
 * List access rules (all for admin, own for non-admin)
 */
export async function GET(request: Request) {
  try {
    const auth = await requireUser();
    if (!auth?.ok || !auth.user || !auth.supabase) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }

    const { user, supabase } = auth;
    const isAdmin = await isUserAdmin(user.id, supabase);

    // Build query based on admin status
    let query = supabase
      .from('supplier_access_rules')
      .select('*, created_by_user:created_by(id, email), assigned_user:user_id(id, email)')
      .order('created_at', { ascending: false });

    // Non-admins can only see their own rules
    if (!isAdmin) {
      query = query.eq('user_id', user.id);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching access rules:', error);
      return NextResponse.json(
        { error: 'Failed to fetch access rules', message: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data || [],
      isAdmin,
    });
  } catch (err) {
    console.error('GET /api/suppliers/access-rules error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch access rules' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/suppliers/access-rules
 * Create a new access rule (admin only)
 */
export async function POST(request: Request) {
  try {
    const auth = await requireUser();
    if (!auth?.ok || !auth.user || !auth.supabase) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }

    const { user, supabase } = auth;

    // Check if user is admin
    const isAdmin = await isUserAdmin(user.id, supabase);
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'forbidden', message: 'Only admins can create access rules' },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => ({}));

    // Validate required fields
    const targetUserId = typeof body.user_id === 'string' ? body.user_id.trim() : '';
    if (!targetUserId) {
      return NextResponse.json(
        { error: 'user_id is required' },
        { status: 400 }
      );
    }

    // Validate that at least one filter is provided
    const hasRuleData = body.rule_data && (
      (Array.isArray(body.rule_data.categories) && body.rule_data.categories.length > 0) ||
      (Array.isArray(body.rule_data.regions) && body.rule_data.regions.length > 0)
    );
    const hasCategoryId = typeof body.category_id === 'string' && body.category_id.trim();
    const hasRegion = typeof body.region === 'string' && body.region.trim();

    if (!hasRuleData && !hasCategoryId && !hasRegion) {
      return NextResponse.json(
        { error: 'At least one filter must be specified (rule_data, category_id, or region)' },
        { status: 400 }
      );
    }

    // Verify target user exists
    const { data: targetUser, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('id', targetUserId)
      .maybeSingle();

    if (userError || !targetUser) {
      return NextResponse.json(
        { error: 'Target user not found' },
        { status: 404 }
      );
    }

    // Build insert data
    const insertData: any = {
      user_id: targetUserId,
      created_by: user.id,
    };

    // Add rule_data if provided (new format)
    if (hasRuleData) {
      insertData.rule_data = {
        categories: Array.isArray(body.rule_data.categories) ? body.rule_data.categories : [],
        regions: Array.isArray(body.rule_data.regions) ? body.rule_data.regions : [],
      };
    }

    // Add legacy fields if provided
    if (hasCategoryId) {
      insertData.category_id = body.category_id.trim();
    }
    if (hasRegion) {
      insertData.region = body.region.trim();
    }

    // Add notes if provided
    if (typeof body.notes === 'string' && body.notes.trim()) {
      insertData.notes = body.notes.trim();
    }

    // Insert the rule
    const { data: rule, error: insertError } = await supabase
      .from('supplier_access_rules')
      .insert(insertData)
      .select('*')
      .single();

    if (insertError) {
      console.error('Error creating access rule:', insertError);
      return NextResponse.json(
        { error: 'Failed to create access rule', message: insertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: rule,
    }, { status: 201 });
  } catch (err) {
    console.error('POST /api/suppliers/access-rules error:', err);
    return NextResponse.json(
      { error: 'Failed to create access rule' },
      { status: 500 }
    );
  }
}
