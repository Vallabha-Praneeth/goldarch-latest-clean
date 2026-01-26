/**
 * Team Management API - Update User Role
 * PATCH /api/team/users/[userId]/role
 *
 * Body:
 * - role: UserRole ('Admin' | 'Manager' | 'Viewer' | 'Procurement')
 * - notes?: string
 */

import { NextResponse } from 'next/server';
import { withApiAuth } from '../../../../../../lib/middleware/api-auth';
import { supabaseAdmin } from '../../../../../../lib/supabase-service';

async function handler(req, context) {
  try {
    const params = await context.params;
    const { userId } = params;
    const body = await req.json();
    const { role, notes } = body;

    // Validation
    if (!role) {
      return NextResponse.json(
        { error: 'Role is required' },
        { status: 400 }
      );
    }

    // Validate role
    const validRoles = ['Admin', 'Manager', 'Viewer', 'Procurement'];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be one of: Admin, Manager, Viewer, Procurement' },
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

    // Check if user is trying to change their own role
    if (userId === req.user.id) {
      return NextResponse.json(
        { error: 'You cannot change your own role' },
        { status: 403 }
      );
    }

    // Check current role
    const { data: currentRole } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .single();

    // Update or insert role
    const { error: roleError } = await supabaseAdmin
      .from('user_roles')
      .upsert({
        user_id: userId,
        role,
        assigned_by: req.user.id,
        assigned_at: new Date().toISOString(),
        notes: notes || `Role changed from ${currentRole?.role || 'none'} to ${role}`,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id'
      });

    if (roleError) {
      console.error('Error updating role:', roleError);
      return NextResponse.json(
        { error: roleError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Role updated to ${role}`,
      user: {
        id: userId,
        email: userData.user.email,
        role,
      },
    });
  } catch (error) {
    console.error('Update role error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update role' },
      { status: 500 }
    );
  }
}

// Export with Admin role requirement
export async function PATCH(req, context) {
  return withApiAuth((r) => handler(r, context), { requiredRole: 'Admin' })(req);
}
