/**
 * Customer Response API
 * Path: app/api/quote/public/[token]/respond/route.ts
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ token: string }> }
) {
  try {
    const params = await context.params;
    const { token } = params;

    const body = await request.json();
    const { response_type, customer_name, customer_email, signature, notes } = body;

    if (!response_type || !customer_name) {
      return NextResponse.json(
        { error: 'response_type and customer_name are required' },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Verify link
    const { data: link } = await supabase
      .from('public_quote_links')
      .select('*')
      .eq('share_token', token)
      .single();

    if (!link || new Date(link.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'Invalid or expired link' },
        { status: 400 }
      );
    }

    // Check if already responded
    const { data: existing } = await supabase
      .from('quote_customer_responses')
      .select('id')
      .eq('quotation_id', link.quotation_id)
      .in('response_type', ['accept', 'reject'])
      .single();

    if (existing && ['accept', 'reject'].includes(response_type)) {
      return NextResponse.json(
        { error: 'Quote already responded to' },
        { status: 400 }
      );
    }

    // Get IP address
    const ipAddress = request.headers.get('x-forwarded-for') ||
                     request.headers.get('x-real-ip') ||
                     'unknown';

    // Insert response (trigger will update quote status)
    const { error: insertError } = await supabase
      .from('quote_customer_responses')
      .insert({
        quotation_id: link.quotation_id,
        response_type,
        customer_name,
        customer_email,
        signature,
        notes,
        ip_address: ipAddress,
      });

    if (insertError) {
      console.error('Insert error:', insertError);
      return NextResponse.json(
        { error: 'Failed to save response' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Quote ${response_type === 'accept' ? 'accepted' : response_type === 'reject' ? 'rejected' : 'revision requested'}`,
    });
  } catch (error) {
    console.error('Response error:', error);
    return NextResponse.json(
      { error: 'Failed to process response' },
      { status: 500 }
    );
  }
}
