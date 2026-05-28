import { redirect } from 'next/navigation';
import { getServerSession } from '@/lib/auth/session';
import { DashboardShell } from '@/components/layout/dashboard-shell';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession();
  if (!session) redirect('/login');

  return <DashboardShell user={session.user}>{children}</DashboardShell>;
}
