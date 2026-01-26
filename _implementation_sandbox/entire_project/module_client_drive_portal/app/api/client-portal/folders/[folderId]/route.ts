import { NextResponse } from 'next/server';
import { withApiAuth } from '../../../../../lib/api-auth';
import { createRateLimiter } from '../../../../../lib/rate-limit';
import { getDriveFoldersForClient, getClientIdForUser } from '../../../../../lib/permissions/client-drive-access';
import { listFolderContents, getFileMetadata } from '../../../../../lib/drive/drive-client';
import { getCachedJson, setCachedJson } from '../../../../../lib/drive/drive-cache';
import { isFileInAllowedFolders } from '../../../../../lib/drive/drive-validate';
import { createSupabaseServerClient } from '../../../../../lib/supabase-server';

const listLimiter = createRateLimiter(60, '1 m');
const LIST_TTL_SECONDS = 120;

export const GET = withApiAuth(async (req, context: { params: { folderId: string } }) => {
  const userId = req.user?.id;
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { success } = await listLimiter.limit(`rl:drive:list:${userId}`);
  if (!success) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
  }

  const supabase = createSupabaseServerClient(req);
  const clientId = await getClientIdForUser(supabase, userId);
  if (!clientId) {
    return NextResponse.json({ error: 'Client membership not found' }, { status: 403 });
  }

  const folders = await getDriveFoldersForClient(supabase, clientId);
  const allowedFolderIds = folders.map((folder) => folder.drive_folder_id);
  const folderId = context.params.folderId;

  if (!allowedFolderIds.includes(folderId)) {
    const isChild = await isFileInAllowedFolders(folderId, allowedFolderIds);
    if (!isChild) {
      return NextResponse.json({ error: 'Folder access denied' }, { status: 403 });
    }
  }

  const cacheKey = `drive:list:${clientId}:${folderId}`;
  const cached = await getCachedJson(cacheKey);
  if (cached) {
    return NextResponse.json({ folderId, contents: cached });
  }

  const metadata = await getFileMetadata(folderId);
  if (metadata.mimeType !== 'application/vnd.google-apps.folder') {
    return NextResponse.json({ error: 'Not a folder' }, { status: 400 });
  }

  const contents = await listFolderContents(folderId);
  await setCachedJson(cacheKey, contents, LIST_TTL_SECONDS);

  return NextResponse.json({ folderId, contents });
}, { requiredSection: 'client_portal', requiredAccessLevel: 'view' });
