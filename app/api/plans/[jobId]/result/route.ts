/**
 * GET /api/plans/[jobId]/result
 * Get the extraction results for a completed plan analysis job
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ jobId: string }> }
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

    // 2. Get jobId from params
    const params = await context.params;
    const { jobId } = params;

    // 3. Fetch job data
    const { data: job, error: jobError } = await supabase
      .from('plan_jobs')
      .select('*')
      .eq('id', jobId)
      .single();

    if (jobError || !job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // 4. Verify ownership
    if (job.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 5. Check if job is completed
    if (job.status === 'queued' || job.status === 'processing') {
      return NextResponse.json(
        { error: 'Job not yet completed', status: job.status },
        { status: 425 } // Too Early
      );
    }

    if (job.status === 'failed') {
      return NextResponse.json(
        { error: 'Job failed', details: job.error },
        { status: 500 }
      );
    }

    // 6. Fetch analysis results
    const { data: analysis, error: analysisError } = await supabase
      .from('plan_analyses')
      .select('*')
      .eq('job_id', jobId)
      .single();

    if (analysisError || !analysis) {
      return NextResponse.json(
        { error: 'Analysis not found' },
        { status: 404 }
      );
    }

    // 7. Check if a quote has been generated for this job
    const { data: quote } = await supabase
      .from('quotes')
      .select('id, status, total, currency')
      .eq('job_id', jobId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // 8. Fetch artifacts for evidence display
    const { data: artifacts } = await supabase
      .from('plan_job_artifacts')
      .select('*')
      .eq('job_id', jobId)
      .order('page_no', { ascending: true });

    // 9. Return comprehensive result
    return NextResponse.json({
      job,
      analysis: {
        id: analysis.id,
        model: analysis.model,
        quantities: analysis.quantities,
        confidence: analysis.confidence,
        evidence: analysis.evidence,
        needs_review: analysis.needs_review,
        created_at: analysis.created_at,
      },
      quote: quote ? {
        id: quote.id,
        status: quote.status,
        total: quote.total,
        currency: quote.currency,
      } : null,
      artifacts: artifacts || [],
    });

  } catch (error) {
    console.error('Result fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
