import { NextResponse } from 'next/server';
import { withApiAuth } from '../../../../../lib/api-auth';
import { createRateLimiter } from '../../../../../lib/rate-limit';
import { getClientIdForUser, getDriveFoldersForClient } from '../../../../../lib/permissions/client-drive-access';
import { isFileInAllowedFolders } from '../../../../../lib/drive/drive-validate';
import { downloadFile, getFileMetadata } from '../../../../../lib/drive/drive-client';
import { createSupabaseServerClient } from '../../../../../lib/supabase-server';
import { writeAuditLog } from '../../../../../lib/audit';

const downloadLimiter = createRateLimiter(30, '1 m');

export const GET = withApiAuth(async (req, context: { params: { fileId: string } }) => {
  const userId = req.user?.id;
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { success } = await downloadLimiter.limit(`rl:drive:download:${userId}`);
  if (!success) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
  }

  const supabase = createSupabaseServerClient(req);
  const clientId = await getClientIdForUser(supabase, userId);
  if (!clientId) {
    return NextResponse.json({ error: 'Client membership not found' }, { status: 403 });
  }

  const fileId = context.params.fileId;
  const folders = await getDriveFoldersForClient(supabase, clientId);
  const allowedFolderIds = folders.map((folder) => folder.drive_folder_id);

  const isAllowed = await isFileInAllowedFolders(fileId, allowedFolderIds);
  if (!isAllowed) {
    await writeAuditLog({
      req,
      actorUserId: userId,
      action: 'client_drive_access_denied',
      targetType: 'drive_file',
      targetId: fileId,
      metadata: { reason: 'file_not_in_allowed_folders' },
    });
    return NextResponse.json({ error: 'File access denied' }, { status: 403 });
  }

  const metadata = await getFileMetadata(fileId);
  const driveResponse = await downloadFile(fileId);

  await writeAuditLog({
    req,
    actorUserId: userId,
    action: 'client_drive_file_access',
    targetType: 'drive_file',
    targetId: fileId,
    metadata: { name: metadata.name, mimeType: metadata.mimeType },
  });

  const dispositionParam = new URL(req.url).searchParams.get('disposition');
  const disposition = dispositionParam === 'inline' ? 'inline' : 'attachment';

  return new NextResponse(driveResponse.body, {
    headers: {
      'Content-Type': metadata.mimeType,
      'Content-Disposition': `${disposition}; filename="${metadata.name}"`,
    },
  });
}, { requiredSection: 'client_portal', requiredAccessLevel: 'view' });
