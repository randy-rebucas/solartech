'use client';

import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { X, Loader2 } from 'lucide-react';
import { usePost } from '@/hooks/use-api';

export function CreateTicketModal({ onClose }: { onClose: () => void }) {
  const mutation = usePost<any, any>('/api/v1/maintenance', [['maintenance']]);
  const { register, handleSubmit } = useForm({
    defaultValues: {
      priority: 'medium',
      type: 'corrective',
      title: '',
      description: '',
      solarSystemId: '',
      scheduledAt: '',
      photoUrl: '',
      preventiveIntervalDays: '',
    },
  });
  const iCls = 'w-full px-3 py-2.5 rounded-lg bg-accent border border-border text-sm focus:outline-none focus:ring-2 focus:ring-solar-500/40';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="relative z-10 w-full max-w-lg panel-card p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold">Create Maintenance Ticket</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-accent"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={handleSubmit(async (d) => {
          await mutation.mutateAsync({
            ...d,
            images: d.photoUrl ? [d.photoUrl] : [],
            preventiveIntervalDays: d.preventiveIntervalDays ? Number(d.preventiveIntervalDays) : undefined,
            scheduledAt: d.scheduledAt || undefined,
          });
          onClose();
        })} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">Title</label>
            <input {...register('title', { required: true })} placeholder="Inverter not producing power" className={iCls} />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">Description</label>
            <textarea {...register('description', { required: true })} rows={3} placeholder="Describe the issue in detail…" className={iCls} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">Priority</label>
              <select {...register('priority')} className={iCls}>
                {['critical','high','medium','low'].map((p) => <option key={p} value={p} className="bg-background capitalize">{p}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">Type</label>
              <select {...register('type')} className={iCls}>
                {['corrective','preventive','inspection','warranty'].map((t) => <option key={t} value={t} className="bg-background capitalize">{t}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">Solar System ID</label>
            <input {...register('solarSystemId', { required: true })} placeholder="System MongoDB ID" className={iCls} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">Scheduled Date</label>
              <input {...register('scheduledAt')} type="datetime-local" className={iCls} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">PM Interval (days)</label>
              <input {...register('preventiveIntervalDays')} type="number" min={1} placeholder="e.g. 90" className={iCls} />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">Photo URL (optional)</label>
            <input {...register('photoUrl')} placeholder="https://..." className={iCls} />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-lg border border-border text-sm hover:bg-accent">Cancel</button>
            <button type="submit" disabled={mutation.isPending}
              className="flex-1 py-2.5 rounded-lg bg-gradient-solar text-white text-sm font-medium hover:opacity-90 disabled:opacity-60">
              {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Create Ticket'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
