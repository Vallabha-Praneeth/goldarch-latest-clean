/**
 * Team Management API - Invite User
 * POST /api/team/invite
 *
 * Body:
 * - email: string
 * - role: UserRole ('Admin' | 'Manager' | 'Viewer' | 'Procurement')
 * - notes?: string
 */

import { NextResponse } from 'next/server';
import { withApiAuth } from '../../../../lib/middleware/api-auth';
import { supabaseAdmin } from '../../../../lib/supabase-service';

async function handler(req) {
  try {
    const body = await req.json();
    const { email, role, notes } = body;

    // Validation
    if (!email || !role) {
      return NextResponse.json(
        { error: 'Email and role are required' },
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

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const userExists = existingUsers.users.some(u => u.email === email);

    if (userExists) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }

    // Invite user using admin API
    const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      email,
      {
        data: {
          initial_role: role,
        },
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`,
      }
    );

    if (inviteError) {
      console.error('Error inviting user:', inviteError);
      return NextResponse.json(
        { error: inviteError.message },
        { status: 500 }
      );
    }

    // Create user role record
    const { error: roleError } = await supabaseAdmin
      .from('user_roles')
      .insert({
        user_id: inviteData.user.id,
        role,
        assigned_by: req.user.id,
        notes: notes || `Invited as ${role}`,
      });

    if (roleError) {
      console.error('Error creating role record:', roleError);
      // User is invited but role assignment failed
      // We don't rollback the invitation, just log it
      return NextResponse.json(
        {
          success: true,
          warning: 'User invited but role assignment failed. Please assign role manually.',
          user: {
            id: inviteData.user.id,
            email: inviteData.user.email,
          },
        },
        { status: 201 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: `Invitation sent to ${email}`,
        user: {
          id: inviteData.user.id,
          email: inviteData.user.email,
          role,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Invite user error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to invite user' },
      { status: 500 }
    );
  }
}

// Export with Admin role requirement
export const POST = withApiAuth(handler, { requiredRole: 'Admin' });
