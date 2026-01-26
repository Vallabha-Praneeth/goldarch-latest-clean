/**
 * GET /api/plans/[jobId]/status
 * Get the current status of a plan processing job
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

    // 5. Calculate progress (simple heuristic based on status)
    let progress = {
      stage: 'Initializing',
      percentage: 0,
    };

    switch (job.status) {
      case 'queued':
        progress = { stage: 'Queued', percentage: 0 };
        break;
      case 'processing':
        progress = { stage: 'Processing plan', percentage: 50 };
        break;
      case 'needs_review':
        progress = { stage: 'Completed - Needs review', percentage: 100 };
        break;
      case 'completed':
        progress = { stage: 'Completed', percentage: 100 };
        break;
      case 'failed':
        progress = { stage: 'Failed', percentage: 0 };
        break;
    }

    // 6. Check if analysis exists
    let analysisId = null;
    if (job.status === 'completed' || job.status === 'needs_review') {
      const { data: analysis } = await supabase
        .from('plan_analyses')
        .select('id')
        .eq('job_id', jobId)
        .single();

      if (analysis) {
        analysisId = analysis.id;
      }
    }

    // 7. Return response
    return NextResponse.json({
      job,
      progress,
      analysisId,
    });

  } catch (error) {
    console.error('Status check error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
