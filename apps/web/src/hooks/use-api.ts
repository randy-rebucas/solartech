import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

// ─── Generic hooks ────────────────────────────────────────────────────────────
export function useGet<T>(key: unknown[], url: string, options?: object) {
  return useQuery<T>({
    queryKey: key,
    queryFn: () => api.get<T>(url).then((r) => r.data),
    ...options,
  });
}

export function usePost<TData, TResult>(url: string, invalidateKeys?: unknown[][]) {
  const qc = useQueryClient();
  return useMutation<TResult, Error, TData>({
    mutationFn: (data) => api.post<TResult>(url, data).then((r) => r.data),
    onSuccess: () => {
      invalidateKeys?.forEach((k) => qc.invalidateQueries({ queryKey: k }));
    },
  });
}

export function usePatch<TData, TResult>(invalidateKeys?: unknown[][]) {
  const qc = useQueryClient();
  return useMutation<TResult, Error, { url: string; data: TData }>({
    mutationFn: ({ url, data }) => api.patch<TResult>(url, data).then((r) => r.data),
    onSuccess: () => {
      invalidateKeys?.forEach((k) => qc.invalidateQueries({ queryKey: k }));
    },
  });
}

// ─── Domain hooks ─────────────────────────────────────────────────────────────
export function useQuotations(page = 1) {
  return useGet(['quotations', page], `/api/v1/quotations?page=${page}`);
}

export function useQuotation(id: string) {
  return useGet(['quotations', id], `/api/v1/quotations/${id}`, { enabled: !!id });
}

export function useSolarSystems(page = 1) {
  return useGet(['systems', page], `/api/v1/solar-systems?page=${page}`);
}

export function useSolarSystem(id: string) {
  return useGet(['systems', id], `/api/v1/solar-systems/${id}`, { enabled: !!id });
}

export function useDevices(systemId?: string) {
  const url = systemId ? `/api/v1/devices?systemId=${systemId}` : '/api/v1/devices';
  return useGet(['devices', systemId], url);
}

export function useDevice(id: string) {
  return useGet(['devices', id], `/api/v1/devices/${id}`, { enabled: !!id });
}

export function useIotConnectionInfo() {
  return useGet<{
    enabled: boolean;
    brokerUrl: string;
    username: string | null;
    topicPrefix: string;
    qos: number;
    note: string;
  }>(['iot', 'connection-info'], '/api/v1/iot/connection-info');
}

export type IotOverview = {
  totals: {
    total: number;
    online: number;
    warning: number;
    offline: number;
    avgHealthScore: number;
  };
  supportedHardware: string[];
  devices: Array<{
    id: string;
    name: string;
    type: string;
    status: string;
    serialNumber: string;
    firmware: string;
    mqttClientId: string;
    lastSeenAt?: string;
    location?: { latitude?: number; longitude?: number };
    healthScore: number;
    latestMetrics: {
      powerOutputW: number;
      loadPowerW: number;
      batteryStateOfCharge: number | null;
      gridPowerW: number;
      irradianceWm2: number | null;
      temperatureCelsius: number | null;
    };
  }>;
  alerts: Array<{
    id: string;
    title: string;
    body: string;
    event: string;
    createdAt?: string;
  }>;
};

export function useIotOverview(hours = 24) {
  return useGet<IotOverview>(
    ['devices', 'iot-overview', hours],
    `/api/v1/devices/iot/overview?hours=${hours}`,
    { refetchInterval: 10_000 },
  );
}

export function useInstallers(params?: { city?: string; minRating?: number; page?: number }) {
  const q = new URLSearchParams();
  if (params?.city) q.set('city', params.city);
  if (params?.minRating != null) q.set('minRating', String(params.minRating));
  if (params?.page != null) q.set('page', String(params.page));
  const qs = q.toString();
  return useGet(['installers', params], `/api/v1/installers${qs ? `?${qs}` : ''}`);
}

export function useMaintenanceTickets(params?: { status?: string; page?: number }) {
  const q = new URLSearchParams(params as Record<string, string>).toString();
  return useGet(['maintenance', params], `/api/v1/maintenance?${q}`);
}

export function useMaintenanceStats() {
  return useGet<{
    statusStats: Array<{ _id: string; count: number }>;
    priorityStats: Array<{ _id: string; count: number }>;
    slaBreached: number;
    remindersDue: number;
  }>(['maintenance', 'stats'], '/api/v1/maintenance/stats');
}

export function useFaultPredictions() {
  return useGet<Array<{
    solarSystemId: string;
    riskScore: number;
    severity: 'low' | 'medium' | 'high';
    reasons: string[];
    recommendation: string;
  }>>(['maintenance', 'fault-predictions'], '/api/v1/maintenance/fault-predictions');
}

export function usePartsInventory() {
  return useGet<Array<{
    part: string;
    totalQty: number;
    avgUnitCost: number;
    neededCount: number;
  }>>(['maintenance', 'parts'], '/api/v1/maintenance/parts/inventory');
}

export function useTechnicianMobileFeed() {
  return useGet<Array<{
    id: string;
    workOrderNo: string;
    title: string;
    priority: string;
    status: string;
    scheduledAt?: string;
    dispatchEta?: string;
    photos: number;
    checklist: Array<{ key: string; label: string; done: boolean }>;
  }>>(['maintenance', 'mobile'], '/api/v1/maintenance/mobile/technician');
}

export function useInvoices(params?: { status?: string; page?: number }) {
  const q = new URLSearchParams();
  if (params?.status) q.set('status', params.status);
  if (params?.page != null) q.set('page', String(params.page));
  const qs = q.toString();
  return useGet(['invoices', params], `/api/v1/billing/invoices${qs ? `?${qs}` : ''}`);
}

export function useSubscriptions() {
  return useGet<Array<{
    _id: string;
    invoiceNumber: string;
    total: number;
    status: string;
    subscription?: { planName: string; interval: string; nextBillingDate?: string };
  }>>(['billing', 'subscriptions'], '/api/v1/billing/subscriptions');
}

export function useFinancingApplications(status?: string) {
  const q = status ? `?status=${encodeURIComponent(status)}` : '';
  return useGet<Array<{
    _id: string;
    referenceNo: string;
    provider: string;
    amount: number;
    termMonths: number;
    annualRate: number;
    status: string;
    createdAt?: string;
  }>>(['billing', 'financing', status ?? 'all'], `/api/v1/billing/financing${q}`);
}

export function useFinancialReport() {
  return useGet<{
    generatedAt: string;
    dueDateTracking: Array<{ _id: string; total: number; count: number }>;
    subscriptions: number;
    installmentPlans: number;
    financingApplications: number;
    commissions: Array<{ _id: string; total: number; count: number }>;
    revenue: {
      thisMonth?: { total: number; count: number };
      thisYear?: { total: number; count: number };
      outstanding?: { total: number; count: number };
      monthlyTrend?: Array<{ _id: string; revenue: number }>;
      remindersDue?: number;
      commissionSummary?: Array<{ _id: string; total: number; count: number }>;
    };
    integrations: {
      stripe: boolean;
      paypal: boolean;
      localPH: string[];
      bankFinancing: string[];
    };
  }>(['billing', 'financial-report'], '/api/v1/billing/financial-report');
}

export function useNotifications(page = 1) {
  return useGet<{
    data: Array<{
      _id: string;
      title: string;
      body: string;
      createdAt?: string;
      event: string;
      channel: 'email' | 'sms' | 'push' | 'in_app';
      isRead: boolean;
    }>;
    unreadCount: number;
    total: number;
    limit: number;
  }>(
    ['notifications', page],
    `/api/v1/notifications?page=${page}`,
  );
}

export function useNotificationPreferences() {
  return useGet<{
    channels: { email: boolean; sms: boolean; push: boolean; in_app: boolean };
    events: {
      fault_alert: boolean;
      maintenance_reminder: boolean;
      billing_notification: boolean;
      proposal_approval: boolean;
      energy_anomaly: boolean;
    };
  }>(['notifications', 'preferences'], '/api/v1/notifications/preferences/me');
}

export type AnalyticsDashboard = {
  systems?: { total: number; active: number; totalKw: number };
  revenue?: Array<{ _id: string; revenue: number; count?: number }>;
  monthlyProduction?: Array<{ _id: string; production: number }>;
  live?: { powerOutputW?: number; energyTodayKwh?: number; batterySoc?: number };
};

export type EnergyReport = {
  totalKwh?: number;
  peakKw?: number;
  performanceRatio?: number;
  daily?: Array<{ _id: string; energyKwh?: number }>;
};

export type CarbonReport = {
  co2SavedKg?: number;
  monthly?: Array<{ month: string; avoided: number }>;
};

export type AiMonitoring = {
  liveEnergyFlow: {
    solarProductionW: number;
    loadDemandW: number;
    gridImportW: number;
    batteryChargeW: number;
    updatedAt: string;
  };
  anomalies: Array<{
    type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    value?: number;
    threshold?: number;
    at?: string;
  }>;
  inverterFaultsDetected: number;
  abnormalConsumptionDetected: boolean;
  consumptionPrediction: {
    next24hKwh: number;
    hourlyTrend: Array<{ hour: number; avgLoadW: number }>;
  };
  peakDemandAnalysis: { peakDemandW: number; peakHour: number };
  smartRecommendations: string[];
  efficiencyScoring: { score: number; grade: string };
  weatherCorrelation: { coefficient: number; summary: string };
  maintenancePrediction: { riskScore: number; level: string };
  forecastSavings: { next30DaysPhp: number; basedOnDailyKwh: number };
  dashboardTrackers: {
    savingsTracker: { totalKwh: number; estimatedPhp: number };
    carbonReductionTracker: { totalKg: number; treesEquivalent: number };
  };
};

export type AdminAnalytics = {
  totalUsers?: number;
  totalOrgs?: number;
  activeSystems?: number;
  revenue?: number;
  pendingVerifications?: number;
  openAlerts?: number;
  userGrowth?: Array<{ month: string; users: number }>;
  revenueByPlan?: Array<{ plan: string; revenue: number }>;
  recentActivity?: Array<{ type: string; message: string; time: string }>;
  deviceMonitoring?: {
    total: number;
    online: number;
    warning: number;
    offline: number;
    maintenance: number;
  };
  marketplaceManagement?: {
    openLeads: number;
    biddingLeads: number;
    awardedLeads: number;
    bookings: number;
    escrowValue: number;
  };
  aiInsights?: {
    signalCounts: Array<{ event: string; count: number }>;
    topSignal: string | null;
  };
  auditLogs?: Array<{
    action: string;
    category: string;
    severity: 'low' | 'medium' | 'high';
    time: string;
  }>;
  platformSettings?: {
    maintenanceMode: boolean;
    aiAssistantEnabled: boolean;
    mqttEnabled: boolean;
    paymentGateways: string[];
    locale: string;
  };
  realtimeMetrics?: {
    telemetryPointsLastHour: number;
    organizationsActiveLast24h: number;
    apiStatus: string;
  };
};

export type TelemetryLatest = {
  metrics?: {
    powerOutputW?: number;
    loadPowerW?: number;
    gridPowerW?: number;
    energyTodayKwh?: number;
    frequencyHz?: number;
    temperatureCelsius?: number;
    batteryStateOfCharge?: number;
    batteryLevelPercent?: number;
    irradianceWm2?: number;
  };
};

export type SmartCitySummary = {
  totalSystems?: number;
  totalCapacityKw?: number;
  newThisMonth?: number;
  estimatedAnnualMwh?: number;
  co2AvoidedTonsPerYear?: number;
};

export type ProvinceStat = {
  _id?: string;
  count?: number;
  capacityKw?: number;
  cities?: string[];
  co2TonsPerYear?: number;
};

export type SmartCityOverview = {
  totalInstallations: number;
  totalCapacityKw: number;
  totalCo2SavedKg: number;
  treesEquivalent: number;
  byCity: Array<{
    city: string;
    count: number;
    capacityKw: number;
    avgLat: number;
    avgLng: number;
  }>;
  geoJson: GeoJSON.FeatureCollection;
};

export type SmartCityHeatPoint = { lat: number; lng: number; weight: number };

export type SmartCityAdvancedAnalytics = {
  cityWideMonitoring: {
    systems: number;
    totalCapacityKw: number;
    monitoredCities: number;
  };
  byBarangay: Array<{
    name: string;
    avgDemandKw: number;
    outageEvents: number;
    systems: number;
  }>;
  publicFacilities: Array<{
    type: string;
    count: number;
    capacityKw: number;
    productionKwh: number;
  }>;
  renewableStats: {
    totalProductionKwh: number;
    solarAdoptionRate: number;
    carbonAvoidedKg: number;
  };
  carbonAnalytics: {
    annualEquivalentTons: number;
    treesEquivalent: number;
  };
  gridUtilization: {
    percentFromGrid: number;
    estimatedDemandKwh: number;
  };
  outageTracking: {
    outageEvents: number;
    impactedBarangays: number;
  };
  evChargingAnalytics: {
    chargingSites: number;
    sessionsEstimate: number;
    energyKwh: number;
  };
  targetSegments: string[];
};

export type ClientDashboard = {
  profile: { firstName?: string; lastName?: string; email?: string };
  primarySystem: {
    id: string;
    name: string;
    systemSizeKw: number;
    status: string;
    city?: string;
  } | null;
  systems: Array<{ id: string; name: string; systemSizeKw: number; status: string }>;
  live: {
    solarProductionW: number;
    loadDemandW: number;
    gridImportW: number;
    batteryChargeW: number;
    energyTodayKwh: number;
    batterySoc: number | null;
    updatedAt: string;
    deviceName?: string;
  };
  todayHourly: Array<{ hour: number; productionW: number; consumptionW: number }>;
  battery: { stateOfCharge: number | null; status: string; charging: boolean };
  billing: {
    openCount: number;
    totalDue: number;
    recent: Array<{
      id: string;
      invoiceNumber: string;
      status: string;
      total: number;
      dueDate?: string;
      paidAt?: string;
    }>;
  };
  maintenance: {
    openCount: number;
    recent: Array<{
      id: string;
      workOrderNo: string;
      title: string;
      status: string;
      priority: string;
      type: string;
      scheduledAt?: string;
    }>;
  };
  proposals: Array<{
    id: string;
    status: string;
    systemSizeKw?: number;
    totalCost?: number;
    monthlyBill?: number;
    createdAt?: string;
    updatedAt?: string;
  }>;
  documents: Array<{
    id: string;
    title: string;
    type: string;
    createdAt?: string;
    href: string;
  }>;
  notifications: {
    unreadCount: number;
    recent: Array<{
      id: string;
      title: string;
      body: string;
      event: string;
      read: boolean;
      createdAt?: string;
    }>;
  };
  monthlyReports: Array<{
    month: string;
    label: string;
    productionKwh: number;
    consumptionKwh: number;
    savingsPhp: number;
    co2Kg: number;
  }>;
  aiRecommendations: string[];
  aiSummary: {
    efficiencyScore: number;
    efficiencyGrade: string;
    next24hConsumptionKwh: number;
    maintenanceRisk: { riskScore: number; level: string };
    forecastSavingsPhp: number;
  } | null;
  trackers: {
    savingsTracker: { totalKwh: number; estimatedPhp: number };
    carbonReductionTracker: { totalKg: number; treesEquivalent: number };
  };
  peakDemand: { peakDemandW: number; peakHour: number } | null;
};

export function useClientDashboard() {
  return useGet<ClientDashboard>(
    ['clients', 'me', 'dashboard'],
    '/api/v1/clients/me/dashboard',
    { refetchInterval: 12_000 },
  );
}

export function useAnalyticsDashboard() {
  return useGet<AnalyticsDashboard>(['analytics', 'dashboard'], '/api/v1/analytics/dashboard');
}

export function useEnergyReport(range: string) {
  return useGet<EnergyReport>(['analytics', 'energy-report', range], `/api/v1/analytics/energy-report?range=${range}`);
}

export function useCarbonReport(range: string) {
  return useGet<CarbonReport>(['analytics', 'carbon', range], `/api/v1/analytics/carbon?range=${range}`);
}

export function useHourlyProfile(range: string) {
  return useGet<Array<{ _id: number; power?: number }>>(
    ['analytics', 'hourly-profile', range],
    `/api/v1/analytics/hourly-profile?range=${range}`,
  );
}

export function useAiMonitoring(days = 30) {
  return useGet<AiMonitoring>(
    ['analytics', 'ai-monitoring', days],
    `/api/v1/analytics/ai-monitoring?days=${days}`,
    { refetchInterval: 15_000 },
  );
}

export function useInstallerPerformanceReport() {
  return useGet<Array<{
    _id: null;
    avgSystemSize?: number;
    totalInstalled?: number;
    byStatus?: string[];
    totalCapacityKw?: number;
  }>>(['analytics', 'installer-performance'], '/api/v1/analytics/installer-performance');
}

export function useTodayHourly() {
  return useGet<Array<{ _id: number; production?: number; consumption?: number }>>(
    ['analytics', 'today-hourly'],
    '/api/v1/analytics/today-hourly',
  );
}

export function useAdminAnalytics() {
  return useGet<AdminAnalytics>(
    ['analytics', 'admin'],
    '/api/v1/analytics/admin',
    { refetchInterval: 10_000 },
  );
}

export function useSmartCitySummary() {
  return useGet<SmartCitySummary>(['smart-city', 'summary-cards'], '/api/v1/smart-city/summary-cards');
}

export function useSmartCityProvinces() {
  return useGet<ProvinceStat[]>(['smart-city', 'province-stats'], '/api/v1/smart-city/province-stats');
}

export function useSmartCityOverview(province?: string) {
  const q = province ? `?province=${encodeURIComponent(province)}` : '';
  return useGet<SmartCityOverview>(
    ['smart-city', 'overview', province ?? 'all'],
    `/api/v1/smart-city/overview${q}`,
  );
}

export function useSmartCityHeatmap(province?: string) {
  const q = province ? `?province=${encodeURIComponent(province)}` : '';
  return useGet<SmartCityHeatPoint[]>(
    ['smart-city', 'heatmap', province ?? 'all'],
    `/api/v1/smart-city/heatmap${q}`,
  );
}

export function useSmartCityAdvancedAnalytics(province?: string) {
  const q = province ? `?province=${encodeURIComponent(province)}` : '';
  return useGet<SmartCityAdvancedAnalytics>(
    ['smart-city', 'advanced-analytics', province ?? 'all'],
    `/api/v1/smart-city/advanced-analytics${q}`,
  );
}

export function useRevenueStats() {
  return useGet<{
    thisYear?: { total: number };
    outstanding?: { total: number };
  }>(['billing', 'revenue-stats'], '/api/v1/billing/revenue-stats');
}

export function useTelemetryLatest(deviceId: string) {
  return useGet<TelemetryLatest>(
    ['telemetry', 'latest', deviceId],
    `/api/v1/telemetry/devices/${deviceId}/latest`,
    { enabled: !!deviceId, refetchInterval: 5000 },
  );
}

export function useEfficiencyScore(deviceId: string) {
  return useGet(
    ['ai', 'efficiency', deviceId],
    `/api/v1/ai/efficiency/${deviceId}`,
    { enabled: !!deviceId },
  );
}

// ─── Marketplace ──────────────────────────────────────────────────────────────
export function useInstaller(id: string) {
  return useGet(['installers', id], `/api/v1/installers/${id}`, { enabled: !!id });
}

export function useInstallerAnalytics(installerId: string) {
  return useGet(
    ['marketplace', 'analytics', installerId],
    `/api/v1/marketplace/installers/${installerId}/analytics`,
    { enabled: !!installerId },
  );
}

export function useInstallerAvailability(installerId: string) {
  return useGet(
    ['marketplace', 'availability', installerId],
    `/api/v1/marketplace/installers/${installerId}/availability`,
    { enabled: !!installerId },
  );
}

export function useMarketplaceLeads(page = 1) {
  return useGet(['marketplace', 'leads', page], `/api/v1/marketplace/leads?page=${page}`);
}

export function useMarketplaceLead(id: string) {
  return useGet(['marketplace', 'leads', id], `/api/v1/marketplace/leads/${id}`, { enabled: !!id });
}

export function useLeadBids(leadId: string) {
  return useGet(
    ['marketplace', 'leads', leadId, 'bids'],
    `/api/v1/marketplace/leads/${leadId}/bids`,
    { enabled: !!leadId },
  );
}

export function useLeadMessages(leadId: string) {
  return useGet(
    ['marketplace', 'leads', leadId, 'messages'],
    `/api/v1/marketplace/leads/${leadId}/messages`,
    { enabled: !!leadId, refetchInterval: 8000 },
  );
}

export function useMarketplaceBookings() {
  return useGet(['marketplace', 'bookings'], '/api/v1/marketplace/bookings');
}
