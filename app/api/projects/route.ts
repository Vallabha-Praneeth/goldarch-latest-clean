/**
 * /api/projects
 * GET - List all projects (AUTHENTICATED)
 * POST - Create new project (AUTHENTICATED)
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, createAuthenticatedSupabaseClient } from '@/lib/auth-helpers';

/**
 * GET /api/projects
 * List all projects for authenticated user's organization
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (auth.response) {
      return auth.response;
    }

    const { supabase } = auth;
    const { searchParams } = new URL(request.url);

    // Build query
    let query = supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });

    // Optional filters
    const status = searchParams.get('status');
    if (status) {
      query = query.eq('status', status);
    }

    const search = searchParams.get('search');
    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }

    // Execute query (RLS enforced)
    const { data: projects, error } = await query;

    if (error) {
      console.error('Error fetching projects:', error);
      return NextResponse.json(
        { error: 'Failed to fetch projects', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: projects || [],
      count: projects?.length || 0,
    });
  } catch (error) {
    console.error('GET projects error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/projects
 * Create a new project
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (auth.response) {
      return auth.response;
    }
    const { user, supabase } = auth;

    const body = await request.json();

    const {
      name,
      description,
      client_name,
      client_email,
      client_phone,
      location,
      budget,
      start_date,
      end_date,
      status = 'planning',
      priority = 'medium',
      tags,
      notes,
    } = body;

    // Validate required fields
    if (!name) {
      return NextResponse.json(
        { error: 'Project name is required' },
        { status: 400 }
      );
    }

    // Create project (RLS enforced)
    const { data: project, error } = await supabase
      .from('projects')
      .insert({
        name,
        description,
        client_name,
        client_email,
        client_phone,
        location,
        budget,
        start_date,
        end_date,
        status,
        priority,
        tags,
        notes,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating project:', error);
      return NextResponse.json(
        { error: 'Failed to create project', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: project,
    }, { status: 201 });
  } catch (error) {
    console.error('POST project error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
