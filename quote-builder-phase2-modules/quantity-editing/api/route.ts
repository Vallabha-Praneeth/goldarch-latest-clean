/**
 * Manual Quantity Editing Module - API Routes
 * Phase 2 - Modular Implementation
 *
 * Installation Instructions:
 * 1. Copy this file to: app/api/quote/extraction/[jobId]/adjust/route.ts
 * 2. Run SQL migration to create adjustments table
 * 3. Update extraction review page to use this API
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  AdjustmentRequest,
  AdjustmentResponse,
  AdjustmentsListResponse,
  ExtractionAdjustment,
} from '@/lib/extraction/types';

// Validation schema
const AdjustmentSchema = z.object({
  category: z.string().min(1, 'Category is required'),
  itemType: z.string().min(1, 'Item type is required'),
  originalQuantity: z.number().int().min(0, 'Original quantity must be non-negative'),
  adjustedQuantity: z.number().int().min(0, 'Adjusted quantity must be non-negative'),
  reason: z.string().optional(),
});

/**
 * POST - Create or update an adjustment
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ jobId: string }> }
) {
  try {
    const params = await context.params;
    const { jobId } = params;

    // Parse and validate request body
    const body = await request.json();
    const validatedData = AdjustmentSchema.parse(body);

    // Initialize Supabase
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Check if adjustment already exists for this item
    const { data: existing, error: checkError } = await supabase
      .from('quote_extraction_adjustments')
      .select('id')
      .eq('job_id', jobId)
      .eq('category', validatedData.category)
      .eq('item_type', validatedData.itemType)
      .maybeSingle();

    if (checkError) {
      console.error('Check existing adjustment error:', checkError);
      throw checkError;
    }

    let result;

    if (existing) {
      // Update existing adjustment
      const { data, error } = await supabase
        .from('quote_extraction_adjustments')
        .update({
          original_quantity: validatedData.originalQuantity,
          adjusted_quantity: validatedData.adjustedQuantity,
          reason: validatedData.reason,
          adjusted_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw error;
      result = data;
    } else {
      // Create new adjustment
      const { data, error } = await supabase
        .from('quote_extraction_adjustments')
        .insert({
          job_id: jobId,
          category: validatedData.category,
          item_type: validatedData.itemType,
          original_quantity: validatedData.originalQuantity,
          adjusted_quantity: validatedData.adjustedQuantity,
          reason: validatedData.reason,
          adjusted_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      result = data;
    }

    const response: AdjustmentResponse = {
      success: true,
      adjustment: result,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Adjustment save error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to save adjustment',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET - Retrieve all adjustments for a job
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ jobId: string }> }
) {
  try {
    const params = await context.params;
    const { jobId } = params;

    // Initialize Supabase
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Fetch all adjustments for this job
    const { data, error } = await supabase
      .from('quote_extraction_adjustments')
      .select('*')
      .eq('job_id', jobId)
      .order('adjusted_at', { ascending: false });

    if (error) {
      console.error('Fetch adjustments error:', error);
      throw error;
    }

    const response: AdjustmentsListResponse = {
      success: true,
      adjustments: data || [],
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Fetch adjustments error:', error);
    return NextResponse.json(
      {
        success: false,
        adjustments: [],
        error: 'Failed to fetch adjustments',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Remove an adjustment (revert to original quantity)
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ jobId: string }> }
) {
  try {
    const params = await context.params;
    const { jobId } = params;

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const itemType = searchParams.get('itemType');

    if (!category || !itemType) {
      return NextResponse.json(
        { error: 'Category and itemType are required' },
        { status: 400 }
      );
    }

    // Initialize Supabase
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Delete the adjustment
    const { error } = await supabase
      .from('quote_extraction_adjustments')
      .delete()
      .eq('job_id', jobId)
      .eq('category', category)
      .eq('item_type', itemType);

    if (error) {
      console.error('Delete adjustment error:', error);
      throw error;
    }

    return NextResponse.json({
      success: true,
      message: 'Adjustment removed successfully',
    });
  } catch (error) {
    console.error('Delete adjustment error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete adjustment',
      },
      { status: 500 }
    );
  }
}
