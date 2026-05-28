import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Sun } from 'lucide-react';

export const metadata: Metadata = {
  title: 'About | SolarTech',
  description: 'SolarTech — AI-powered solar energy management built for the Philippines.',
};

export default function AboutPage() {
  return (
    <div className="py-20 px-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-solar flex items-center justify-center shadow-glow">
            <Sun className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-4xl font-black">About SolarTech</h1>
        </div>

        <div className="space-y-6 text-muted-foreground leading-relaxed">
          <p>
            SolarTech is an AI-powered platform for solar companies, installers, LGUs, and homeowners
            in the Philippines. We help teams quote faster, connect IoT devices, monitor production in
            real time, and maintain fleets at scale.
          </p>
          <p>
            Our mission is to accelerate solar adoption by giving every stakeholder — from the installer
            on the roof to the city energy officer — the same reliable data and tools.
          </p>
          <p>
            Built with modern IoT (MQTT), OpenAI-assisted analytics, and maps tailored to Philippine
            provinces and utilities.
          </p>
        </div>

        <div className="mt-12 flex flex-wrap gap-4">
          <Link
            href="/solutions"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-border font-semibold hover:bg-accent transition-colors"
          >
            Our solutions
          </Link>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-solar text-white font-semibold hover:opacity-90"
          >
            Get started <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
