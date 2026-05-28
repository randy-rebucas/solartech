'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Loader2 } from 'lucide-react';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';

type Props = {
  installerId?: string;
  installerName?: string;
  onClose: () => void;
};

export function RequestLeadModal({ installerId, installerName, onClose }: Props) {
  const router = useRouter();
  const qc = useQueryClient();
  const [title, setTitle] = useState(installerName ? `Quotation request — ${installerName}` : '');
  const [description, setDescription] = useState('');
  const [city, setCity] = useState('Metro Manila');
  const [systemSizeKw, setSystemSizeKw] = useState<number | ''>('');
  const [requestType, setRequestType] = useState('quotation');
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () =>
      api.post('/api/v1/marketplace/leads', {
        title,
        description,
        city,
        installerId,
        systemSizeKw: systemSizeKw || undefined,
        requestType,
      }).then((r) => r.data),
    onSuccess: (lead: { _id: string }) => {
      qc.invalidateQueries({ queryKey: ['marketplace', 'leads'] });
      onClose();
      router.push(`/marketplace/leads/${lead._id}`);
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(typeof msg === 'string' ? msg : 'Failed to create request');
    },
  });

  const inputCls =
    'w-full px-3 py-2 rounded-lg bg-accent border border-border text-sm focus:outline-none focus:ring-2 focus:ring-solar-500/40';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="panel-card w-full max-w-md p-6 space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="font-semibold">Quotation request</h2>
          <button type="button" onClick={onClose} className="p-1 hover:bg-accent rounded">
            <X className="w-4 h-4" />
          </button>
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <div className="space-y-3">
          <div>
            <label className="text-xs text-muted-foreground">Title</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} placeholder="e.g. 5 kW home install" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Details</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className={inputCls} placeholder="Roof type, timeline, budget…" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground">City</label>
              <input value={city} onChange={(e) => setCity(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Type</label>
              <select value={requestType} onChange={(e) => setRequestType(e.target.value)} className={inputCls}>
                <option value="quotation">Quotation</option>
                <option value="installation">Installation</option>
                <option value="maintenance">Maintenance</option>
                <option value="consultation">Consultation</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">System size (kW, optional)</label>
            <input type="number" value={systemSizeKw} onChange={(e) => setSystemSizeKw(e.target.value ? Number(e.target.value) : '')} className={inputCls} placeholder="e.g. 5" />
          </div>
        </div>
        <button
          type="button"
          disabled={!title || mutation.isPending}
          onClick={() => mutation.mutate()}
          className="w-full py-2.5 rounded-lg bg-gradient-solar text-white text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {mutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
          Submit request
        </button>
      </div>
    </div>
  );
}
