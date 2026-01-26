'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { AuthProvider, useAuth } from '../../lib/auth-provider';

interface Mapping {
  id: string;
  client_id: string;
  drive_folder_id: string;
  drive_folder_name: string | null;
}

function AdminDriveMappingShell() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [clientId, setClientId] = useState('');
  const [folderId, setFolderId] = useState('');
  const [folderName, setFolderName] = useState('');
  const [mappings, setMappings] = useState<Mapping[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [roleAllowed, setRoleAllowed] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    fetch('/api/admin/section-access?scope=self')
      .then((res) => res.json())
      .then((data) => {
        const access = data.access || [];
        const hasClientPortal = access.some(
          (entry: { section: string; access_level: string }) =>
            entry.section === 'client_portal' && entry.access_level !== 'none'
        );
        setRoleAllowed(hasClientPortal);
      })
      .catch(() => setRoleAllowed(false));
  }, [user]);

  useEffect(() => {
    if (roleAllowed) {
      fetchMappings();
    }
  }, [roleAllowed]);

  const fetchMappings = async () => {
    setMessage(null);
    const response = await fetch('/api/admin/client-drive-mapping');
    if (!response.ok) return;
    const data = await response.json();
    setMappings(data.mappings || []);
  };

  const handleCreate = async () => {
    setMessage(null);
    const response = await fetch('/api/admin/client-drive-mapping', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: clientId,
        drive_folder_id: folderId,
        drive_folder_name: folderName || null,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      setMessage(data.error || 'Failed to create mapping');
      return;
    }

    setClientId('');
    setFolderId('');
    setFolderName('');
    setMessage('Mapping created');
    fetchMappings();
  };

  const handleDelete = async (mappingId: string) => {
    setMessage(null);
    const response = await fetch(`/api/admin/client-drive-mapping?id=${mappingId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const data = await response.json();
      setMessage(data.error || 'Failed to delete mapping');
      return;
    }

    setMessage('Mapping deleted');
    fetchMappings();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (!roleAllowed) {
    return (
      <Card>
        <CardContent className="p-6">Insufficient permissions.</CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Admin: Client Drive Mapping</h1>
        <p className="text-sm text-muted-foreground">Create and manage client folder mappings.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Create Mapping</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Input
              placeholder="Client ID"
              value={clientId}
              onChange={(event) => setClientId(event.target.value)}
            />
            <Input
              placeholder="Drive Folder ID"
              value={folderId}
              onChange={(event) => setFolderId(event.target.value)}
            />
            <Input
              placeholder="Folder Name (optional)"
              value={folderName}
              onChange={(event) => setFolderName(event.target.value)}
            />
          </div>
          <Button onClick={handleCreate}>Create Mapping</Button>
          {message && <p className="text-sm text-muted-foreground">{message}</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Existing Mappings</CardTitle>
          <Badge variant="secondary">{mappings.length}</Badge>
        </CardHeader>
        <CardContent className="space-y-3">
          {mappings.map((mapping) => (
            <div key={mapping.id} className="flex items-center justify-between rounded-lg border border-border p-3">
              <div>
                <p className="text-sm font-medium">{mapping.drive_folder_name || 'Unnamed Folder'}</p>
                <p className="text-xs text-muted-foreground">Client: {mapping.client_id}</p>
                <p className="text-xs text-muted-foreground">Folder ID: {mapping.drive_folder_id}</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => handleDelete(mapping.id)}>
                Remove
              </Button>
            </div>
          ))}

          {!mappings.length && (
            <p className="text-sm text-muted-foreground">No mappings created yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function AdminDriveMappingPage() {
  return (
    <AuthProvider>
      <AdminDriveMappingShell />
    </AuthProvider>
  );
}
