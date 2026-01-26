/**
 * Team Management API - Delete Access Rule
 * DELETE /api/team/access-rules/[ruleId]
 */

import { NextResponse } from 'next/server';
import { withApiAuth } from '../../../../../lib/middleware/api-auth';
import { supabaseAdmin } from '../../../../../lib/supabase-service';

async function handler(req, context) {
  try {
    const params = await context.params;
    const { ruleId } = params;

    // Check if rule exists
    const { data: existingRule, error: fetchError } = await supabaseAdmin
      .from('supplier_access_rules')
      .select('*')
      .eq('id', ruleId)
      .single();

    if (fetchError || !existingRule) {
      return NextResponse.json(
        { error: 'Access rule not found' },
        { status: 404 }
      );
    }

    // Delete the rule
    const { error } = await supabaseAdmin
      .from('supplier_access_rules')
      .delete()
      .eq('id', ruleId);

    if (error) {
      console.error('Error deleting access rule:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Access rule deleted',
    });
  } catch (error) {
    console.error('Delete access rule error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete access rule' },
      { status: 500 }
    );
  }
}

// Export with Admin role requirement
export async function DELETE(req, context) {
  return withApiAuth((r) => handler(r, context), { requiredRole: 'Admin' })(req);
}
