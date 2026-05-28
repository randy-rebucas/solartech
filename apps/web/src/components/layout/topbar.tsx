'use client';

import { useTheme } from 'next-themes';
import type { User } from '@solartech/shared';
import {
  Menu, Sun, Moon, Bell, Search, ChevronDown, LogOut,
  Settings, User as UserIcon, LayoutDashboard,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { logoutAction } from '@/lib/auth/actions';
import { useState } from 'react';

interface Props {
  user: User;
  onToggleSidebar: () => void;
  onOpenMobileSidebar: () => void;
}

export function Topbar({ user, onToggleSidebar, onOpenMobileSidebar }: Props) {
  const { theme, setTheme } = useTheme();
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  return (
    <header className="relative z-30 flex flex-shrink-0 items-center gap-3 border-b border-border bg-card/50 px-4 backdrop-blur-sm h-14">
      {/* Sidebar toggles */}
      <button
        onClick={onToggleSidebar}
        className="hidden lg:flex p-2 rounded-lg hover:bg-accent transition-colors"
      >
        <Menu className="w-4 h-4" />
      </button>
      <button
        onClick={onOpenMobileSidebar}
        className="flex lg:hidden p-2 rounded-lg hover:bg-accent transition-colors"
      >
        <Menu className="w-4 h-4" />
      </button>

      {/* Search */}
      <div className="flex-1 max-w-sm hidden md:block">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="search"
            placeholder="Search systems, clients, devices…"
            className={cn(
              'w-full pl-9 pr-4 py-1.5 text-sm rounded-lg bg-accent border-0',
              'focus:outline-none focus:ring-2 focus:ring-solar-500/40 placeholder:text-muted-foreground',
            )}
          />
        </div>
      </div>

      <div className="flex items-center gap-1 ml-auto">
        {/* Theme toggle */}
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="p-2 rounded-lg hover:bg-accent transition-colors"
        >
          {theme === 'dark'
            ? <Sun className="w-4 h-4" />
            : <Moon className="w-4 h-4" />
          }
        </button>

        {/* Notifications */}
        <button className="relative p-2 rounded-lg hover:bg-accent transition-colors">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-solar-500 rounded-full" />
        </button>

        {/* User menu */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setUserMenuOpen((v) => !v)}
            className="flex items-center gap-2 rounded-lg py-1.5 pl-2 pr-3 transition-colors hover:bg-accent"
          >
            <div className="w-7 h-7 rounded-full bg-gradient-solar flex items-center justify-center text-white text-xs font-bold">
              {user.firstName[0]}{user.lastName[0]}
            </div>
            <span className="text-sm font-medium hidden sm:block">{user.firstName}</span>
            <ChevronDown className={cn('w-3 h-3 transition-transform', userMenuOpen && 'rotate-180')} />
          </button>

          {userMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-40 bg-transparent"
                aria-hidden
                onClick={() => setUserMenuOpen(false)}
              />
              <div
                role="menu"
                className="absolute right-0 top-full z-50 mt-1 w-52 overflow-hidden rounded-xl border border-border bg-popover text-popover-foreground shadow-card-hover"
              >
                <div className="px-3 py-2.5 border-b border-border">
                  <p className="text-sm font-medium">{user.firstName} {user.lastName}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
                <div className="p-1">
                  {[
                    { icon: <LayoutDashboard className="w-4 h-4" />, label: 'Dashboard', href: '/dashboard' },
                    { icon: <UserIcon className="w-4 h-4" />,        label: 'Profile',   href: '/settings/profile' },
                    { icon: <Settings className="w-4 h-4" />,        label: 'Settings',  href: '/settings' },
                  ].map((item) => (
                    <a
                      key={item.href}
                      href={item.href}
                      className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm hover:bg-accent transition-colors"
                    >
                      <span className="text-muted-foreground">{item.icon}</span>
                      {item.label}
                    </a>
                  ))}
                </div>
                <div className="p-1 border-t border-border">
                  <form action={logoutAction}>
                    <button
                      type="submit"
                      className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm w-full hover:bg-destructive/10 text-destructive transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign out
                    </button>
                  </form>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
