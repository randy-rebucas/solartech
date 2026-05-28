'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { User } from '@solartech/shared';
import {
  LayoutDashboard, Zap, Calculator, Store, Wrench, BarChart3,
  CreditCard, MapPin, Bell, Settings, ShieldCheck, Users,
  Sun, X, ChevronRight, Bot, BookOpen, Hammer,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { canAccessNav } from '@/lib/nav-access';
import { BOTTOM_NAV, MAIN_NAV } from '@/lib/dashboard-nav';

const ICONS: Record<string, React.ReactNode> = {
  '/dashboard': <LayoutDashboard className="w-4 h-4" />,
  '/systems': <Sun className="w-4 h-4" />,
  '/quotations': <Calculator className="w-4 h-4" />,
  '/marketplace': <Store className="w-4 h-4" />,
  '/devices': <Zap className="w-4 h-4" />,
  '/maintenance': <Wrench className="w-4 h-4" />,
  '/analytics': <BarChart3 className="w-4 h-4" />,
  '/smart-city': <MapPin className="w-4 h-4" />,
  '/billing': <CreditCard className="w-4 h-4" />,
  '/ai-assistant': <Bot className="w-4 h-4" />,
  '/notifications': <Bell className="w-4 h-4" />,
  '/knowledge': <BookOpen className="w-4 h-4" />,
  '/diy': <Hammer className="w-4 h-4" />,
  '/calculators': <Calculator className="w-4 h-4" />,
  '/admin': <ShieldCheck className="w-4 h-4" />,
  '/users': <Users className="w-4 h-4" />,
  '/settings': <Settings className="w-4 h-4" />,
};

interface Props {
  user: User;
  collapsed: boolean;
  onClose?: () => void;
}

export function Sidebar({ user, collapsed, onClose }: Props) {
  const pathname = usePathname();

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(href + '/');
  }

  function NavLink({ href, label }: { href: string; label: string }) {
    const active = isActive(href);
    const icon = ICONS[href] ?? <LayoutDashboard className="w-4 h-4" />;
    return (
      <Link
        href={href}
        className={cn(
          'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150',
          collapsed ? 'justify-center px-2' : '',
          active
            ? 'bg-solar-500/15 text-solar-500 dark:text-solar-400'
            : 'text-muted-foreground hover:text-foreground hover:bg-accent',
        )}
        title={collapsed ? label : undefined}
      >
        <span className={cn('flex-shrink-0', active && 'text-solar-500 dark:text-solar-400')}>
          {icon}
        </span>
        {!collapsed && (
          <>
            <span className="flex-1 truncate">{label}</span>
            {active && <ChevronRight className="w-3 h-3 opacity-40" />}
          </>
        )}
      </Link>
    );
  }

  const mainItems = MAIN_NAV.filter((item) => canAccessNav(user.role, item.access));
  const bottomItems = BOTTOM_NAV.filter((item) => canAccessNav(user.role, item.access));

  return (
    <div className="flex flex-col h-full">
      <div className={cn('flex items-center gap-2.5 p-4 border-b border-border', collapsed && 'justify-center')}>
        <div className="w-8 h-8 rounded-lg bg-gradient-solar flex items-center justify-center flex-shrink-0 shadow-glow">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="4" fill="white" />
            <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12" stroke="white" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
        {!collapsed && <span className="font-bold text-lg gradient-text">SolarTech</span>}
        {onClose && (
          <button type="button" onClick={onClose} className="ml-auto p-1 rounded hover:bg-accent">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {mainItems.map((item) => (
          <NavLink key={item.href} href={item.href} label={item.label} />
        ))}
      </nav>

      <div className="p-2 border-t border-border space-y-0.5">
        {bottomItems.map((item) => (
          <NavLink key={item.href} href={item.href} label={item.label} />
        ))}
      </div>

      {!collapsed && (
        <div className="p-3 border-t border-border">
          <div className="flex items-center gap-3 px-2 py-1.5 rounded-lg hover:bg-accent transition-colors">
            <div className="w-8 h-8 rounded-full bg-gradient-solar flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {user.firstName[0]}{user.lastName[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user.firstName} {user.lastName}</p>
              <p className="text-xs text-muted-foreground capitalize truncate">
                {user.role.replace(/_/g, ' ')}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
