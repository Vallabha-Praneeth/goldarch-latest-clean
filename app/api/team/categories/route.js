/**
 * Team Management API - List Categories
 * GET /api/team/categories
 *
 * Returns unique supplier categories for use in access rule dropdowns
 */

import { NextResponse } from 'next/server';
import { withApiAuth } from '../../../../lib/middleware/api-auth';
import { supabaseAdmin } from '../../../../lib/supabase-service';

async function handler(req) {
  try {
    // Get unique categories from suppliers table
    const { data, error } = await supabaseAdmin
      .from('suppliers')
      .select('category')
      .not('category', 'is', null);

    if (error) {
      console.error('Error fetching categories:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    // Extract unique categories
    const uniqueCategories = [...new Set(data.map(item => item.category))].filter(Boolean);

    // Format as objects with id and name
    const categories = uniqueCategories.map(cat => ({
      id: cat.toLowerCase().replace(/\s+/g, '-'),
      name: cat,
    }));

    return NextResponse.json({
      success: true,
      data: categories,
      count: categories.length,
    });
  } catch (error) {
    console.error('Get categories error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}

// Export with Admin role requirement
export const GET = withApiAuth(handler, { requiredRole: 'Admin' });
