import type { SupabaseClient } from '@supabase/supabase-js';

type ClientMembership = {
  client_id: string;
};

type ClientDriveFolder = {
  id: string;
  client_id: string;
  drive_folder_id: string;
  drive_folder_name: string | null;
};

export async function getClientIdForUser(
  supabase: SupabaseClient,
  userId: string,
): Promise<string | null> {
  const { data, error } = await supabase
    .from('client_memberships')
    .select('client_id')
    .eq('user_id', userId)
    .single();

  if (error || !data) {
    return null;
  }

  return (data as ClientMembership).client_id;
}

export async function getDriveFoldersForClient(
  supabase: SupabaseClient,
  clientId: string,
): Promise<ClientDriveFolder[]> {
  const { data, error } = await supabase
    .from('client_drive_folders')
    .select('id, client_id, drive_folder_id, drive_folder_name')
    .eq('client_id', clientId);

  if (error) {
    return [];
  }

  return (data || []) as ClientDriveFolder[];
}

export async function assertFolderAccess(
  supabase: SupabaseClient,
  userId: string,
  folderId: string,
): Promise<ClientDriveFolder> {
  const clientId = await getClientIdForUser(supabase, userId);
  if (!clientId) {
    throw new Error('Client membership not found');
  }

  const folders = await getDriveFoldersForClient(supabase, clientId);
  const allowed = folders.find((folder) => folder.drive_folder_id === folderId);

  if (!allowed) {
    throw new Error('Folder not authorized for this client');
  }

  return allowed;
}
