import { NextResponse } from 'next/server';
import { withApiAuth } from '../../../../lib/api-auth';
import { createRateLimiter } from '../../../../lib/rate-limit';
import { getDriveFoldersForClient, getClientIdForUser } from '../../../../lib/permissions/client-drive-access';
import { listFolderContents } from '../../../../lib/drive/drive-client';
import { getCachedJson, setCachedJson } from '../../../../lib/drive/drive-cache';
import { createSupabaseServerClient } from '../../../../lib/supabase-server';

const listLimiter = createRateLimiter(60, '1 m');
const LIST_TTL_SECONDS = 120;

export const GET = withApiAuth(async (req) => {
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

  if (folders.length === 0) {
    return NextResponse.json({ folders: [], contents: null });
  }

  const primaryFolder = folders[0];
  const cacheKey = `drive:list:${clientId}:${primaryFolder.drive_folder_id}`;
  const cached = await getCachedJson(cacheKey);

  if (cached) {
    return NextResponse.json({ folders, contents: cached });
  }

  const contents = await listFolderContents(primaryFolder.drive_folder_id);
  await setCachedJson(cacheKey, contents, LIST_TTL_SECONDS);

  return NextResponse.json({ folders, contents });
}, { requiredSection: 'client_portal', requiredAccessLevel: 'view' });
