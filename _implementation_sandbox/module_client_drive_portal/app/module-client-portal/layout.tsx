'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import {
  Building2,
  LayoutDashboard,
  Users,
  FolderKanban,
  Handshake,
  FileText,
  CheckSquare,
  Activity,
  LogOut,
  Menu,
  Files,
  UserCog,
  Layout,
  FolderOpen,
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { AuthProvider, useAuth } from '../../lib/auth-provider';
import { getDefaultSectionAccess, isSectionAllowed, type CRMSection, type AccessLevel } from '../../lib/permissions/section-access';

const navigation = [
  { name: 'Dashboard', href: '/app-dashboard', icon: LayoutDashboard, section: 'dashboard' },
  { name: 'Suppliers', href: '/app-dashboard/suppliers', icon: Users, section: 'suppliers' },
  { name: 'Projects', href: '/app-dashboard/projects', icon: FolderKanban, section: 'projects' },
  { name: 'Deals', href: '/app-dashboard/deals', icon: Handshake, section: 'deals' },
  { name: 'Quotes', href: '/app-dashboard/quotes', icon: FileText, section: 'quotes' },
  { name: 'Documents', href: '/app-dashboard/documents', icon: Files, section: 'documents' },
  { name: 'Plans', href: '/app-dashboard/plans', icon: Layout, section: 'plans' },
  { name: 'Tasks', href: '/app-dashboard/tasks', icon: CheckSquare, section: 'tasks' },
  { name: 'Activities', href: '/app-dashboard/activities', icon: Activity, section: 'activities' },
  { name: 'Team', href: '/app-dashboard/team', icon: UserCog, section: 'team' },
  { name: 'Client Portal', href: '/module-client-portal', icon: FolderOpen, section: 'client_portal' },
] as const;

type AccessMap = Record<CRMSection, AccessLevel>;

function ClientPortalShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading, signOut } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [accessMap, setAccessMap] = useState<AccessMap>(getDefaultSectionAccess());

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
        if (!data.access) return;
        const next = getDefaultSectionAccess();
        data.access.forEach((row: { section: CRMSection; access_level: AccessLevel }) => {
          next[row.section] = row.access_level;
        });
        setAccessMap(next);
      })
      .catch(() => {
        setAccessMap(getDefaultSectionAccess());
      });
  }, [user]);

  const visibleNavigation = useMemo(() => {
    return navigation.filter((item) => isSectionAllowed(accessMap, item.section));
  }, [accessMap]);

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

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-background">
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border transform transition-transform duration-200 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        <div className="flex flex-col h-full">
          <div className="flex items-center gap-3 p-6 border-b border-border">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gold to-gold-light flex items-center justify-center shadow-gold">
              <Building2 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <span className="font-bold text-lg">Gold.Arch</span>
              <p className="text-xs text-muted-foreground">Client Portal</p>
            </div>
          </div>

          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {visibleNavigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className="w-5 h-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-border">
            <div className="mb-3 px-3">
              <p className="text-sm font-medium truncate">{user.email}</p>
              <p className="text-xs text-muted-foreground">Logged in</p>
            </div>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={handleSignOut}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>

      <div className="lg:hidden fixed top-4 left-4 z-40">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          <Menu className="w-5 h-5" />
        </Button>
      </div>

      <div className="lg:pl-64">
        <main className="p-6 lg:p-8">
          {children}
        </main>
      </div>

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}

export default function ClientPortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ClientPortalShell>{children}</ClientPortalShell>
    </AuthProvider>
  );
}
