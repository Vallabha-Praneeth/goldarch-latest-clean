import { getDriveAccessToken } from './google-auth';

const DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3';

export type DriveFile = {
  id: string;
  name: string;
  mimeType: string;
  parents?: string[];
  size?: string;
  modifiedTime?: string;
  webViewLink?: string;
};

export type DriveFolderList = {
  folders: DriveFile[];
  files: DriveFile[];
};

async function driveFetch(path: string, init?: RequestInit): Promise<Response> {
  const token = await getDriveAccessToken();
  const response = await fetch(`${DRIVE_API_BASE}${path}`, {
    ...init,
    headers: {
      ...(init?.headers || {}),
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Drive API error ${response.status}: ${errorText}`);
  }

  return response;
}

export async function listFolderContents(folderId: string): Promise<DriveFolderList> {
  const query = `'${folderId}' in parents and trashed=false`;
  const fields = [
    'files(id,name,mimeType,parents,size,modifiedTime,webViewLink)',
  ].join(',');

  const response = await driveFetch(`/files?q=${encodeURIComponent(query)}&fields=${encodeURIComponent(fields)}`);
  const data = await response.json();
  const items: DriveFile[] = data.files || [];

  return {
    folders: items.filter((item) => item.mimeType === 'application/vnd.google-apps.folder'),
    files: items.filter((item) => item.mimeType !== 'application/vnd.google-apps.folder'),
  };
}

export async function getFileMetadata(fileId: string): Promise<DriveFile> {
  const fields = [
    'id',
    'name',
    'mimeType',
    'parents',
    'size',
    'modifiedTime',
    'webViewLink',
  ].join(',');

  const response = await driveFetch(`/files/${fileId}?fields=${encodeURIComponent(fields)}`);
  const data = await response.json();
  return data as DriveFile;
}

export async function downloadFile(fileId: string): Promise<Response> {
  return driveFetch(`/files/${fileId}?alt=media`, { method: 'GET' });
}
