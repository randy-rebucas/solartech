'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
}

// Simple event-bus toast system
const listeners: Set<(toast: Toast) => void> = new Set();

export function toast(opts: Omit<Toast, 'id'>) {
  const t: Toast = { ...opts, id: Math.random().toString(36).slice(2) };
  listeners.forEach((fn) => fn(t));
}

const ICONS: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle2 className="w-4 h-4 text-solar-500" />,
  error:   <XCircle      className="w-4 h-4 text-destructive" />,
  warning: <AlertTriangle className="w-4 h-4 text-yellow-400" />,
  info:    <Info          className="w-4 h-4 text-energy-400" />,
};

export function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    function add(t: Toast) {
      setToasts((prev) => [...prev, t]);
      setTimeout(() => remove(t.id), 4000);
    }
    listeners.add(add);
    return () => { listeners.delete(add); };
  }, []);

  function remove(id: string) {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, x: 48, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 48, scale: 0.95 }}
            className={cn(
              'pointer-events-auto flex items-start gap-3 p-4 rounded-xl border bg-card shadow-card-hover',
              'border-border',
            )}
          >
            <span className="flex-shrink-0 mt-0.5">{ICONS[t.type]}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">{t.title}</p>
              {t.description && <p className="text-xs text-muted-foreground mt-0.5">{t.description}</p>}
            </div>
            <button onClick={() => remove(t.id)} className="p-0.5 rounded hover:bg-accent transition-colors">
              <X className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
