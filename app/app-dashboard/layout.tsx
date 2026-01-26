import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/server/require-user';
import DashboardLayoutClient from './dashboard-layout-client';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { ok } = await requireUser();

  if (!ok) {
    redirect('/auth?next=/app-dashboard');
  }

  return <DashboardLayoutClient>{children}</DashboardLayoutClient>;
}
