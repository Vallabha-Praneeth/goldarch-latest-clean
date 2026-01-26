/**
 * Email Delivery Module - API Route
 * Phase 2 - Modular Implementation
 *
 * Installation Instructions:
 * 1. Copy this file to: app/api/quote/email/[quoteId]/route.ts
 * 2. Make sure email-service.ts is at: lib/email/email-service.ts
 * 3. Install dependencies: npm install resend
 * 4. Configure environment variables (see README)
 */

import { NextRequest, NextResponse } from 'next/server';
import { sendQuoteEmail, validateEmailData } from '@/lib/email/email-service';
import { generateQuotePDF } from '@/lib/pdf/pdf-generator';
import { QuoteEmailData } from '@/lib/email/types';
import { QuotePDFData } from '@/lib/pdf/types';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ quoteId: string }> }
) {
  try {
    const params = await context.params;
    const { quoteId } = params;

    // Get optional email override and custom message from request body
    const body = await request.json().catch(() => ({}));
    const emailOverride = body.email;
    const customMessage = body.customMessage;

    // Initialize Supabase with service role
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Fetch quotation with related data
    const { data: quotation, error } = await supabase
      .from('quotations')
      .select(`
        *,
        quotation_lines(*),
        quote_leads(*)
      `)
      .eq('id', quoteId)
      .single();

    if (error || !quotation) {
      return NextResponse.json(
        { error: 'Quotation not found' },
        { status: 404 }
      );
    }

    // Generate PDF for attachment
    const pdfData: QuotePDFData = {
      quoteNumber: quotation.quote_number,
      createdAt: quotation.created_at,
      validUntil: quotation.valid_until,
      lead: {
        name: quotation.quote_leads.name,
        email: quotation.quote_leads.email,
        phone: quotation.quote_leads.phone,
        company: quotation.quote_leads.company,
      },
      lineItems: quotation.quotation_lines.map((line: any) => ({
        description: line.description,
        quantity: line.quantity,
        unitPrice: line.unit_price,
        lineTotal: line.line_total,
      })),
      subtotal: quotation.subtotal,
      discount: quotation.discount_amount || 0,
      tax: quotation.tax_placeholder || 0,
      total: quotation.total,
      currency: quotation.currency || 'USD',
    };

    const pdfResult = await generateQuotePDF(pdfData, {
      includeTerms: true,
    });

    if (!pdfResult.success || !pdfResult.buffer) {
      return NextResponse.json(
        { error: 'Failed to generate PDF attachment' },
        { status: 500 }
      );
    }

    // Prepare email data
    const emailData: QuoteEmailData = {
      to: emailOverride || quotation.quote_leads.email,
      customerName: quotation.quote_leads.name,
      quoteNumber: quotation.quote_number,
      total: quotation.total,
      currency: quotation.currency || 'USD',
      validUntil: quotation.valid_until,
      pdfAttachment: pdfResult.buffer,
      customMessage,
    };

    // Validate email data
    const validation = validateEmailData(emailData);
    if (!validation.valid) {
      return NextResponse.json(
        { error: 'Invalid email data', details: validation.errors },
        { status: 400 }
      );
    }

    // Send email
    const emailResult = await sendQuoteEmail(emailData);

    if (!emailResult.success) {
      return NextResponse.json(
        { error: emailResult.error || 'Failed to send email' },
        { status: 500 }
      );
    }

    // Track email in database
    try {
      await supabase.from('quote_email_tracking').insert({
        quotation_id: quoteId,
        recipient_email: emailData.to,
        subject: `Your Quote ${quotation.quote_number}`,
        sent_at: new Date().toISOString(),
        provider: emailResult.provider || 'resend',
        provider_message_id: emailResult.emailId,
        status: 'sent',
      });
    } catch (trackingError) {
      // Log but don't fail the request if tracking fails
      console.error('Email tracking error:', trackingError);
    }

    return NextResponse.json({
      success: true,
      message: 'Quote email sent successfully',
      emailId: emailResult.emailId,
      sentTo: emailData.to,
    });
  } catch (error) {
    console.error('Email send error:', error);
    return NextResponse.json(
      {
        error: 'Failed to send quote email',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint to check email configuration
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ quoteId: string }> }
) {
  try {
    const params = await context.params;
    const { quoteId } = params;

    // Initialize Supabase
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get email history for this quote
    const { data: emailHistory, error } = await supabase
      .from('quote_email_tracking')
      .select('*')
      .eq('quotation_id', quoteId)
      .order('sent_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch email history:', error);
      return NextResponse.json({
        history: [],
        message: 'Could not fetch email history',
      });
    }

    return NextResponse.json({
      history: emailHistory || [],
    });
  } catch (error) {
    console.error('Email history error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch email history' },
      { status: 500 }
    );
  }
}
