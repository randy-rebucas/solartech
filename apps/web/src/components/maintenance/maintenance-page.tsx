'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Wrench, AlertTriangle, Clock, CheckCircle2, Plus,
  ChevronRight, User, Calendar, ClipboardList, ShieldAlert, BellRing,
  Camera, Smartphone, Package, Sparkles,
} from 'lucide-react';
import {
  useMaintenanceTickets, useMaintenanceStats, useFaultPredictions, usePartsInventory,
  useTechnicianMobileFeed, usePatch,
} from '@/hooks/use-api';
import { formatDate, cn } from '@/lib/utils';
import { CreateTicketModal } from './create-ticket-modal';
import { PageContainer } from '@/components/layout/page-container';
import api from '@/lib/api';

const PRIORITY_CONFIG = {
  critical: { color: 'text-red-500',    bg: 'bg-red-500/10',    label: 'Critical' },
  high:     { color: 'text-orange-500', bg: 'bg-orange-500/10', label: 'High' },
  medium:   { color: 'text-yellow-500', bg: 'bg-yellow-500/10', label: 'Medium' },
  low:      { color: 'text-blue-400',   bg: 'bg-blue-400/10',   label: 'Low' },
} as const;

const STATUS_CONFIG = {
  open:          { color: 'text-red-500',          icon: AlertTriangle, label: 'Open' },
  assigned:      { color: 'text-yellow-500',        icon: User,          label: 'Assigned' },
  in_progress:   { color: 'text-energy-400',        icon: Wrench,        label: 'In Progress' },
  pending_parts: { color: 'text-orange-400',        icon: Clock,         label: 'Pending Parts' },
  resolved:      { color: 'text-solar-500',         icon: CheckCircle2,  label: 'Resolved' },
  closed:        { color: 'text-muted-foreground',  icon: CheckCircle2,  label: 'Closed' },
} as const;

const STATUS_TABS = ['all', 'open', 'assigned', 'in_progress', 'resolved'];

export function MaintenancePage() {
  const [showCreate, setShowCreate] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [mobileMode, setMobileMode] = useState(false);
  const { data, isLoading } = useMaintenanceTickets({ status: activeTab === 'all' ? undefined : activeTab });
  const { data: stats } = useMaintenanceStats();
  const { data: predictions } = useFaultPredictions();
  const { data: parts } = usePartsInventory();
  const { data: mobileFeed } = useTechnicianMobileFeed();
  const dispatchTicket = usePatch<{ assignedTechnicianId: string; eta?: string; routeNote?: string }, unknown>([['maintenance']]);
  const tickets: any[] = (data as any)?.data ?? [];
  const statRows = (stats as any)?.statusStats ?? [];
  const slaBreached = (stats as any)?.slaBreached ?? 0;
  const remindersDue = (stats as any)?.remindersDue ?? 0;
  const predictionRows: any[] = (predictions as any) ?? [];
  const partRows: any[] = (parts as any) ?? [];
  const mobileRows: any[] = (mobileFeed as any) ?? [];

  async function quickReminder(ticketId: string) {
    await api.post(`/api/v1/maintenance/${ticketId}/reminders`, {
      title: 'Client follow-up reminder',
      remindAt: new Date(Date.now() + 24 * 3600_000).toISOString(),
    });
  }

  async function quickDispatch(ticketId: string, assignedTechnicianId?: string) {
    if (!assignedTechnicianId) return;
    await dispatchTicket.mutateAsync({
      url: `/api/v1/maintenance/${ticketId}/dispatch`,
      data: {
        assignedTechnicianId,
        eta: new Date(Date.now() + 2 * 3600_000).toISOString(),
        routeNote: 'Auto-dispatch update from CRM.',
      },
    });
  }

  async function quickCommunicate(ticketId: string) {
    await api.post(`/api/v1/maintenance/${ticketId}/communicate`, {
      channel: 'in_app',
      message: 'Update: technician en route. Please keep site access available.',
    });
  }

  async function quickPart(ticketId: string) {
    await api.post(`/api/v1/maintenance/${ticketId}/parts`, {
      name: 'MC4 Connector Pair',
      quantity: 2,
      unitCost: 180,
      status: 'needed',
    });
  }

  return (
    <PageContainer>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Maintenance CRM</h1>
          <p className="text-sm text-muted-foreground">
            Tickets, scheduling, dispatch, SLA, parts, lifecycle, client comms, AI predictions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMobileMode((m) => !m)}
            className={cn(
              'flex items-center gap-2 px-3 py-2 rounded-lg border text-sm',
              mobileMode ? 'border-solar-500 text-solar-500 bg-solar-500/10' : 'border-border hover:bg-accent',
            )}
          >
            <Smartphone className="w-4 h-4" /> Mobile Tech UI
          </button>
          <button onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-solar text-white text-sm font-medium hover:opacity-90 shadow-glow">
            <Plus className="w-4 h-4" /> New Ticket
          </button>
        </div>
      </div>

      {/* Status tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {STATUS_TABS.map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={cn('px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap capitalize transition-all',
              activeTab === tab ? 'bg-solar-500/20 text-solar-500' : 'bg-accent text-muted-foreground hover:text-foreground')}>
            {tab.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Open',       count: tickets.filter((t) => t.status === 'open').length,        color: 'text-red-500' },
          { label: 'In Progress',count: tickets.filter((t) => t.status === 'in_progress').length, color: 'text-energy-400' },
          { label: 'Resolved',   count: tickets.filter((t) => t.status === 'resolved').length,    color: 'text-solar-500' },
          { label: 'Critical',   count: tickets.filter((t) => t.priority === 'critical').length,  color: 'text-red-500' },
        ].map((s) => (
          <div key={s.label} className="stat-card">
            <p className={`text-2xl font-bold ${s.color}`}>{s.count}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="panel-card p-4">
          <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
            <ShieldAlert className="w-4 h-4 text-red-500" /> SLA tracking
          </h3>
          <p className="text-2xl font-bold text-red-500">{slaBreached}</p>
          <p className="text-xs text-muted-foreground">Breached active tickets</p>
          <div className="mt-3 space-y-1 text-xs">
            {statRows.slice(0, 4).map((s: any) => (
              <div key={s._id} className="flex justify-between">
                <span className="capitalize text-muted-foreground">{String(s._id).replace('_', ' ')}</span>
                <span>{s.count}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="panel-card p-4">
          <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
            <BellRing className="w-4 h-4 text-yellow-500" /> Maintenance reminders
          </h3>
          <p className="text-2xl font-bold text-yellow-500">{remindersDue}</p>
          <p className="text-xs text-muted-foreground">Due reminders to send</p>
          <p className="text-xs mt-3 text-muted-foreground">
            Use ticket actions to add client reminders for preventive schedules and SLA updates.
          </p>
        </div>
        <div className="panel-card p-4">
          <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
            <Package className="w-4 h-4 text-blue-400" /> Parts inventory
          </h3>
          <div className="space-y-1 text-xs">
            {partRows.slice(0, 5).map((p: any) => (
              <div key={p.part} className="flex justify-between">
                <span className="truncate max-w-[60%]">{p.part}</span>
                <span>{p.totalQty} pcs · {p.neededCount} needed</span>
              </div>
            ))}
            {partRows.length === 0 && <p className="text-muted-foreground">No parts usage recorded yet.</p>}
          </div>
        </div>
      </div>

      <div className="panel-card p-4">
        <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-purple-400" /> AI fault prediction
        </h3>
        <div className="grid md:grid-cols-2 gap-3">
          {predictionRows.slice(0, 4).map((p: any) => (
            <div key={p.solarSystemId} className="rounded-lg bg-accent/50 p-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">System {String(p.solarSystemId).slice(-6)}</p>
                <span className={cn(
                  'text-xs px-2 py-0.5 rounded-full',
                  p.severity === 'high' ? 'bg-red-500/20 text-red-500' : p.severity === 'medium' ? 'bg-yellow-500/20 text-yellow-500' : 'bg-solar-500/20 text-solar-500',
                )}>
                  {p.riskScore}% {p.severity}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">{p.reasons?.[0] ?? 'No reason available'}</p>
              <p className="text-xs mt-2">{p.recommendation}</p>
            </div>
          ))}
          {predictionRows.length === 0 && (
            <p className="text-sm text-muted-foreground">No elevated risk signals detected right now.</p>
          )}
        </div>
      </div>

      {/* Ticket list */}
      <div className="panel-card overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground text-sm">Loading tickets…</div>
        ) : tickets.length === 0 ? (
          <div className="p-12 text-center">
            <Wrench className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-40" />
            <p className="font-medium">No tickets found</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {tickets.map((ticket) => {
              const pri = PRIORITY_CONFIG[ticket.priority as keyof typeof PRIORITY_CONFIG] ?? PRIORITY_CONFIG.medium;
              const sts = STATUS_CONFIG[ticket.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.open;
              const StatusIcon = sts.icon;
              return (
                <motion.div key={ticket._id}
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="p-4 flex items-start gap-4 hover:bg-accent/30 transition-colors cursor-pointer group">
                  <div className={cn('p-2 rounded-lg flex-shrink-0', pri.bg)}>
                    <Wrench className={cn('w-4 h-4', pri.color)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-medium truncate">{ticket.title}</h3>
                      <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0', pri.bg, pri.color)}>{pri.label}</span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{ticket.description}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{formatDate(ticket.createdAt)}</span>
                      {ticket.workOrderNo && (
                        <span className="flex items-center gap-1"><ClipboardList className="w-3 h-3" />{ticket.workOrderNo}</span>
                      )}
                      {ticket.assignedTechnicianId && (
                        <span className="flex items-center gap-1"><User className="w-3 h-3" />{ticket.assignedTechnicianId.firstName} {ticket.assignedTechnicianId.lastName}</span>
                      )}
                      <span className="flex items-center gap-1"><Camera className="w-3 h-3" />{ticket.images?.length ?? 0} photos</span>
                    </div>
                    <div className="flex gap-2 mt-2">
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); void quickReminder(ticket._id); }}
                        className="text-[11px] px-2 py-1 rounded border border-border hover:bg-accent"
                      >
                        Add reminder
                      </button>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); void quickDispatch(ticket._id, ticket.assignedTechnicianId?._id); }}
                        disabled={!ticket.assignedTechnicianId?._id}
                        className="text-[11px] px-2 py-1 rounded border border-border hover:bg-accent"
                      >
                        Dispatch
                      </button>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); void quickPart(ticket._id); }}
                        className="text-[11px] px-2 py-1 rounded border border-border hover:bg-accent"
                      >
                        Add part
                      </button>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); void quickCommunicate(ticket._id); }}
                        className="text-[11px] px-2 py-1 rounded border border-border hover:bg-accent"
                      >
                        Notify client
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={cn('flex items-center gap-1 text-xs font-medium', sts.color)}>
                      <StatusIcon className="w-3 h-3" />{sts.label}
                    </span>
                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {mobileMode && (
        <div className="panel-card p-4">
          <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
            <Smartphone className="w-4 h-4 text-solar-500" /> Mobile technician app UI
          </h3>
          <div className="space-y-2">
            {mobileRows.slice(0, 6).map((row: any) => (
              <div key={row.id} className="rounded-xl border border-border bg-background p-3">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs text-muted-foreground">{row.workOrderNo}</p>
                    <p className="text-sm font-medium">{row.title}</p>
                  </div>
                  <span className="text-xs capitalize text-muted-foreground">{row.status?.replace('_', ' ')}</span>
                </div>
                <div className="mt-2 grid grid-cols-3 gap-1 text-[11px]">
                  {(row.checklist ?? []).map((c: any) => (
                    <span key={c.key} className={cn('px-2 py-1 rounded text-center', c.done ? 'bg-solar-500/20 text-solar-500' : 'bg-accent text-muted-foreground')}>
                      {c.label}
                    </span>
                  ))}
                </div>
              </div>
            ))}
            {mobileRows.length === 0 && (
              <p className="text-sm text-muted-foreground">No assigned mobile jobs.</p>
            )}
          </div>
        </div>
      )}

      {showCreate && <CreateTicketModal onClose={() => setShowCreate(false)} />}
    </PageContainer>
  );
}
