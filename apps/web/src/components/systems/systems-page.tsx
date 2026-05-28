'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Sun, MapPin, Zap, Plus, ChevronRight,
  Activity, AlertTriangle,
} from 'lucide-react';
import { useSolarSystems } from '@/hooks/use-api';
import { formatDate } from '@/lib/utils';
import { getSolarSystemStatusConfig } from '@/lib/solar-system-status';
import { AddSystemModal } from './add-system-modal';
import { PageContainer } from '@/components/layout/page-container';

export function SystemsPage() {
  const [showAdd, setShowAdd] = useState(false);
  const { data, isLoading } = useSolarSystems();
  const systems = (data as any)?.data ?? [];

  return (
    <PageContainer>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Solar Systems</h1>
          <p className="text-sm text-muted-foreground">Monitor and manage installed systems</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-solar text-white text-sm font-medium hover:opacity-90 shadow-glow"
        >
          <Plus className="w-4 h-4" /> Add System
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Systems', value: systems.length,                                                           icon: <Sun className="w-4 h-4 text-solar-500" /> },
          { label: 'Active',        value: systems.filter((s: any) => s.status === 'active').length,                 icon: <Activity className="w-4 h-4 text-solar-500" /> },
          { label: 'Offline',       value: systems.filter((s: any) => s.status === 'offline').length,                icon: <AlertTriangle className="w-4 h-4 text-destructive" /> },
          { label: 'Total Capacity',value: `${systems.reduce((s: number, sys: any) => s + (sys.systemSizeKw ?? 0), 0).toFixed(1)} kW`, icon: <Zap className="w-4 h-4 text-energy-400" /> },
        ].map((kpi) => (
          <div key={kpi.label} className="stat-card">
            <div className="flex items-center gap-2 text-muted-foreground">{kpi.icon}<span className="text-xs">{kpi.label}</span></div>
            <p className="text-2xl font-bold mt-2">{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Systems grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-48 rounded-xl bg-accent/50 animate-pulse" />
          ))}
        </div>
      ) : systems.length === 0 ? (
        <div className="panel-card p-12 text-center">
          <Sun className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-40" />
          <p className="font-medium">No solar systems yet</p>
          <p className="text-sm text-muted-foreground mt-1">Add your first solar installation</p>
          <button onClick={() => setShowAdd(true)} className="mt-4 px-4 py-2 rounded-lg bg-gradient-solar text-white text-sm font-medium hover:opacity-90">
            Add System
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {systems.map((sys: any) => {
            const cfg = getSolarSystemStatusConfig(sys.status);
            return (
              <Link key={sys._id} href={`/systems/${sys._id}`} className="block">
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="interactive-card p-5 rounded-xl cursor-pointer group h-full"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="p-2 rounded-lg bg-solar-500/10">
                    <Sun className="w-5 h-5 text-solar-500" />
                  </div>
                  <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.color} bg-current/10`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                    {cfg.label}
                  </div>
                </div>

                <h3 className="font-semibold truncate">{sys.name}</h3>
                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                  <MapPin className="w-3 h-3" />
                  <span className="truncate">{sys.location?.city}, {sys.location?.province}</span>
                </div>

                <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-border">
                  <div className="text-center">
                    <p className="text-sm font-bold text-solar-500">{sys.systemSizeKw} kW</p>
                    <p className="text-xs text-muted-foreground">Capacity</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold">{sys.devices?.length ?? 0}</p>
                    <p className="text-xs text-muted-foreground">Devices</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold">{sys.installedAt ? formatDate(sys.installedAt) : '—'}</p>
                    <p className="text-xs text-muted-foreground">Installed</p>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                  <p className="text-xs text-muted-foreground">Client: {sys.clientId?.firstName} {sys.clientId?.lastName}</p>
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                </div>
              </motion.div>
              </Link>
            );
          })}
        </div>
      )}

      {showAdd && <AddSystemModal onClose={() => setShowAdd(false)} />}
    </PageContainer>
  );
}
