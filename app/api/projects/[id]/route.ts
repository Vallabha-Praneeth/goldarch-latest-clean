/**
 * /api/projects/[id]
 * GET - Get single project (AUTHENTICATED)
 * PUT - Update project (AUTHENTICATED)
 * DELETE - Delete project (AUTHENTICATED)
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, createAuthenticatedSupabaseClient } from '@/lib/auth-helpers';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/projects/[id]
 * Get single project by ID
 */
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const auth = await requireAuth(request);
    if (auth.response) {
      return auth.response;
    }

    const { id } = await context.params;
    const { supabase } = auth;

    // Fetch project (RLS enforced)
    const { data: project, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !project) {
      return NextResponse.json(
        { error: 'Project not found or access denied' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: project });
  } catch (error) {
    console.error('GET project error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/projects/[id]
 * Update project
 */
export async function PUT(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const auth = await requireAuth(request);
    if (auth.response) {
      return auth.response;
    }

    const { id } = await context.params;
    const body = await request.json();
    const { supabase } = auth;

    // Whitelist allowed update fields
    const allowedFields = [
      'name',
      'description',
      'client_name',
      'client_email',
      'client_phone',
      'location',
      'budget',
      'start_date',
      'end_date',
      'status',
      'priority',
      'tags',
      'notes',
      'completion_percentage',
      'actual_cost',
    ];

    const updateData: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (field in body) {
        updateData[field] = body[field];
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      );
    }

    // Add updated_at timestamp
    updateData.updated_at = new Date().toISOString();

    // Update project (RLS enforced)
    const { data: project, error } = await supabase
      .from('projects')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating project:', error);
      return NextResponse.json(
        { error: 'Failed to update project', details: error.message },
        { status: 500 }
      );
    }

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found or access denied' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: project });
  } catch (error) {
    console.error('PUT project error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/projects/[id]
 * Delete project (soft delete by setting status to 'archived')
 */
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const auth = await requireAuth(request);
    if (auth.response) {
      return auth.response;
    }

    const { id } = await context.params;
    const { supabase } = auth;

    // Soft delete: Set status to archived
    const { data: project, error } = await supabase
      .from('projects')
      .update({
        status: 'archived',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error deleting project:', error);
      return NextResponse.json(
        { error: 'Failed to delete project', details: error.message },
        { status: 500 }
      );
    }

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found or access denied' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Project archived successfully',
      data: project,
    });
  } catch (error) {
    console.error('DELETE project error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
