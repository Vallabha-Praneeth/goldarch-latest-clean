/**
 * Team Management API - List Users
 * GET /api/team/users
 *
 * Query params:
 * - search: string (filter by email)
 * - role: UserRole (filter by role)
 */

import { NextResponse } from 'next/server';
import { withApiAuth } from '../../../../lib/middleware/api-auth';
import { supabaseAdmin } from '../../../../lib/supabase-service';

async function handler(req) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search');
    const roleFilter = searchParams.get('role');

    // Query auth.users with user_roles joined
    // Note: This requires service role client as auth.users is protected
    let query = supabaseAdmin.auth.admin.listUsers();

    const { data: authData, error: authError } = await query;

    if (authError) {
      console.error('Error fetching users from auth:', authError);
      return NextResponse.json({ error: authError.message }, { status: 500 });
    }

    const userIds = authData.users.map(u => u.id);

    // Fetch user roles for all users
    const { data: userRoles, error: rolesError } = await supabaseAdmin
      .from('user_roles')
      .select('user_id, role, assigned_at, assigned_by, notes')
      .in('user_id', userIds);

    if (rolesError) {
      console.error('Error fetching user roles:', rolesError);
      return NextResponse.json({ error: rolesError.message }, { status: 500 });
    }

    // Create a map of user_id -> role data
    const rolesMap = new Map();
    (userRoles || []).forEach(role => {
      rolesMap.set(role.user_id, role);
    });

    // Combine auth users with their roles
    let users = authData.users.map(authUser => {
      const roleData = rolesMap.get(authUser.id);
      return {
        id: authUser.id,
        email: authUser.email,
        role: roleData?.role || null,
        role_assigned_at: roleData?.assigned_at || null,
        role_assigned_by: roleData?.assigned_by || null,
        created_at: authUser.created_at,
      };
    });

    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase();
      users = users.filter(user =>
        user.email?.toLowerCase().includes(searchLower)
      );
    }

    // Apply role filter
    if (roleFilter) {
      users = users.filter(user => user.role === roleFilter);
    }

    // Sort by created_at descending (newest first)
    users.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    return NextResponse.json({
      success: true,
      data: users,
      count: users.length,
    });
  } catch (error) {
    console.error('Team API error:', error);
    return NextResponse.json({
      error: error.message || 'Failed to fetch users',
      details: error.toString()
    }, { status: 500 });
  }
}

// Export with Admin role requirement
export const GET = withApiAuth(handler, { requiredRole: 'Admin' });
