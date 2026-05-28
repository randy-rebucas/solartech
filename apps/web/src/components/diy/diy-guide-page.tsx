'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle, BookOpen, Calculator, CheckCircle2, ChevronDown,
  Clock, Hammer, Lightbulb, Shield,
} from 'lucide-react';
import { DIY_PHASES, DIY_SAFETY_NOTES } from '@/content/diy/guide';
import { cn } from '@/lib/utils';

export function DiyGuidePage() {
  const [openPhase, setOpenPhase] = useState<string>(DIY_PHASES[0].id);
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  function toggleCheck(id: string) {
    setChecked((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  const totalSteps = DIY_PHASES.reduce((n, p) => n + p.steps.length, 0);
  const doneCount = Object.values(checked).filter(Boolean).length;

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-xs font-medium mb-4">
          <Hammer className="w-3.5 h-3.5" />
          DIY Solar Philippines
        </div>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Home Solar DIY Guide</h1>
        <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">
          Step-by-step path from assessment to maintenance. Use our{' '}
          <Link href="/calculators" className="text-solar-500 hover:underline">
            free calculators
          </Link>{' '}
          while you plan, or{' '}
          <Link href="/help" className="text-solar-500 hover:underline">
            browse the Knowledge Base
          </Link>
          .
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <Link
          href="/calculators"
          className="flex-1 flex items-center gap-3 p-4 rounded-xl border border-solar-500/30 bg-solar-500/10 hover:bg-solar-500/15 transition-colors"
        >
          <Calculator className="w-8 h-8 text-solar-500 flex-shrink-0" />
          <div className="text-left">
            <p className="font-semibold text-sm">Open Solar Calculators</p>
            <p className="text-xs text-muted-foreground">Size your system, ROI, battery & output</p>
          </div>
        </Link>
        <Link
          href="/help/welcome-to-solartech"
          className="flex-1 flex items-center gap-3 p-4 rounded-xl border border-border hover:bg-accent/50 transition-colors"
        >
          <BookOpen className="w-8 h-8 text-muted-foreground flex-shrink-0" />
          <div className="text-left">
            <p className="font-semibold text-sm">Platform documentation</p>
            <p className="text-xs text-muted-foreground">Monitoring, MQTT, quotations</p>
          </div>
        </Link>
      </div>

      <div className="panel-card rounded-xl p-4 mb-8 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium">Your progress</p>
          <p className="text-xs text-muted-foreground">
            {doneCount} of {totalSteps} steps checked
          </p>
        </div>
        <div className="flex-1 max-w-xs h-2 rounded-full bg-accent overflow-hidden">
          <div
            className="h-full bg-gradient-solar transition-all duration-300"
            style={{ width: `${totalSteps ? (doneCount / totalSteps) * 100 : 0}%` }}
          />
        </div>
      </div>

      <div className="space-y-3">
        {DIY_PHASES.map((phase, phaseIndex) => {
          const isOpen = openPhase === phase.id;
          return (
            <div key={phase.id} className="panel-card rounded-xl overflow-hidden border border-border">
              <button
                type="button"
                onClick={() => setOpenPhase(isOpen ? '' : phase.id)}
                className="w-full flex items-start gap-4 p-5 text-left hover:bg-accent/30 transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-solar-500/15 flex items-center justify-center text-solar-500 font-bold flex-shrink-0">
                  {phaseIndex + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="font-semibold">{phase.title}</h2>
                  <p className="text-sm text-muted-foreground mt-0.5">{phase.summary}</p>
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground mt-2">
                    <Clock className="w-3 h-3" />
                    {phase.duration}
                  </span>
                </div>
                <ChevronDown
                  className={cn('w-5 h-5 text-muted-foreground transition-transform', isOpen && 'rotate-180')}
                />
              </button>

              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="px-5 pb-5 pt-0 border-t border-border">
                      <ul className="space-y-4 mt-4">
                        {phase.steps.map((step, idx) => {
                          const checkId = `${phase.id}-${idx}`;
                          const isDone = checked[checkId];
                          return (
                            <li key={checkId} className="flex gap-3">
                              <button
                                type="button"
                                onClick={() => toggleCheck(checkId)}
                                className={cn(
                                  'mt-0.5 w-5 h-5 rounded border flex-shrink-0 flex items-center justify-center transition-colors',
                                  isDone
                                    ? 'bg-solar-500 border-solar-500 text-white'
                                    : 'border-border hover:border-solar-500/50',
                                )}
                                aria-label={isDone ? 'Mark incomplete' : 'Mark complete'}
                              >
                                {isDone && <CheckCircle2 className="w-3.5 h-3.5" />}
                              </button>
                              <div>
                                <p className="font-medium text-sm">{step.title}</p>
                                <p className="text-sm text-muted-foreground mt-1">{step.detail}</p>
                              </div>
                            </li>
                          );
                        })}
                      </ul>

                      {phase.tips && phase.tips.length > 0 && (
                        <div className="mt-4 p-3 rounded-lg bg-solar-500/10 border border-solar-500/20">
                          <p className="text-xs font-semibold text-solar-500 flex items-center gap-1 mb-2">
                            <Lightbulb className="w-3.5 h-3.5" /> Tips
                          </p>
                          <ul className="text-xs text-muted-foreground space-y-1">
                            {phase.tips.map((t) => (
                              <li key={t}>• {t}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {phase.warnings && phase.warnings.length > 0 && (
                        <div className="mt-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                          <p className="text-xs font-semibold text-amber-500 flex items-center gap-1 mb-2">
                            <AlertTriangle className="w-3.5 h-3.5" /> Important
                          </p>
                          <ul className="text-xs text-muted-foreground space-y-1">
                            {phase.warnings.map((w) => (
                              <li key={w}>• {w}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {phase.id === 'design' && (
                        <Link
                          href="/calculators"
                          className="inline-flex items-center gap-2 mt-4 text-sm font-medium text-solar-500 hover:underline"
                        >
                          <Calculator className="w-4 h-4" />
                          Run calculators for this phase
                        </Link>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      <section className="mt-12 panel-card rounded-2xl p-6 border border-border">
        <h2 className="font-bold flex items-center gap-2 mb-4">
          <Shield className="w-5 h-5 text-muted-foreground" />
          Safety & legal
        </h2>
        <ul className="space-y-2 text-sm text-muted-foreground">
          {DIY_SAFETY_NOTES.map((note) => (
            <li key={note} className="flex gap-2">
              <span className="text-amber-500">•</span>
              {note}
            </li>
          ))}
        </ul>
      </section>

      <div className="mt-10 text-center">
        <p className="text-muted-foreground mb-4">Ready to manage your install professionally?</p>
        <Link
          href="/register"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-solar text-white font-semibold hover:opacity-90"
        >
          Start free trial
        </Link>
      </div>
    </div>
  );
}
