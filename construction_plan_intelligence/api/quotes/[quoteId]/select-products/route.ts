/**
 * POST /api/quotes/[quoteId]/select-products
 * Allow customers to select specific product variants
 * Deterministically recalculate quote totals
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ quoteId: string }> }
) {
  try {
    // 1. Authenticate user
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: (cookies) => {
            cookies.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Get quoteId from params
    const params = await context.params;
    const { quoteId } = params;

    // 3. Parse request body
    const { selections } = await request.json();

    if (!selections || !Array.isArray(selections)) {
      return NextResponse.json(
        { error: 'selections array is required' },
        { status: 400 }
      );
    }

    // 4. Fetch quote and verify ownership
    const { data: quote, error: quoteError } = await supabase
      .from('quotes')
      .select('*')
      .eq('id', quoteId)
      .single();

    if (quoteError || !quote) {
      return NextResponse.json({ error: 'Quote not found' }, { status: 404 });
    }

    if (quote.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 5. Fetch all quote lines
    const { data: quoteLines, error: linesError } = await supabase
      .from('quote_lines')
      .select('*')
      .eq('quote_id', quoteId);

    if (linesError || !quoteLines) {
      return NextResponse.json(
        { error: 'Quote lines not found' },
        { status: 404 }
      );
    }

    // 6. Process selections and update quote lines
    const updates = [];

    for (const selection of selections) {
      const { lineId, productSku } = selection;

      if (!lineId || !productSku) {
        continue;
      }

      // Find the quote line
      const quoteLine = quoteLines.find((line) => line.id === lineId);
      if (!quoteLine) {
        console.warn(`Quote line ${lineId} not found`);
        continue;
      }

      // Fetch the selected product
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('*')
        .eq('sku', productSku)
        .single();

      if (productError || !product) {
        console.warn(`Product ${productSku} not found`);
        continue;
      }

      // Calculate new price (use product base_price if available)
      const newUnitPrice = product.base_price || quoteLine.unit_price;
      const newLineTotal = quoteLine.qty * parseFloat(newUnitPrice.toString());

      // Prepare update
      updates.push({
        id: lineId,
        unit_price: newUnitPrice,
        line_total: newLineTotal,
        selections: {
          product_sku: productSku,
          product_name: product.name,
          product_material: product.material,
          product_brand: product.brand,
        },
      });
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { error: 'No valid selections provided' },
        { status: 400 }
      );
    }

    // 7. Update quote lines
    for (const update of updates) {
      await supabase
        .from('quote_lines')
        .update({
          unit_price: update.unit_price,
          line_total: update.line_total,
          selections: update.selections,
        })
        .eq('id', update.id);
    }

    // 8. Recalculate quote totals (fetch updated lines)
    const { data: updatedLines } = await supabase
      .from('quote_lines')
      .select('*')
      .eq('quote_id', quoteId);

    const subtotal = updatedLines?.reduce(
      (sum, line) => sum + parseFloat(line.line_total.toString()),
      0
    ) || 0;

    const taxRate = 0.18; // 18% GST
    const tax = subtotal * taxRate;
    const total = subtotal + tax;

    // 9. Update quote totals
    const { data: updatedQuote, error: updateError } = await supabase
      .from('quotes')
      .update({
        subtotal,
        tax,
        total,
        updated_at: new Date().toISOString(),
      })
      .eq('id', quoteId)
      .select()
      .single();

    if (updateError) {
      console.error('Quote update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to update quote totals', details: updateError.message },
        { status: 500 }
      );
    }

    // 10. Return updated quote and lines
    return NextResponse.json({
      quote: updatedQuote,
      lines: updatedLines,
      recalculated: true,
      message: 'Product selections applied and quote recalculated.',
    });

  } catch (error) {
    console.error('Product selection error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
