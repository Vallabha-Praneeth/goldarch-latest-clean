/**
 * Team Management API - Delete User
 * DELETE /api/team/users/[userId]
 */

import { NextResponse } from 'next/server';
import { withApiAuth } from '../../../../../lib/middleware/api-auth';
import { supabaseAdmin } from '../../../../../lib/supabase-service';

async function handler(req, context) {
  try {
    const params = await context.params;
    const { userId } = params;

    console.log('[Delete User] Attempting to delete userId:', userId);

    // Prevent user from deleting themselves
    if (userId === req.user.id) {
      return NextResponse.json(
        { error: 'You cannot delete your own account' },
        { status: 403 }
      );
    }

    // Delete user role records first
    const { error: roleDeleteError } = await supabaseAdmin
      .from('user_roles')
      .delete()
      .eq('user_id', userId);

    if (roleDeleteError) {
      console.error('Error deleting user role:', roleDeleteError);
    }

    // Delete user access rules
    const { error: accessRulesError } = await supabaseAdmin
      .from('supplier_access_rules')
      .delete()
      .eq('user_id', userId);

    if (accessRulesError) {
      console.error('Error deleting access rules:', accessRulesError);
    }

    // Delete user from auth.users using admin API
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (deleteError) {
      console.error('Error deleting user:', deleteError);
      return NextResponse.json(
        { error: deleteError.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'User deleted successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete user' },
      { status: 500 }
    );
  }
}

// Export with Admin role requirement
export async function DELETE(req, context) {
  return withApiAuth((r) => handler(r, context), { requiredRole: 'Admin' })(req);
}
