'use client';

import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, ArrowRight, Sun, MapPin, Battery, DollarSign,
  CheckCircle2, Loader2, X, Download, Calculator, Sparkles,
} from 'lucide-react';
import { usePost } from '@/hooks/use-api';
import { formatCurrency, formatKwh, cn } from '@/lib/utils';
import { PageContainer } from '@/components/layout/page-container';
import {
  PROVINCE_PSH,
  billToMonthlyKwh,
  calculateBatterySizing,
  calculateProduction,
} from '@/lib/solar-calculator';
import type { QuotationCalcOutput } from '@/lib/quotation-analytics';
import { ensureAnalytics } from '@/lib/quotation-analytics';
import { downloadQuotationPdf } from '@/lib/quotation-pdf';
import {
  EnergyOffsetChart,
  FinancialForecastChart,
  ProductionEstimateChart,
  NetMeteringCard,
  EquipmentRecommendationsCard,
  ProposalSummaryCard,
} from './quotation-widgets';

const step1Schema = z.object({
  monthlyBill: z.number().min(1),
  monthlyKwh: z.number().min(1),
  utilityRate: z.number().min(0.01),
  useBillEstimate: z.boolean().optional(),
});

const step2Schema = z.object({
  address: z.string().min(5),
  city: z.string().min(2),
  province: z.string().optional(),
  provinceKey: z.string().min(1),
  latitude: z.number(),
  longitude: z.number(),
});

const step3Schema = z.object({
  roofArea: z.number().min(10),
  roofLength: z.number().optional(),
  roofWidth: z.number().optional(),
  roofType: z.enum(['flat', 'pitched', 'metal', 'concrete']),
  roofAzimuth: z.number().min(0).max(360).optional(),
  gridType: z.enum(['on_grid', 'off_grid', 'hybrid']),
  includesBattery: z.boolean(),
});

type FormData = z.infer<typeof step1Schema> & z.infer<typeof step2Schema> & z.infer<typeof step3Schema>;

function toPayload(values: FormData) {
  return {
    monthlyBill: values.monthlyBill,
    monthlyKwh: values.monthlyKwh,
    roofArea: values.roofArea,
    roofLength: values.roofLength || undefined,
    roofWidth: values.roofWidth || undefined,
    roofType: values.roofType,
    roofAzimuth: values.roofAzimuth,
    latitude: values.latitude,
    longitude: values.longitude,
    gridType: values.gridType,
    includesBattery: Boolean(values.includesBattery),
    utilityRate: values.utilityRate,
    address: values.address,
    city: values.city,
    province: values.province || PROVINCE_PSH[values.provinceKey]?.label,
    provinceKey: values.provinceKey,
    peakSunHours: PROVINCE_PSH[values.provinceKey]?.psh,
  };
}

function axiosErrorMessage(err: unknown): string {
  const msg = (err as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message;
  return Array.isArray(msg) ? msg.join(', ') : msg ?? 'Request failed';
}

const STEPS = [
  { label: 'Consumption', icon: DollarSign },
  { label: 'Location', icon: MapPin },
  { label: 'Site & roof', icon: Sun },
  { label: 'Proposal', icon: CheckCircle2 },
];

interface Props {
  onClose: () => void;
}

export function QuotationWizard({ onClose }: Props) {
  const [step, setStep] = useState(0);
  const [result, setResult] = useState<QuotationCalcOutput | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [roofMode, setRoofMode] = useState<'area' | 'dimensions'>('area');

  const estimateMutation = usePost<ReturnType<typeof toPayload>, QuotationCalcOutput>(
    '/api/v1/quotations/estimate',
  );
  const createMutation = usePost<ReturnType<typeof toPayload>, unknown>('/api/v1/quotations', [['quotations']]);

  const { register, handleSubmit, watch, setValue, formState: { errors }, trigger } = useForm<FormData>({
    defaultValues: {
      utilityRate: 10.5,
      roofType: 'pitched',
      gridType: 'on_grid',
      includesBattery: false,
      provinceKey: 'metro_manila',
      latitude: 14.5995,
      longitude: 120.9842,
      roofArea: 80,
      useBillEstimate: true,
    },
  });

  const values = watch();
  const psh = PROVINCE_PSH[values.provinceKey]?.psh ?? 4.5;

  const computedRoofArea = useMemo(() => {
    if (roofMode === 'dimensions' && values.roofLength && values.roofWidth) {
      return Math.round(values.roofLength * values.roofWidth * 10) / 10;
    }
    return values.roofArea;
  }, [roofMode, values.roofLength, values.roofWidth, values.roofArea]);

  const livePreview = useMemo(() => {
    if (!values.monthlyKwh || !computedRoofArea) return null;
    const prod = calculateProduction({ systemKw: values.monthlyKwh / 30 / (psh * 0.78), provinceKey: values.provinceKey });
    const bat = values.includesBattery
      ? calculateBatterySizing({ dailyKwh: values.monthlyKwh / 30, autonomyHours: 4, gridType: values.gridType })
      : null;
    return { prod, bat };
  }, [values.monthlyKwh, values.provinceKey, values.includesBattery, values.gridType, computedRoofArea, psh]);

  function applyBillEstimate() {
    const kwh = billToMonthlyKwh(values.monthlyBill, values.utilityRate);
    if (kwh > 0) setValue('monthlyKwh', kwh, { shouldValidate: true });
  }

  async function handleStepSubmit(data: FormData) {
    setServerError(null);
    const schemas = [step1Schema, step2Schema, step3Schema];
    const parsed = schemas[step].safeParse(data);
    if (!parsed.success) {
      await trigger();
      return;
    }
    if (step === 2) {
      const payload = toPayload({ ...data, roofArea: computedRoofArea });
      try {
        const res = await estimateMutation.mutateAsync(payload);
        setResult(res);
        setStep(3);
      } catch (err) {
        setServerError(axiosErrorMessage(err));
      }
    } else {
      if (step === 0 && values.useBillEstimate) applyBillEstimate();
      if (step === 1 && roofMode === 'dimensions') {
        setValue('roofArea', computedRoofArea);
      }
      setStep((s) => s + 1);
    }
  }

  async function saveQuotation() {
    setServerError(null);
    try {
      await createMutation.mutateAsync(toPayload({ ...values, roofArea: computedRoofArea }));
      onClose();
    } catch (err) {
      setServerError(axiosErrorMessage(err));
    }
  }

  function exportPdf() {
    if (!result) return;
    downloadQuotationPdf(
      {
        address: values.address,
        city: values.city,
        province: values.province,
        monthlyBill: values.monthlyBill,
        monthlyKwh: values.monthlyKwh,
        utilityRate: values.utilityRate,
      },
      result,
    );
  }

  const analytics = result ? ensureAnalytics(result, values.monthlyKwh) : null;
  const inputCls =
    'w-full px-3 py-2.5 rounded-lg bg-accent border border-border text-sm focus:outline-none focus:ring-2 focus:ring-solar-500/40';

  return (
    <PageContainer>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Solar Quotation System</h1>
          <p className="text-sm text-muted-foreground">
            AI sizing · ROI · net metering · equipment · PDF proposal
          </p>
        </div>
        <button type="button" onClick={onClose} className="p-2 rounded-lg hover:bg-accent">
          <X className="w-4 h-4" />
        </button>
      </div>

      {serverError && (
        <div className="p-3 rounded-lg bg-destructive/15 border border-destructive/30 text-destructive text-sm">
          {serverError}
        </div>
      )}

      <div className="flex items-center gap-2 flex-wrap">
        {STEPS.map((s, i) => (
          <div key={s.label} className="flex items-center gap-2">
            <div
              className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold',
                i < step ? 'bg-solar-500 text-white' : i === step ? 'bg-solar-500/20 text-solar-500 border-2 border-solar-500' : 'bg-muted text-muted-foreground',
              )}
            >
              {i < step ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
            </div>
            <span className={cn('text-xs hidden sm:block', i === step ? 'font-medium' : 'text-muted-foreground')}>
              {s.label}
            </span>
            {i < STEPS.length - 1 && <div className={cn('h-0.5 w-6', i < step ? 'bg-solar-500' : 'bg-border')} />}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit(handleStepSubmit)}>
        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div key="s0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="panel-card p-6 space-y-5">
              <h2 className="font-semibold flex items-center gap-2">
                <Calculator className="w-4 h-4 text-solar-500" /> Consumption calculator
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <FormField label="Monthly bill (₱)" error={errors.monthlyBill?.message}>
                  <input {...register('monthlyBill', { valueAsNumber: true })} type="number" placeholder="e.g. 5000" className={inputCls} />
                </FormField>
                <FormField label="Utility rate (₱/kWh)" error={errors.utilityRate?.message}>
                  <input {...register('utilityRate', { valueAsNumber: true })} type="number" step="0.01" placeholder="e.g. 10.50" className={inputCls} />
                </FormField>
                <FormField label="Monthly usage (kWh)" error={errors.monthlyKwh?.message}>
                  <input {...register('monthlyKwh', { valueAsNumber: true })} type="number" placeholder="e.g. 500" className={inputCls} />
                </FormField>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={applyBillEstimate}
                  className="text-xs px-3 py-1.5 rounded-lg border border-solar-500/40 text-solar-500 hover:bg-solar-500/10"
                >
                  Estimate kWh from bill
                </button>
                <span className="text-xs text-muted-foreground self-center">
                  Daily: ~{(values.monthlyKwh / 30 || 0).toFixed(1)} kWh
                </span>
              </div>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="panel-card p-6 space-y-5">
              <h2 className="font-semibold">Location & sunlight data</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="Address" className="sm:col-span-2" error={errors.address?.message}>
                  <input {...register('address')} className={inputCls} placeholder="e.g. 123 Ayala Ave, Barangay Bel-Air" />
                </FormField>
                <FormField label="City">
                  <input {...register('city')} className={inputCls} placeholder="e.g. Makati" />
                </FormField>
                <FormField label="Region / province">
                  <select {...register('provinceKey')} className={inputCls}>
                    {Object.entries(PROVINCE_PSH).map(([key, { label }]) => (
                      <option key={key} value={key} className="bg-background">
                        {label}
                      </option>
                    ))}
                  </select>
                </FormField>
                <FormField label="Latitude">
                  <input {...register('latitude', { valueAsNumber: true })} type="number" step="0.0001" placeholder="e.g. 14.5995" className={inputCls} />
                </FormField>
                <FormField label="Longitude">
                  <input {...register('longitude', { valueAsNumber: true })} type="number" step="0.0001" placeholder="e.g. 120.9842" className={inputCls} />
                </FormField>
              </div>
              <div className="p-3 rounded-lg bg-solar-500/10 border border-solar-500/20 text-sm">
                <span className="text-solar-500 font-medium">Peak sun hours: {psh} h/day</span>
                <span className="text-muted-foreground"> — used for production & sizing</span>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="panel-card p-6 space-y-5">
              <h2 className="font-semibold">Roof area estimation & system type</h2>
              <div className="flex gap-2">
                {(['area', 'dimensions'] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setRoofMode(m)}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-xs border',
                      roofMode === m ? 'border-solar-500 bg-solar-500/10 text-solar-500' : 'border-border',
                    )}
                  >
                    {m === 'area' ? 'Total area (m²)' : 'Length × width'}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {roofMode === 'area' ? (
                  <FormField label="Roof area (m²)">
                    <input {...register('roofArea', { valueAsNumber: true })} type="number" placeholder="e.g. 80" className={inputCls} />
                  </FormField>
                ) : (
                  <>
                    <FormField label="Length (m)">
                      <input {...register('roofLength', { valueAsNumber: true })} type="number" placeholder="e.g. 10" className={inputCls} />
                    </FormField>
                    <FormField label="Width (m)">
                      <input {...register('roofWidth', { valueAsNumber: true })} type="number" placeholder="e.g. 8" className={inputCls} />
                    </FormField>
                    <p className="sm:col-span-2 text-sm text-muted-foreground">
                      Estimated area: <strong>{computedRoofArea} m²</strong>
                    </p>
                  </>
                )}
                <FormField label="Roof type">
                  <select {...register('roofType')} className={inputCls}>
                    {['flat', 'pitched', 'metal', 'concrete'].map((t) => (
                      <option key={t} value={t} className="bg-background capitalize">
                        {t}
                      </option>
                    ))}
                  </select>
                </FormField>
                <FormField label="Roof azimuth (°)">
                  <input {...register('roofAzimuth', { valueAsNumber: true })} type="number" min={0} max={360} placeholder="e.g. 180 (south-facing)" className={inputCls} />
                </FormField>
                <FormField label="Grid connection">
                  <select {...register('gridType')} className={inputCls}>
                    <option value="on_grid">On-grid (net metering)</option>
                    <option value="hybrid">Hybrid + battery</option>
                    <option value="off_grid">Off-grid</option>
                  </select>
                </FormField>
                <FormField label="Battery storage">
                  <div className="flex gap-2 mt-1">
                    {[false, true].map((v) => (
                      <label
                        key={String(v)}
                        className={cn(
                          'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border cursor-pointer text-sm',
                          values.includesBattery === v ? 'border-solar-500 bg-solar-500/10 text-solar-500' : 'border-border',
                        )}
                      >
                        <input type="radio" className="sr-only" checked={values.includesBattery === v} onChange={() => setValue('includesBattery', v)} />
                        <Battery className="w-4 h-4" />
                        {v ? 'Yes' : 'No'}
                      </label>
                    ))}
                  </div>
                </FormField>
              </div>
              {livePreview && (
                <div className="p-3 rounded-lg bg-accent/50 text-xs text-muted-foreground grid sm:grid-cols-2 gap-2">
                  <span>Target production ~{formatKwh(livePreview.prod.annualKwh)}/yr at {psh} PSH</span>
                  {livePreview.bat && <span>Battery preview: {livePreview.bat.requiredKwh} kWh ({livePreview.bat.units} units)</span>}
                </div>
              )}
            </motion.div>
          )}

          {step === 3 && result && analytics && (
            <motion.div key="s3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <div className="panel-card p-6 text-center border border-solar-500/20">
                <Sparkles className="w-8 h-8 text-solar-500 mx-auto mb-2" />
                <h2 className="text-xl font-bold">{result.proposalSummary?.headline ?? 'Your Solar Proposal'}</h2>
                <p className="text-sm text-muted-foreground mt-1">{result.proposalSummary?.productionNote}</p>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  { label: 'System size', value: `${result.recommendedSystemSizeKw} kW`, c: 'text-solar-500' },
                  { label: 'Total cost', value: formatCurrency(result.totalCost), c: 'text-energy-400' },
                  { label: 'Payback', value: `${result.paybackPeriodYears} yrs`, c: 'text-yellow-400' },
                  { label: '25-yr ROI', value: `${result.roi25Years}%`, c: 'text-purple-400' },
                  { label: 'Production', value: formatKwh(result.estimatedAnnualProductionKwh), c: 'text-solar-500' },
                  { label: 'Monthly savings', value: formatCurrency(result.estimatedMonthlySavings), c: 'text-solar-500' },
                  { label: 'Energy offset', value: `${analytics.energyOffsetPercent}%`, c: 'text-emerald-400' },
                  { label: 'Panels', value: `${result.numberOfPanels}×${result.panelWattage}W`, c: 'text-energy-400' },
                ].map((k) => (
                  <div key={k.label} className="stat-card text-center">
                    <p className={cn('text-lg font-bold', k.c)}>{k.value}</p>
                    <p className="text-xs text-muted-foreground">{k.label}</p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <EnergyOffsetChart analytics={analytics} />
                <ProductionEstimateChart analytics={analytics} />
              </div>
              <FinancialForecastChart analytics={analytics} totalCost={result.totalCost} />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <NetMeteringCard analytics={analytics} />
                <EquipmentRecommendationsCard analytics={analytics} equipment={result.equipment} />
              </div>
              <ProposalSummaryCard summary={result.proposalSummary} />

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={saveQuotation}
                  disabled={createMutation.isPending}
                  className="flex-1 py-3 rounded-lg bg-gradient-solar text-white font-medium hover:opacity-90 shadow-glow"
                >
                  {createMutation.isPending ? 'Saving…' : 'Save quotation'}
                </button>
                <button
                  type="button"
                  onClick={exportPdf}
                  className="inline-flex items-center gap-2 px-4 py-3 rounded-lg border border-border hover:bg-accent text-sm"
                >
                  <Download className="w-4 h-4" /> PDF
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {step < 3 && (
          <div className="flex justify-between mt-6">
            <button
              type="button"
              onClick={() => (step > 0 ? setStep((s) => s - 1) : onClose())}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm hover:bg-accent"
            >
              <ArrowLeft className="w-4 h-4" />
              {step === 0 ? 'Cancel' : 'Back'}
            </button>
            <button
              type="submit"
              disabled={estimateMutation.isPending}
              className="flex items-center gap-2 px-6 py-2 rounded-lg bg-gradient-solar text-white text-sm font-medium"
            >
              {estimateMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              {step === 2 ? 'Generate proposal' : 'Next'}
              {step < 2 && <ArrowRight className="w-4 h-4" />}
            </button>
          </div>
        )}
      </form>
    </PageContainer>
  );
}

function FormField({
  label,
  error,
  children,
  className,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="block text-xs font-medium text-muted-foreground mb-1.5">{label}</label>
      {children}
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  );
}
