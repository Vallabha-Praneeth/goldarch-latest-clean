/**
 * List Customer Responses API
 * Path: app/api/quote/[quoteId]/responses/route.ts
 * GET endpoint for admin to view all responses for a quote
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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

    const { data: responses, error } = await supabase
      .from('quote_customer_responses')
      .select('*')
      .eq('quotation_id', quoteId)
      .order('responded_at', { ascending: false });

    if (error) {
      console.error('Fetch error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch responses' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      responses: responses || [],
      count: responses?.length || 0,
    });
  } catch (error) {
    console.error('List responses error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch responses' },
      { status: 500 }
    );
  }
}
