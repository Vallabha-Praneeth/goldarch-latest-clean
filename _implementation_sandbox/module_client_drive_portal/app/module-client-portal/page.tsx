'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { FolderOpen, FileText, Image, File, Download, Eye } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { ScrollArea } from '../../components/ui/scroll-area';

interface DriveItem {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime?: string;
  size?: string;
}

interface FolderResponse {
  folders: { drive_folder_id: string; drive_folder_name: string | null }[];
  contents: { folders: DriveItem[]; files: DriveItem[] } | null;
}

export default function ClientPortalPage() {
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<FolderResponse | null>(null);
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
  const [activeContents, setActiveContents] = useState<{ folders: DriveItem[]; files: DriveItem[] } | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch('/api/client-portal/folders')
      .then((res) => res.json())
      .then((payload) => {
        setData(payload);
        if (payload?.folders?.length) {
          setActiveFolderId(payload.folders[0].drive_folder_id);
        }
        setActiveContents(payload.contents || null);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!activeFolderId) return;
    fetch(`/api/client-portal/folders/${activeFolderId}`)
      .then((res) => res.json())
      .then((payload) => {
        setActiveContents(payload.contents || null);
      })
      .catch(() => {
        setActiveContents(null);
      });
  }, [activeFolderId]);

  const filteredFolders = useMemo(() => {
    if (!activeContents) return [];
    return activeContents.folders.filter((folder) => folder.name.toLowerCase().includes(search.toLowerCase()));
  }, [activeContents, search]);

  const filteredFiles = useMemo(() => {
    if (!activeContents) return [];
    return activeContents.files.filter((file) => file.name.toLowerCase().includes(search.toLowerCase()));
  }, [activeContents, search]);

  const renderFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <Image className="w-4 h-4" />;
    if (mimeType.includes('pdf')) return <FileText className="w-4 h-4" />;
    return <File className="w-4 h-4" />;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Client Drive Portal</h1>
          <p className="text-sm text-muted-foreground">Browse your assigned project folders and files.</p>
        </div>
        <div className="w-full max-w-sm">
          <Input
            placeholder="Search folders or files"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <Card>
          <CardContent className="p-6">Loading your Drive contents...</CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          <Card className="h-[520px]">
            <CardHeader>
              <CardTitle className="text-lg">Folders</CardTitle>
            </CardHeader>
            <CardContent className="h-[440px] p-0">
              <ScrollArea className="h-full">
                <div className="p-4 space-y-2">
                  {(data?.folders || []).map((folder) => (
                    <button
                      key={folder.drive_folder_id}
                      onClick={() => setActiveFolderId(folder.drive_folder_id)}
                      className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${activeFolderId === folder.drive_folder_id ? 'bg-muted text-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
                    >
                      <FolderOpen className="w-4 h-4" />
                      {folder.drive_folder_name || 'Client Folder'}
                    </button>
                  ))}

                  {filteredFolders.map((folder) => (
                    <button
                      key={folder.id}
                      onClick={() => setActiveFolderId(folder.id)}
                      className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${activeFolderId === folder.id ? 'bg-muted text-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
                    >
                      <FolderOpen className="w-4 h-4" />
                      {folder.name}
                    </button>
                  ))}

                  {!data?.folders?.length && !filteredFolders.length && (
                    <p className="text-sm text-muted-foreground">No folders assigned yet.</p>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          <Card className="h-[520px]">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Files</CardTitle>
              <Badge variant="secondary">{filteredFiles.length} files</Badge>
            </CardHeader>
            <CardContent className="h-[440px] p-0">
              <ScrollArea className="h-full">
                <div className="p-4 space-y-3">
                  {filteredFiles.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center justify-between rounded-lg border border-border p-3"
                    >
                      <div className="flex items-center gap-3">
                        {renderFileIcon(file.mimeType)}
                        <div>
                          <p className="text-sm font-medium">{file.name}</p>
                          <p className="text-xs text-muted-foreground">{file.modifiedTime ? new Date(file.modifiedTime).toLocaleDateString() : 'Updated recently'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/api/client-portal/files/${file.id}?disposition=inline`}
                          className="text-sm"
                          target="_blank"
                        >
                          <Button size="sm" variant="outline">
                            <Eye className="w-4 h-4 mr-1" />
                            Preview
                          </Button>
                        </Link>
                        <Link
                          href={`/api/client-portal/files/${file.id}?disposition=attachment`}
                          className="text-sm"
                        >
                          <Button size="sm">
                            <Download className="w-4 h-4 mr-1" />
                            Download
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}

                  {!filteredFiles.length && (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <FileText className="w-8 h-8 text-muted-foreground" />
                      <p className="mt-2 text-sm text-muted-foreground">No files found in this folder.</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
