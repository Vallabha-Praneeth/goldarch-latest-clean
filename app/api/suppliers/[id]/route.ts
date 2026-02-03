/**
 * /api/suppliers/[id]
 * GET - Get single supplier (AUTHENTICATED)
 * PUT - Update supplier (AUTHENTICATED)
 * DELETE - Delete supplier (AUTHENTICATED)
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, createAuthenticatedSupabaseClient } from '@/lib/auth-helpers';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/suppliers/[id]
 * Get single supplier by ID
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
    const supabase = await createAuthenticatedSupabaseClient();

    // Fetch supplier (RLS enforced)
    const { data: supplier, error } = await supabase
      .from('suppliers')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !supplier) {
      return NextResponse.json(
        { error: 'Supplier not found or access denied' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: supplier });
  } catch (error) {
    console.error('GET supplier error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/suppliers/[id]
 * Update supplier
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
    const supabase = await createAuthenticatedSupabaseClient();

    // Whitelist allowed update fields
    const allowedFields = [
      'name',
      'category_id',
      'region',
      'city',
      'address',
      'email',
      'phone',
      'website',
      'notes',
      'status',
      'rating',
      'contact_person',
      'tax_id',
      'payment_terms',
      'lead_time_days',
      'minimum_order',
      'discount_tier',
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

    // Update supplier (RLS enforced)
    const { data: supplier, error } = await supabase
      .from('suppliers')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating supplier:', error);
      return NextResponse.json(
        { error: 'Failed to update supplier', details: error.message },
        { status: 500 }
      );
    }

    if (!supplier) {
      return NextResponse.json(
        { error: 'Supplier not found or access denied' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: supplier });
  } catch (error) {
    console.error('PUT supplier error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/suppliers/[id]
 * Delete supplier (soft delete by setting status to 'inactive')
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
    const supabase = await createAuthenticatedSupabaseClient();

    // Soft delete: Set status to inactive
    const { data: supplier, error } = await supabase
      .from('suppliers')
      .update({ status: 'inactive', updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error deleting supplier:', error);
      return NextResponse.json(
        { error: 'Failed to delete supplier', details: error.message },
        { status: 500 }
      );
    }

    if (!supplier) {
      return NextResponse.json(
        { error: 'Supplier not found or access denied' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Supplier marked as inactive',
      data: supplier,
    });
  } catch (error) {
    console.error('DELETE supplier error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
