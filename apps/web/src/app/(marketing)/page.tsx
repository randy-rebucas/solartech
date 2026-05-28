import type { Metadata } from 'next';
import Link from 'next/link';
import { Sun, Zap, BarChart2, Shield, Bot, Map, ArrowRight, CheckCircle, Star } from 'lucide-react';

export const metadata: Metadata = {
  title: 'SolarTech – AI-Powered Solar Energy Management',
  description: 'The complete platform for solar companies, installers, and homeowners in the Philippines.',
};

const features = [
  { icon: Zap, title: 'Real-time IoT Monitoring', desc: 'Live MQTT telemetry from every panel, inverter, and battery. Instant alerts on anomalies.' },
  { icon: BarChart2, title: 'AI Energy Analytics', desc: 'GPT-4o powered insights, anomaly detection, and energy forecasting for your solar fleet.' },
  { icon: Bot, title: 'SolarBot Assistant', desc: 'Ask any question about your system in plain language. Get actionable recommendations 24/7.' },
  { icon: Map, title: 'Smart City Dashboard', desc: 'LGU-level solar adoption maps, carbon impact reports, and province-level analytics.' },
  { icon: Shield, title: 'Maintenance CRM', desc: 'Work orders, SLA tracking, technician dispatch, and parts management in one place.' },
  { icon: Sun, title: 'Solar Quotation Engine', desc: 'Physics-based sizing calculator with AI-enhanced recommendations and instant ROI reports.' },
];

const stats = [
  { value: '1,200+', label: 'Solar Systems Monitored' },
  { value: '8.4 MW', label: 'Total Installed Capacity' },
  { value: '2,340t', label: 'CO₂ Reduced Annually' },
  { value: '98.2%', label: 'Platform Uptime' },
];

const plans = [
  { name: 'Starter', price: '₱2,999', period: '/mo', features: ['Up to 5 systems', '10 devices', 'Basic analytics', 'Email support'], cta: 'Start Free Trial', featured: false },
  { name: 'Professional', price: '₱9,999', period: '/mo', features: ['Up to 50 systems', '200 devices', 'AI analytics', 'Smart City access', 'Priority support', 'API access'], cta: 'Get Professional', featured: true },
  { name: 'Enterprise', price: 'Custom', period: '', features: ['Unlimited systems', 'Unlimited devices', 'White-label option', 'Dedicated support', 'SLA guarantee', 'Custom integrations'], cta: 'Contact Sales', featured: false },
];

const testimonials = [
  { name: 'Maria Santos', role: 'CEO, EcoSolar PH', text: 'SolarTech transformed how we manage 200+ client installations. The AI anomaly detection alone saved us 3 service calls per month.', rating: 5 },
  { name: 'Juan dela Cruz', role: 'Solar Homeowner', text: 'I can see my panels\' output in real time, get AI insights, and my installer can remotely diagnose issues. Incredible.', rating: 5 },
  { name: 'Engr. Pedro Reyes', role: 'LGU Energy Officer', text: 'The Smart City analytics gave our municipality the data we needed to expand our solar incentive program.', rating: 5 },
];

export default function HomePage() {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden py-24 px-6">
        <div className="absolute inset-0 bg-gradient-to-br from-solar-500/10 via-transparent to-emerald-500/10" />
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-solar-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-1/4 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="relative max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-solar-500/10 border border-solar-500/20 text-solar-400 text-sm font-medium mb-6">
            <Sun className="w-3.5 h-3.5" /> AI-Powered Solar Management Platform
          </div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-6">
            Manage Your Solar
            <span className="gradient-text block">Empire Intelligently</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            The all-in-one platform for solar companies, installers, and homeowners in the Philippines. Real-time IoT monitoring, AI analytics, and smart city insights — all in one place.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register" className="flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-gradient-solar text-white font-semibold text-lg hover:opacity-90 shadow-glow transition-all">
              Start Free Trial <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="/dashboard" className="flex items-center justify-center gap-2 px-8 py-4 rounded-xl border border-border hover:bg-accent transition-colors font-semibold text-lg">
              View Live Demo
            </Link>
          </div>
          <p className="text-xs text-muted-foreground mt-4">No credit card required · 14-day free trial · Cancel anytime</p>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 px-6 border-y border-border">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-4xl font-black gradient-text">{s.value}</p>
              <p className="text-sm text-muted-foreground mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black mb-4">Everything you need to manage solar at scale</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">From real-time device monitoring to AI-powered insights and LGU analytics — SolarTech covers the entire solar lifecycle.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div key={f.title} className="panel-card p-6 hover:border-solar-500/30 transition-colors group">
                <div className="w-12 h-12 rounded-xl bg-solar-500/10 flex items-center justify-center mb-4 group-hover:bg-solar-500/20 transition-colors">
                  <f.icon className="w-6 h-6 text-solar-400" />
                </div>
                <h3 className="font-bold text-lg mb-2">{f.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 px-6 bg-accent/20">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-black text-center mb-16">Trusted by solar professionals</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <div key={t.name} className="panel-card p-6">
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-solar-400 text-solar-400" />
                  ))}
                </div>
                <p className="text-sm leading-relaxed mb-4">"{t.text}"</p>
                <div>
                  <p className="font-semibold text-sm">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black mb-4">Simple, transparent pricing</h2>
            <p className="text-muted-foreground">Scale from a single system to an enterprise fleet.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((p) => (
              <div key={p.name} className={`rounded-2xl p-6 border ${p.featured ? 'border-solar-500/50 bg-solar-500/5 relative shadow-card-hover' : 'panel-card'}`}>
                {p.featured && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-solar text-white text-xs font-bold rounded-full">
                    Most Popular
                  </div>
                )}
                <h3 className="font-bold text-xl">{p.name}</h3>
                <div className="mt-3 mb-6">
                  <span className="text-4xl font-black">{p.price}</span>
                  <span className="text-muted-foreground text-sm">{p.period}</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="/register"
                  className={`block text-center py-3 rounded-xl font-semibold text-sm transition-opacity ${p.featured ? 'bg-gradient-solar text-white hover:opacity-90' : 'border border-border hover:bg-accent'}`}>
                  {p.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto text-center panel-card rounded-3xl p-12">
          <h2 className="text-4xl font-black mb-4">Ready to power the future?</h2>
          <p className="text-muted-foreground text-lg mb-8">Join 1,200+ solar professionals already using SolarTech to manage, monitor, and grow their solar businesses.</p>
          <Link href="/register"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-solar text-white font-semibold text-lg hover:opacity-90 shadow-glow">
            Start Free 14-Day Trial <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
