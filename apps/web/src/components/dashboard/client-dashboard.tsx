'use client';

import { useMemo, useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { useClientDashboard } from '@/hooks/use-api';
import { PageContainer } from '@/components/layout/page-container';
import { CreateTicketModal } from '@/components/maintenance/create-ticket-modal';
import { ClientChatPanel } from '@/components/dashboard/client-chat-panel';
import {
  AiInsightsPanel,
  BatteryMonitorPanel,
  BillingOverviewPanel,
  ClientPortalSkeleton,
  LiveProductionHero,
  MaintenancePanel,
  MobileQuickNav,
  NotificationsPanel,
  ProductionAnalyticsPanel,
  SavingsCarbonWidgets,
} from '@/components/dashboard/client-portal-widgets';

function hourLabel(h: number) {
  if (h === 0) return '12am';
  if (h < 12) return `${h}am`;
  if (h === 12) return '12pm';
  return `${h - 12}pm`;
}

export function ClientDashboard() {
  const { data, isLoading, isError } = useClientDashboard();
  const [showTicketModal, setShowTicketModal] = useState(false);

  const chartData = useMemo(
    () =>
      (data?.todayHourly ?? []).map((h) => ({
        time: hourLabel(h.hour),
        production: Math.round((h.productionW / 1000) * 10) / 10,
        consumption: Math.round((h.consumptionW / 1000) * 10) / 10,
      })),
    [data?.todayHourly],
  );

  const name =
    [data?.profile?.firstName, data?.profile?.lastName].filter(Boolean).join(' ') || 'there';

  const chatContext = useMemo(
    () => ({
      systemSummary: data?.primarySystem
        ? {
            name: data.primarySystem.name,
            sizeKw: data.primarySystem.systemSizeKw,
            liveProductionW: data.live.solarProductionW,
            energyTodayKwh: data.live.energyTodayKwh,
            batterySoc: data.live.batterySoc,
            savingsPhp: data.trackers.savingsTracker.estimatedPhp,
            carbonKg: data.trackers.carbonReductionTracker.totalKg,
          }
        : undefined,
      recentAlerts: data?.notifications.recent.slice(0, 3).map((n) => n.title) ?? [],
    }),
    [data],
  );

  if (isLoading) {
    return (
      <PageContainer className="pb-24 md:pb-8 max-w-3xl mx-auto">
        <ClientPortalSkeleton />
      </PageContainer>
    );
  }

  if (isError || !data) {
    return (
      <PageContainer className="max-w-3xl mx-auto">
        <div className="panel-card p-6 text-center">
          <AlertCircle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
          <p className="font-medium">Could not load your portal</p>
          <p className="text-sm text-muted-foreground mt-1">
            Sign in as <span className="text-foreground font-mono text-xs">client@demo.ph</span> (password{' '}
            <span className="font-mono text-xs">Demo1234!</span>) and ensure the API is on port 4000.
          </p>
        </div>
      </PageContainer>
    );
  }

  return (
    <>
      <PageContainer className="pb-24 md:pb-8 max-w-3xl mx-auto space-y-4 sm:space-y-5">
        <header className="space-y-0.5 pt-1">
          <p className="text-xs text-solar-500 font-semibold uppercase tracking-widest">Client portal</p>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Hi, {name}</h1>
          <p className="text-sm text-muted-foreground">
            Your energy, savings, and service — updated every few seconds.
          </p>
        </header>

        <LiveProductionHero live={data.live} system={data.primarySystem} />

        <SavingsCarbonWidgets
          trackers={data.trackers}
          forecastSavingsPhp={data.aiSummary?.forecastSavingsPhp}
        />

        <BatteryMonitorPanel battery={data.battery} live={data.live} />

        <ProductionAnalyticsPanel
          chartData={chartData}
          monthlyChart={data.monthlyReports}
          peakDemand={data.peakDemand}
        />

        <AiInsightsPanel aiSummary={data.aiSummary} recommendations={data.aiRecommendations} />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
          <BillingOverviewPanel billing={data.billing} />
          <MaintenancePanel maintenance={data.maintenance} onNewTicket={() => setShowTicketModal(true)} />
        </div>

        <NotificationsPanel notifications={data.notifications} />
      </PageContainer>

      <MobileQuickNav />

      {showTicketModal && <CreateTicketModal onClose={() => setShowTicketModal(false)} />}

      <ClientChatPanel
        systemSummary={chatContext.systemSummary}
        recentAlerts={chatContext.recentAlerts}
      />
    </>
  );
}
