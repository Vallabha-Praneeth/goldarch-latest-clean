'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { FolderOpen, FileText, Download, Eye } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card';
import { Button } from '../../../../components/ui/button';
import { Badge } from '../../../../components/ui/badge';
import { ScrollArea } from '../../../../components/ui/scroll-area';

interface DriveItem {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime?: string;
}

export default function ClientFolderPage() {
  const params = useParams();
  const folderId = params?.id as string | undefined;
  const [loading, setLoading] = useState(true);
  const [contents, setContents] = useState<{ folders: DriveItem[]; files: DriveItem[] } | null>(null);

  useEffect(() => {
    if (!folderId) return;
    setLoading(true);
    fetch(`/api/client-portal/folders/${folderId}`)
      .then((res) => res.json())
      .then((data) => setContents(data.contents || null))
      .finally(() => setLoading(false));
  }, [folderId]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <FolderOpen className="w-6 h-6 text-muted-foreground" />
        <div>
          <h1 className="text-2xl font-semibold">Folder Contents</h1>
          <p className="text-sm text-muted-foreground">Browse files within the selected folder.</p>
        </div>
      </div>

      <Card className="h-[520px]">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Files</CardTitle>
          <Badge variant="secondary">{contents?.files?.length || 0} files</Badge>
        </CardHeader>
        <CardContent className="h-[440px] p-0">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-3">
              {loading && <p className="text-sm text-muted-foreground">Loading files...</p>}
              {contents?.files?.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between rounded-lg border border-border p-3"
                >
                  <div>
                    <p className="text-sm font-medium">{file.name}</p>
                    <p className="text-xs text-muted-foreground">{file.modifiedTime ? new Date(file.modifiedTime).toLocaleDateString() : 'Updated recently'}</p>
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

              {!loading && (!contents?.files || contents.files.length === 0) && (
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
  );
}
