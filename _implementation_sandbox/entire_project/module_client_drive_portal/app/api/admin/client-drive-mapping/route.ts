import { NextResponse } from 'next/server';
import { withApiAuth } from '../../../../lib/api-auth';
import { createSupabaseServerClient } from '../../../../lib/supabase-server';
import { writeAuditLog } from '../../../../lib/audit';

function requireAdminOrManager(role?: string | null) {
  return role === 'Admin' || role === 'Manager';
}

export const POST = withApiAuth(async (req) => {
  if (!requireAdminOrManager(req.user?.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json();
  const { client_id, drive_folder_id, drive_folder_name } = body || {};

  if (!client_id || !drive_folder_id) {
    return NextResponse.json({ error: 'client_id and drive_folder_id are required' }, { status: 400 });
  }

  const supabase = createSupabaseServerClient(req);
  const { data, error } = await supabase
    .from('client_drive_folders')
    .insert({
      client_id,
      drive_folder_id,
      drive_folder_name: drive_folder_name || null,
      created_by: req.user?.id || null,
    })
    .select('*')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await writeAuditLog({
    req,
    actorUserId: req.user?.id || null,
    action: 'client_drive_mapping_created',
    targetType: 'client_drive_folder',
    targetId: data.id,
    metadata: { client_id, drive_folder_id },
  });

  return NextResponse.json({ mapping: data });
});

export const GET = withApiAuth(async (req) => {
  if (!requireAdminOrManager(req.user?.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const supabase = createSupabaseServerClient(req);
  const { data, error } = await supabase
    .from('client_drive_folders')
    .select('id, client_id, drive_folder_id, drive_folder_name')
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ mappings: data || [] });
});

export const DELETE = withApiAuth(async (req) => {
  if (!requireAdminOrManager(req.user?.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const mappingId = searchParams.get('id');

  if (!mappingId) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 });
  }

  const supabase = createSupabaseServerClient(req);
  const { error } = await supabase
    .from('client_drive_folders')
    .delete()
    .eq('id', mappingId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await writeAuditLog({
    req,
    actorUserId: req.user?.id || null,
    action: 'client_drive_mapping_deleted',
    targetType: 'client_drive_folder',
    targetId: mappingId,
  });

  return NextResponse.json({ success: true });
});
