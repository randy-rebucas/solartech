import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, CheckCircle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Pricing | SolarTech',
  description: 'Simple, transparent pricing for solar companies, installers, and enterprises in the Philippines.',
};

const plans = [
  {
    name: 'Starter',
    price: '₱2,999',
    period: '/mo',
    features: ['Up to 5 systems', '10 devices', 'Basic analytics', 'Email support'],
    cta: 'Start Free Trial',
    featured: false,
  },
  {
    name: 'Professional',
    price: '₱9,999',
    period: '/mo',
    features: ['Up to 50 systems', '200 devices', 'AI analytics', 'Smart City access', 'Priority support', 'API access'],
    cta: 'Get Professional',
    featured: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    features: ['Unlimited systems', 'Unlimited devices', 'White-label option', 'Dedicated support', 'SLA guarantee', 'Custom integrations'],
    cta: 'Contact Sales',
    featured: false,
  },
];

export default function PricingPage() {
  return (
    <div className="py-20 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-black mb-4">Simple, transparent pricing</h1>
          <p className="text-muted-foreground text-lg">Scale from a single system to an enterprise fleet.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((p) => (
            <div
              key={p.name}
              className={`rounded-2xl p-6 border ${
                p.featured
                  ? 'border-solar-500/50 bg-solar-500/5 relative shadow-lg'
                  : 'panel-card'
              }`}
            >
              {p.featured && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-solar text-white text-xs font-bold rounded-full">
                  Most Popular
                </div>
              )}
              <h2 className="font-bold text-xl">{p.name}</h2>
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
              <Link
                href="/register"
                className={`block text-center py-3 rounded-xl font-semibold text-sm transition-opacity ${
                  p.featured
                    ? 'bg-gradient-solar text-white hover:opacity-90'
                    : 'border border-border hover:bg-accent'
                }`}
              >
                {p.cta}
              </Link>
            </div>
          ))}
        </div>

        <p className="text-center text-sm text-muted-foreground mt-12">
          All plans include a 14-day free trial.{' '}
          <Link href="/solutions" className="text-solar-500 hover:underline">
            Compare solutions
          </Link>{' '}
          or{' '}
          <Link href="/help" className="text-solar-500 hover:underline">
            read the docs
          </Link>
          .
        </p>

        <div className="mt-16 text-center">
          <Link
            href="/register"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-solar text-white font-semibold hover:opacity-90"
          >
            Start free trial <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
