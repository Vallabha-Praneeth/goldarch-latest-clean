import { NextResponse } from 'next/server';
import { withApiAuth } from '../../../../lib/api-auth';
import { createSupabaseServerClient } from '../../../../lib/supabase-server';
import { writeAuditLog } from '../../../../lib/audit';

function requireAdminOrManager(role?: string | null) {
  return role === 'Admin' || role === 'Manager';
}

export const GET = withApiAuth(async (req) => {
  const supabase = createSupabaseServerClient(req);
  const { searchParams } = new URL(req.url);
  const scope = searchParams.get('scope');
  const userId = searchParams.get('user_id');

  if (scope === 'self') {
    const { data, error } = await supabase
      .from('crm_section_access')
      .select('section, access_level')
      .eq('user_id', req.user?.id || '');

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ access: data || [] });
  }

  if (!requireAdminOrManager(req.user?.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let query = supabase
    .from('crm_section_access')
    .select('user_id, section, access_level');

  if (userId) {
    query = query.eq('user_id', userId);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ access: data || [] });
});

export const POST = withApiAuth(async (req) => {
  if (!requireAdminOrManager(req.user?.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json();
  const { user_id, access } = body || {};

  if (!user_id || !Array.isArray(access)) {
    return NextResponse.json({ error: 'user_id and access[] are required' }, { status: 400 });
  }

  const supabase = createSupabaseServerClient(req);

  const payload = access.map((entry) => ({
    user_id,
    section: entry.section,
    access_level: entry.access_level,
    created_by: req.user?.id || null,
  }));

  const { error } = await supabase
    .from('crm_section_access')
    .upsert(payload, { onConflict: 'user_id,section' });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await writeAuditLog({
    req,
    actorUserId: req.user?.id || null,
    action: 'section_access_updated',
    targetType: 'user',
    targetId: user_id,
    metadata: { access },
  });

  return NextResponse.json({ success: true });
});
