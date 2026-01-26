'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-provider';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
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
  Layout
} from 'lucide-react';
import { useState } from 'react';

const navigation = [
  { name: 'Dashboard', href: '/app-dashboard', icon: LayoutDashboard },
  { name: 'Suppliers', href: '/app-dashboard/suppliers', icon: Users },
  { name: 'Projects', href: '/app-dashboard/projects', icon: FolderKanban },
  { name: 'Deals', href: '/app-dashboard/deals', icon: Handshake },
  { name: 'Quotes', href: '/app-dashboard/quotes', icon: FileText },
  { name: 'Documents', href: '/app-dashboard/documents', icon: Files },
  { name: 'Plans', href: '/app-dashboard/plans', icon: Layout },
  { name: 'Tasks', href: '/app-dashboard/tasks', icon: CheckSquare },
  { name: 'Activities', href: '/app-dashboard/activities', icon: Activity },
  { name: 'Team', href: '/app-dashboard/team', icon: UserCog },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, loading, signOut } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth');
    }
  }, [user, loading, router]);

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
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border transform transition-transform duration-200 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center gap-3 p-6 border-b border-border">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gold to-gold-light flex items-center justify-center shadow-gold">
              <Building2 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <span className="font-bold text-lg">Gold.Arch</span>
              <p className="text-xs text-muted-foreground">CRM</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon className="w-5 h-5" />
                {item.name}
              </Link>
            ))}
          </nav>

          {/* User section */}
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

      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-40">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          <Menu className="w-5 h-5" />
        </Button>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        <main className="p-6 lg:p-8">
          {children}
        </main>
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
