import type { NextRequest } from 'next/server';
import { createSupabaseServiceClient } from './supabase-server';

export type AuditAction =
  | 'client_drive_mapping_created'
  | 'client_drive_mapping_updated'
  | 'client_drive_mapping_deleted'
  | 'client_drive_file_access'
  | 'client_drive_access_denied'
  | 'section_access_updated';

export async function writeAuditLog(params: {
  req: NextRequest;
  actorUserId: string | null;
  action: AuditAction;
  targetType: string;
  targetId: string;
  metadata?: Record<string, unknown> | null;
}) {
  const supabase = createSupabaseServiceClient();

  const ip = params.req.headers.get('x-forwarded-for') || params.req.ip || null;
  const userAgent = params.req.headers.get('user-agent');

  await supabase.from('security_audit_logs').insert({
    actor_user_id: params.actorUserId,
    action: params.action,
    target_type: params.targetType,
    target_id: params.targetId,
    metadata: params.metadata || null,
    ip,
    user_agent: userAgent,
  });
}
