'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { AuthProvider, useAuth } from '../../lib/auth-provider';

const SECTIONS = [
  'dashboard',
  'suppliers',
  'projects',
  'deals',
  'quotes',
  'documents',
  'plans',
  'tasks',
  'activities',
  'team',
  'client_portal',
] as const;

type SectionKey = typeof SECTIONS[number];

type AccessRecord = {
  user_id: string;
  section: SectionKey;
  access_level: 'none' | 'view' | 'edit';
};

function SectionAccessShell() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [targetUserId, setTargetUserId] = useState('');
  const [accessMap, setAccessMap] = useState<Record<SectionKey, 'none' | 'view' | 'edit'>>(
    SECTIONS.reduce((acc, section) => {
      acc[section] = 'none';
      return acc;
    }, {} as Record<SectionKey, 'none' | 'view' | 'edit'>)
  );
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

  const handleSave = async () => {
    setMessage(null);
    if (!targetUserId) {
      setMessage('User ID is required');
      return;
    }

    const payload = SECTIONS.map((section) => ({
      section,
      access_level: accessMap[section],
    }));

    const response = await fetch('/api/admin/section-access', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: targetUserId, access: payload }),
    });

    if (!response.ok) {
      const data = await response.json();
      setMessage(data.error || 'Failed to save access');
      return;
    }

    setMessage('Access updated');
  };

  const handleLoad = async () => {
    setMessage(null);
    if (!targetUserId) {
      setMessage('User ID is required');
      return;
    }

    const response = await fetch(`/api/admin/section-access?user_id=${targetUserId}`);
    if (!response.ok) {
      const data = await response.json();
      setMessage(data.error || 'Failed to load access');
      return;
    }

    const data = await response.json();
    const next = SECTIONS.reduce((acc, section) => {
      acc[section] = 'none';
      return acc;
    }, {} as Record<SectionKey, 'none' | 'view' | 'edit'>);

    (data.access || []).forEach((entry: AccessRecord) => {
      next[entry.section] = entry.access_level;
    });

    setAccessMap(next);
    setMessage('Access loaded');
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
        <h1 className="text-2xl font-semibold">Admin: Section Access</h1>
        <p className="text-sm text-muted-foreground">Set per-section access for a team member.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Target User</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="User ID"
            value={targetUserId}
            onChange={(event) => setTargetUserId(event.target.value)}
          />
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={handleLoad}>Load Access</Button>
            <Button onClick={handleSave}>Save Access</Button>
          </div>
          {message && <p className="text-sm text-muted-foreground">{message}</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Section Permissions</CardTitle>
          <Badge variant="secondary">{SECTIONS.length}</Badge>
        </CardHeader>
        <CardContent className="space-y-3">
          {SECTIONS.map((section) => (
            <div key={section} className="flex flex-col gap-2 rounded-lg border border-border p-3 md:flex-row md:items-center md:justify-between">
              <p className="text-sm font-medium capitalize">{section.replace('_', ' ')}</p>
              <div className="flex gap-2">
                {(['none', 'view', 'edit'] as const).map((level) => (
                  <Button
                    key={`${section}-${level}`}
                    size="sm"
                    variant={accessMap[section] === level ? 'default' : 'outline'}
                    onClick={() =>
                      setAccessMap((prev) => ({
                        ...prev,
                        [section]: level,
                      }))
                    }
                  >
                    {level}
                  </Button>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

export default function AdminSectionAccessPage() {
  return (
    <AuthProvider>
      <SectionAccessShell />
    </AuthProvider>
  );
}
