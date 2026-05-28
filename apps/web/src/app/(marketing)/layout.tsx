import type { ReactNode } from 'react';
import Link from 'next/link';
import { Sun } from 'lucide-react';

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-solar flex items-center justify-center shadow-glow">
              <Sun className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-xl gradient-text">SolarTech</span>
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
            <Link href="/solutions" className="hover:text-foreground transition-colors">Solutions</Link>
            <Link href="/pricing" className="hover:text-foreground transition-colors">Pricing</Link>
            <Link href="/diy" className="hover:text-foreground transition-colors">DIY Guide</Link>
            <Link href="/calculators" className="hover:text-foreground transition-colors">Calculators</Link>
            <Link href="/help" className="hover:text-foreground transition-colors">Help</Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm px-4 py-2 rounded-lg hover:bg-accent transition-colors">Sign in</Link>
            <Link href="/register" className="text-sm px-4 py-2 rounded-lg bg-gradient-solar text-white hover:opacity-90 font-medium">Get Started</Link>
          </div>
        </div>
      </header>
      <main className="pt-16">{children}</main>
      <footer className="border-t border-border py-12 mt-24">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-sm text-muted-foreground">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded bg-gradient-solar flex items-center justify-center">
                <Sun className="w-3 h-3 text-white" />
              </div>
              <span className="font-bold text-foreground">SolarTech</span>
            </div>
            <p>AI-powered solar energy management for the Philippines.</p>
          </div>
          {[
            {
              title: 'Product',
              links: [
                { label: 'DIY Guide', href: '/diy' },
                { label: 'Calculators', href: '/calculators' },
                { label: 'Help Center', href: '/help' },
                { label: 'Pricing', href: '/pricing' },
              ],
            },
            {
              title: 'Company',
              links: [
                { label: 'About', href: '/about' },
                { label: 'Blog', href: '#' },
                { label: 'Careers', href: '#' },
              ],
            },
            {
              title: 'Legal',
              links: [
                { label: 'Privacy', href: '#' },
                { label: 'Terms', href: '#' },
                { label: 'Security', href: '#' },
              ],
            },
          ].map((col) => (
            <div key={col.title}>
              <h4 className="font-semibold text-foreground mb-3">{col.title}</h4>
              <ul className="space-y-2">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link href={l.href} className="hover:text-foreground transition-colors">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="max-w-7xl mx-auto px-6 mt-8 pt-8 border-t border-border text-xs text-muted-foreground">
          © 2024 SolarTech Philippines. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
