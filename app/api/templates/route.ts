/**
 * /api/templates
 * GET - List all templates (AUTHENTICATED)
 * POST - Create new template (AUTHENTICATED)
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import { supabaseAdmin } from '@/lib/supabase-service';

/**
 * GET /api/templates
 * List all templates, optionally filtered by type
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (auth.response) return auth.response;

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    let query = supabaseAdmin
      .from('templates')
      .select('*')
      .order('created_at', { ascending: false });

    if (type) {
      query = query.eq('type', type);
    }

    const { data: templates, error } = await query;

    if (error) {
      console.error('Error fetching templates:', error);
      return NextResponse.json(
        { error: 'Failed to fetch templates', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: templates || [] });
  } catch (error) {
    console.error('GET templates error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/templates
 * Create a new template
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (auth.response) return auth.response;
    const { user } = auth;

    const body = await request.json();

    const {
      name,
      type,
      status = 'draft',
      content = {},
      subject,
      description,
      tokens = [],
      is_default = false,
    } = body;

    // Validate required fields
    if (!name || !type) {
      return NextResponse.json(
        { error: 'name and type are required' },
        { status: 400 }
      );
    }

    // Validate type
    const validTypes = ['quotation', 'invoice', 'email', 'contract', 'report'];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: `Invalid type. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      );
    }

    const { data: template, error } = await supabaseAdmin
      .from('templates')
      .insert({
        name,
        type,
        status,
        content,
        subject,
        description,
        tokens,
        is_default,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating template:', error);
      return NextResponse.json(
        { error: 'Failed to create template', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: template }, { status: 201 });
  } catch (error) {
    console.error('POST template error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
