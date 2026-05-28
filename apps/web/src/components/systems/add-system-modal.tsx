'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { X, Loader2 } from 'lucide-react';
import { usePost } from '@/hooks/use-api';
import { cn } from '@/lib/utils';

const schema = z.object({
  name:         z.string().min(3),
  systemSizeKw: z.number().min(0.1),
  address:      z.string().min(5),
  city:         z.string().min(2),
  province:     z.string().min(2),
  latitude:     z.number(),
  longitude:    z.number(),
});
type FormData = z.infer<typeof schema>;

export function AddSystemModal({ onClose }: { onClose: () => void }) {
  const [serverError, setServerError] = useState<string | null>(null);
  const mutation = usePost<any, any>('/api/v1/solar-systems', [['systems'], ['smart-city']]);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { latitude: 14.5995, longitude: 120.9842 },
  });

  async function onSubmit(data: FormData) {
    setServerError(null);
    try {
      await mutation.mutateAsync({
        name: data.name,
        systemSizeKw: data.systemSizeKw,
        location: {
          address: data.address,
          city: data.city,
          province: data.province,
          latitude: data.latitude,
          longitude: data.longitude,
        },
      });
      onClose();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string | string[] } } })?.response?.data
          ?.message;
      setServerError(Array.isArray(msg) ? msg.join(', ') : msg ?? 'Failed to add system');
    }
  }

  const iCls = 'w-full px-3 py-2.5 rounded-lg bg-accent border border-border text-sm focus:outline-none focus:ring-2 focus:ring-solar-500/40';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative z-10 w-full max-w-lg panel-card p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold">Add Solar System</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-accent"><X className="w-4 h-4" /></button>
        </div>
        {serverError && (
          <div className="mb-4 p-3 rounded-lg bg-destructive/15 border border-destructive/30 text-destructive text-sm">
            {serverError}
          </div>
        )}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">System Name</label>
              <input {...register('name')} placeholder="Main Rooftop System" className={iCls} />
              {errors.name && <p className="text-xs text-destructive mt-1">{errors.name.message}</p>}
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">Capacity (kW)</label>
              <input {...register('systemSizeKw', { valueAsNumber: true })} type="number" step="0.1" placeholder="5.5" className={iCls} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">City</label>
              <input {...register('city')} placeholder="Makati" className={iCls} />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">Address</label>
              <input {...register('address')} placeholder="123 Solar St, Brgy. Example" className={iCls} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">Province</label>
              <input {...register('province')} placeholder="Metro Manila" className={iCls} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">Latitude</label>
              <input {...register('latitude', { valueAsNumber: true })} type="number" step="0.0001" className={iCls} />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-lg border border-border text-sm hover:bg-accent transition-colors">Cancel</button>
            <button type="submit" disabled={isSubmitting || mutation.isPending}
              className="flex-1 py-2.5 rounded-lg bg-gradient-solar text-white text-sm font-medium hover:opacity-90 disabled:opacity-60">
              {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Add System'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
