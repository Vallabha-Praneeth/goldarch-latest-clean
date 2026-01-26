/**
 * Quote Versioning API
 * Path: app/api/quote/[quoteId]/versions/route.ts
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// GET - List all versions
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ quoteId: string }> }
) {
  try {
    const params = await context.params;
    const { quoteId } = params;

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: versions } = await supabase
      .from('quote_versions')
      .select('*')
      .eq('original_quotation_id', quoteId)
      .order('version', { ascending: false });

    return NextResponse.json({
      versions: versions || [],
      count: versions?.length || 0,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch versions' },
      { status: 500 }
    );
  }
}

// POST - Create new version
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ quoteId: string }> }
) {
  try {
    const params = await context.params;
    const { quoteId } = params;

    const body = await request.json();
    const { reason } = body;

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Call function to create version
    const { data, error } = await supabase.rpc('create_quote_version', {
      p_quotation_id: quoteId,
      p_reason: reason,
    });

    if (error) {
      return NextResponse.json(
        { error: 'Failed to create version' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      version: data,
    });
  } catch (error) {
    console.error('Version creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create version' },
      { status: 500 }
    );
  }
}
