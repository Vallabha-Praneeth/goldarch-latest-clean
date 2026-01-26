/**
 * View Public Quote - API Route
 * Path: app/api/quote/public/[token]/route.ts
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ token: string }> }
) {
  try {
    const params = await context.params;
    const { token } = params;

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Find link by token
    const { data: link, error: linkError } = await supabase
      .from('public_quote_links')
      .select('*')
      .eq('share_token', token)
      .single();

    if (linkError || !link) {
      return NextResponse.json(
        { error: 'Invalid or expired link' },
        { status: 404 }
      );
    }

    // Check expiration
    const now = new Date();
    const expiresAt = new Date(link.expires_at);
    if (now > expiresAt) {
      return NextResponse.json(
        { error: 'Link has expired' },
        { status: 410 }
      );
    }

    // Fetch quotation
    const { data: quotation, error: quoteError } = await supabase
      .from('quotations')
      .select('*')
      .eq('id', link.quotation_id)
      .single();

    if (quoteError || !quotation) {
      return NextResponse.json(
        { error: 'Quotation not found' },
        { status: 404 }
      );
    }

    // Fetch line items
    const { data: lineItems } = await supabase
      .from('quotation_lines')
      .select('*')
      .eq('quotation_id', link.quotation_id);

    // Fetch lead
    const { data: lead } = await supabase
      .from('quote_leads')
      .select('name, company')
      .eq('id', quotation.lead_id)
      .single();

    // Update view count
    await supabase
      .from('public_quote_links')
      .update({
        view_count: link.view_count + 1,
        last_viewed_at: new Date().toISOString(),
      })
      .eq('id', link.id);

    // Check if quote is expired
    const validUntil = new Date(quotation.valid_until);
    const isExpired = now > validUntil;

    // Build response
    const publicQuote = {
      quote_number: quotation.quote_number,
      created_at: quotation.created_at,
      valid_until: quotation.valid_until,
      status: quotation.status,
      lead: {
        name: lead?.name || 'Customer',
        company: lead?.company,
      },
      lineItems: (lineItems || []).map((item: any) => ({
        category: item.category || 'Items',
        description: item.description,
        quantity: item.quantity,
        unit: item.unit || 'units',
        unitPrice: item.unit_price,
        lineTotal: item.line_total,
      })),
      subtotal: quotation.subtotal,
      discount: quotation.discount_amount || 0,
      tax: quotation.tax_placeholder || 0,
      total: quotation.total,
      currency: quotation.currency || 'USD',
      isExpired,
      canRespond: !isExpired && quotation.status === 'sent',
    };

    return NextResponse.json(publicQuote);
  } catch (error) {
    console.error('Public quote view error:', error);
    return NextResponse.json(
      { error: 'Failed to load quote' },
      { status: 500 }
    );
  }
}
