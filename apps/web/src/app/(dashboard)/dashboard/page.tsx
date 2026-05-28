import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getServerSession } from '@/lib/auth/session';
import { DashboardOverview } from '@/components/dashboard/dashboard-overview';
import { ClientDashboard } from '@/components/dashboard/client-dashboard';
import { InvestorDashboard } from '@/components/dashboard/investor-dashboard';
export const metadata: Metadata = { title: 'Dashboard' };

export default async function DashboardPage() {
  const session = await getServerSession();
  const role = session!.user.role;

  if (role === 'lgu_officer') {
    redirect('/smart-city');
  }

  if (role === 'client') {
    return <ClientDashboard />;
  }

  if (role === 'investor') {
    return <InvestorDashboard />;
  }

  return <DashboardOverview role={role} />;
}
