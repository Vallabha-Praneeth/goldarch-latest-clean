/**
 * Generate Public Quote Link - API Route
 * Path: app/api/quote/[quoteId]/share/route.ts
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ quoteId: string }> }
) {
  try {
    const params = await context.params;
    const { quoteId } = params;

    const body = await request.json().catch(() => ({}));
    const expiresInDays = body.expiresInDays || 30;

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Verify quotation exists
    const { data: quote, error: quoteError } = await supabase
      .from('quotations')
      .select('id, quote_number')
      .eq('id', quoteId)
      .single();

    if (quoteError || !quote) {
      return NextResponse.json(
        { error: 'Quotation not found' },
        { status: 404 }
      );
    }

    // Generate secure token
    const shareToken = crypto.randomBytes(32).toString('base64url');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    // Check if link already exists
    const { data: existing } = await supabase
      .from('public_quote_links')
      .select('*')
      .eq('quotation_id', quoteId)
      .gt('expires_at', new Date().toISOString())
      .single();

    let token = shareToken;

    if (existing) {
      // Return existing valid link
      token = existing.share_token;
    } else {
      // Create new link
      const { error: insertError } = await supabase
        .from('public_quote_links')
        .insert({
          quotation_id: quoteId,
          share_token: shareToken,
          expires_at: expiresAt.toISOString(),
        });

      if (insertError) {
        return NextResponse.json(
          { error: 'Failed to create share link' },
          { status: 500 }
        );
      }
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const shareUrl = `${baseUrl}/quote/${token}`;

    return NextResponse.json({
      success: true,
      shareUrl,
      token,
      expiresAt: existing ? existing.expires_at : expiresAt.toISOString(),
    });
  } catch (error) {
    console.error('Share link generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate share link' },
      { status: 500 }
    );
  }
}

// GET - Check if share link exists
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

    const { data: link } = await supabase
      .from('public_quote_links')
      .select('*')
      .eq('quotation_id', quoteId)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (link) {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
      return NextResponse.json({
        exists: true,
        shareUrl: `${baseUrl}/quote/${link.share_token}`,
        expiresAt: link.expires_at,
        viewCount: link.view_count,
      });
    }

    return NextResponse.json({ exists: false });
  } catch (error) {
    return NextResponse.json({ exists: false });
  }
}
