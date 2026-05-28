'use client';

import { useMemo, useState } from 'react';
import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';
import {
  useCarbonReport,
  useEnergyReport,
  useFinancialReport,
  useInstallerPerformanceReport,
  useMaintenanceStats,
} from '@/hooks/use-api';
import { PageContainer } from '@/components/layout/page-container';
import {
  FileBarChart2,
  Download,
  Loader2,
  Leaf,
  Zap,
  Wrench,
  HandCoins,
  HardHat,
} from 'lucide-react';
import { formatCurrency, formatNumber } from '@/lib/utils';

type ReportKey = 'energy' | 'financial' | 'maintenance' | 'carbon' | 'installer';
type ExportFormat = 'pdf' | 'excel' | 'csv';

function toCsv(rows: Array<Record<string, unknown>>) {
  if (!rows.length) return '';
  const headers = Object.keys(rows[0]);
  const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  return [headers.join(','), ...rows.map((r) => headers.map((h) => esc(r[h])).join(','))].join('\n');
}

function downloadBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function ReportsPage() {
  const [range, setRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [exporting, setExporting] = useState<ReportKey | null>(null);

  const { data: energy, isLoading: loadingEnergy } = useEnergyReport(range);
  const { data: carbon, isLoading: loadingCarbon } = useCarbonReport(range);
  const { data: maintenance, isLoading: loadingMaint } = useMaintenanceStats();
  const { data: financial, isLoading: loadingFinancial } = useFinancialReport();
  const { data: installer, isLoading: loadingInstaller } = useInstallerPerformanceReport();

  const reportRows = useMemo(() => {
    const energyRows = (energy?.daily ?? []).map((d: any) => ({
      date: d._id,
      energyKwh: Math.round(d.energyKwh ?? 0),
      peakPowerW: Math.round(d.peakPowerW ?? 0),
    }));
    const financialRows = (financial?.revenue?.monthlyTrend ?? []).map((r: any) => ({
      month: r._id,
      revenuePhp: Math.round(r.revenue ?? 0),
    }));
    const maintenanceRows = [
      ...(maintenance?.statusStats ?? []).map((s) => ({ type: 'status', bucket: s._id, count: s.count })),
      ...(maintenance?.priorityStats ?? []).map((p) => ({ type: 'priority', bucket: p._id, count: p.count })),
      { type: 'sla', bucket: 'breached', count: maintenance?.slaBreached ?? 0 },
    ];
    const carbonRows = (carbon?.monthly ?? []).map((m) => ({
      month: m.month,
      avoidedKg: Math.round(m.avoided ?? 0),
    }));
    const installerRow = installer?.[0]
      ? [{
          avgSystemSizeKw: Number((installer[0].avgSystemSize ?? 0).toFixed(2)),
          totalInstalled: installer[0].totalInstalled ?? 0,
          totalCapacityKw: Math.round(installer[0].totalCapacityKw ?? 0),
        }]
      : [];

    return {
      energy: energyRows,
      financial: financialRows,
      maintenance: maintenanceRows,
      carbon: carbonRows,
      installer: installerRow,
    } as const;
  }, [energy, financial, maintenance, carbon, installer]);

  async function exportReport(key: ReportKey, format: ExportFormat) {
    setExporting(key);
    try {
      const rows = reportRows[key];
      const dateTag = new Date().toISOString().slice(0, 10);
      const base = `${key}-report-${dateTag}`;

      if (format === 'csv') {
        const csv = toCsv(rows as Array<Record<string, unknown>>);
        downloadBlob(`${base}.csv`, new Blob([csv], { type: 'text/csv;charset=utf-8' }));
        return;
      }

      if (format === 'excel') {
        const ws = XLSX.utils.json_to_sheet(rows as Array<Record<string, unknown>>);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Report');
        XLSX.writeFile(wb, `${base}.xlsx`);
        return;
      }

      const doc = new jsPDF();
      doc.setFontSize(14);
      doc.text(`${key.toUpperCase()} REPORT`, 14, 16);
      doc.setFontSize(10);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 24);
      let y = 34;
      const lines = (rows as Array<Record<string, unknown>>)
        .slice(0, 40)
        .map((r) => Object.entries(r).map(([k, v]) => `${k}: ${v}`).join(' | '));
      for (const line of lines) {
        doc.text(line, 14, y);
        y += 6;
        if (y > 280) {
          doc.addPage();
          y = 20;
        }
      }
      doc.save(`${base}.pdf`);
    } finally {
      setExporting(null);
    }
  }

  const cards = [
    {
      key: 'energy' as const,
      title: 'Energy Reports',
      desc: 'Generation, daily output, and peak power trends',
      icon: Zap,
      value: energy?.totalKwh != null ? `${Math.round(energy.totalKwh)} kWh` : '—',
      loading: loadingEnergy,
    },
    {
      key: 'financial' as const,
      title: 'Financial Reports',
      desc: 'Revenue trend, due tracking, and gateway health',
      icon: HandCoins,
      value: financial?.revenue?.thisYear?.total != null ? formatCurrency(financial.revenue.thisYear.total) : '—',
      loading: loadingFinancial,
    },
    {
      key: 'maintenance' as const,
      title: 'Maintenance Reports',
      desc: 'SLA breaches, status distribution, and priorities',
      icon: Wrench,
      value: maintenance?.slaBreached != null ? `${maintenance.slaBreached} SLA breached` : '—',
      loading: loadingMaint,
    },
    {
      key: 'carbon' as const,
      title: 'Carbon Reduction Reports',
      desc: 'CO₂ avoided and monthly sustainability impact',
      icon: Leaf,
      value: carbon?.co2SavedKg != null ? `${Math.round(carbon.co2SavedKg).toLocaleString()} kg` : '—',
      loading: loadingCarbon,
    },
    {
      key: 'installer' as const,
      title: 'Installer Performance Reports',
      desc: 'Install velocity, average size, and portfolio growth',
      icon: HardHat,
      value: installer?.[0]?.totalInstalled != null ? `${installer[0].totalInstalled} installs` : '—',
      loading: loadingInstaller,
    },
  ];

  return (
    <PageContainer>
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileBarChart2 className="w-6 h-6 text-solar-500" /> Reports & Analytics
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Generate operational reports and export as PDF, Excel, or CSV
          </p>
        </div>
        <div className="flex items-center gap-2 bg-accent rounded-lg p-1">
          {(['7d', '30d', '90d', '1y'] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRange(r)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${range === r ? 'bg-solar-500 text-white' : 'hover:bg-accent/80'}`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {cards.map((card) => (
          <div key={card.key} className="panel-card p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <card.icon className="w-4 h-4 text-solar-500" />
                  <h3 className="font-semibold">{card.title}</h3>
                </div>
                <p className="text-sm text-muted-foreground mt-1">{card.desc}</p>
                <p className="text-lg font-bold mt-3">{card.loading ? 'Loading…' : card.value}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-4">
              {(['pdf', 'excel', 'csv'] as const).map((format) => (
                <button
                  key={format}
                  type="button"
                  disabled={exporting === card.key}
                  onClick={() => exportReport(card.key, format)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs hover:bg-accent disabled:opacity-50"
                >
                  {exporting === card.key ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                  {format.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="panel-card p-5">
        <h3 className="font-semibold mb-3">Report Snapshot</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
          <div className="rounded-lg bg-accent/40 p-3">
            <p className="text-xs text-muted-foreground">Energy total ({range})</p>
            <p className="font-bold mt-1">{energy?.totalKwh != null ? `${Math.round(energy.totalKwh)} kWh` : '—'}</p>
          </div>
          <div className="rounded-lg bg-accent/40 p-3">
            <p className="text-xs text-muted-foreground">Outstanding finance</p>
            <p className="font-bold mt-1">
              {financial?.revenue?.outstanding?.total != null
                ? formatCurrency(financial.revenue.outstanding.total)
                : '—'}
            </p>
          </div>
          <div className="rounded-lg bg-accent/40 p-3">
            <p className="text-xs text-muted-foreground">Installer avg size</p>
            <p className="font-bold mt-1">
              {installer?.[0]?.avgSystemSize != null ? `${Number(installer[0].avgSystemSize).toFixed(2)} kW` : '—'}
            </p>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}

