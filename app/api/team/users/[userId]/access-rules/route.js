/**
 * Team Management API - User Access Rules
 * GET  /api/team/users/[userId]/access-rules - List access rules
 * POST /api/team/users/[userId]/access-rules - Create access rule
 *
 * POST Body:
 * - category_id?: string
 * - region?: string
 * - notes?: string
 */

import { NextResponse } from 'next/server';
import { withApiAuth } from '../../../../../../lib/middleware/api-auth';
import { supabaseAdmin } from '../../../../../../lib/supabase-service';

async function getHandler(req, context) {
  try {
    const params = await context.params;
    const { userId } = params;

    // Fetch all access rules for this user
    const { data, error } = await supabaseAdmin
      .from('supplier_access_rules')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching access rules:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data || [],
      count: data?.length || 0,
    });
  } catch (error) {
    console.error('Get access rules error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch access rules' },
      { status: 500 }
    );
  }
}

async function postHandler(req, context) {
  try {
    const params = await context.params;
    const { userId } = params;
    const body = await req.json();
    const { rule_data, category_id, region, notes } = body;

    // Validation: At least one filter must be provided
    if (!rule_data && !category_id && !region) {
      return NextResponse.json(
        { error: 'At least one filter (rule_data, category_id, or region) must be provided' },
        { status: 400 }
      );
    }

    // Check if user exists
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId);

    if (userError || !userData.user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Create access rule
    const { data, error } = await supabaseAdmin
      .from('supplier_access_rules')
      .insert({
        user_id: userId,
        rule_data: rule_data || null,
        category_id: category_id || null,
        region: region || null,
        created_by: req.user.id,
        notes: notes || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating access rule:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Access rule created',
        data,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create access rule error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create access rule' },
      { status: 500 }
    );
  }
}

// Export with Admin role requirement
export async function GET(req, context) {
  return withApiAuth((r) => getHandler(r, context), { requiredRole: 'Admin' })(req);
}

export async function POST(req, context) {
  return withApiAuth((r) => postHandler(r, context), { requiredRole: 'Admin' })(req);
}
