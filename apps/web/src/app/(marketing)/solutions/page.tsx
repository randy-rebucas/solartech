import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowRight, BarChart3, Bot, Building2, Calculator, Home,
  MapPin, Store, Sun, Wrench, Zap,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Solutions | SolarTech',
  description: 'Solar monitoring, quotations, IoT, maintenance, and smart city analytics for the Philippines.',
};

const segments = [
  {
    icon: Building2,
    title: 'Solar companies & EPCs',
    desc: 'Run your entire fleet from one dashboard — quotations, client portals, billing, and fleet-wide analytics.',
    features: ['Multi-site monitoring', 'Team & role management', 'Invoicing & revenue tracking', 'AI production insights'],
    href: '/register',
  },
  {
    icon: Store,
    title: 'Installers & contractors',
    desc: 'Win more jobs with instant ROI quotes, marketplace visibility, and remote diagnostics after install.',
    features: ['Solar quotation engine', 'Installer marketplace profile', 'Device onboarding & MQTT', 'Maintenance work orders'],
    href: '/register',
  },
  {
    icon: MapPin,
    title: 'LGUs & government',
    desc: 'Province-level adoption maps, carbon reporting, and policy-ready data for renewable energy programs.',
    features: ['Smart City dashboard', 'Regional heatmaps', 'CO₂ impact metrics', 'Exportable summaries'],
    href: '/register',
  },
  {
    icon: Home,
    title: 'Homeowners & clients',
    desc: 'See live production, savings, and service updates from your installer in a simple read-only portal.',
    features: ['Real-time production view', 'Invoice & payment history', 'Service ticket status', 'Mobile-friendly dashboard'],
    href: '/register',
  },
];

const modules = [
  { icon: Zap, title: 'IoT monitoring', desc: 'MQTT telemetry from inverters, meters, and gateways.', href: '/help/connect-iot-devices' },
  { icon: Calculator, title: 'Quotations', desc: 'Physics-based sizing and ROI for Philippine utilities.', href: '/calculators' },
  { icon: BarChart3, title: 'Analytics', desc: 'Production trends, anomalies, and forecasting.', href: '/dashboard' },
  { icon: Wrench, title: 'Maintenance CRM', desc: 'Tickets, dispatch, and SLA tracking.', href: '/help/maintenance-work-orders' },
  { icon: Bot, title: 'AI assistant', desc: 'SolarBot answers questions in plain language.', href: '/help/ai-assistant' },
  { icon: Sun, title: 'DIY & tools', desc: 'Free guides and calculators for planning.', href: '/diy' },
];

export default function SolutionsPage() {
  return (
    <div>
      <section className="py-20 px-6 border-b border-border">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
            Solutions for every part of the{' '}
            <span className="gradient-text">solar value chain</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Whether you install, operate, govern, or own solar — SolarTech gives you the tools to quote,
            connect, monitor, and maintain systems across the Philippines.
          </p>
        </div>
      </section>

      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto grid gap-8 md:grid-cols-2">
          {segments.map((s) => (
            <div key={s.title} className="panel-card p-8 hover:border-solar-500/30 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-solar-500/10 flex items-center justify-center mb-4">
                <s.icon className="w-6 h-6 text-solar-500" />
              </div>
              <h2 className="text-xl font-bold mb-2">{s.title}</h2>
              <p className="text-sm text-muted-foreground mb-4">{s.desc}</p>
              <ul className="space-y-2 mb-6">
                {s.features.map((f) => (
                  <li key={f} className="text-sm flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-solar-500" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href={s.href}
                className="inline-flex items-center gap-2 text-sm font-semibold text-solar-500 hover:underline"
              >
                Get started <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ))}
        </div>
      </section>

      <section className="py-20 px-6 bg-accent/20">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-black text-center mb-4">Platform modules</h2>
          <p className="text-center text-muted-foreground mb-12 max-w-xl mx-auto">
            Mix and match capabilities as you grow from a single crew to a national portfolio.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {modules.map((m) => (
              <Link
                key={m.title}
                href={m.href}
                className="panel-card p-5 hover:border-solar-500/30 transition-colors group"
              >
                <m.icon className="w-5 h-5 text-solar-500 mb-3" />
                <h3 className="font-semibold group-hover:text-solar-500 transition-colors">{m.title}</h3>
                <p className="text-xs text-muted-foreground mt-1">{m.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto text-center panel-card rounded-3xl p-10">
          <h2 className="text-2xl font-black mb-3">See pricing or try it free</h2>
          <p className="text-muted-foreground mb-6">14-day trial, no credit card required.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/pricing"
              className="px-6 py-3 rounded-xl border border-border font-semibold hover:bg-accent transition-colors"
            >
              View pricing
            </Link>
            <Link
              href="/register"
              className="px-6 py-3 rounded-xl bg-gradient-solar text-white font-semibold hover:opacity-90"
            >
              Start free trial
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
