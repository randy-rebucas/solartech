import type { Permission, UserRole } from '@solartech/shared';
import type { NavAccessRule } from './nav-access';

export type DashboardNavItem = {
  label: string;
  href: string;
  access?: NavAccessRule;
};

export const MAIN_NAV: DashboardNavItem[] = [
  { label: 'Dashboard', href: '/dashboard' },
  {
    label: 'Solar Systems',
    href: '/systems',
    access: {
      roles: ['super_admin', 'solar_company', 'installer', 'technician', 'client'],
    },
  },
  {
    label: 'Quotations',
    href: '/quotations',
    access: { permissions: ['quotations:read'] },
  },
  {
    label: 'Marketplace',
    href: '/marketplace',
    access: {
      roles: ['super_admin', 'solar_company', 'installer', 'client'],
      permissions: ['installers:read', 'installers:write'],
    },
  },
  {
    label: 'Devices / IoT',
    href: '/devices',
    access: { permissions: ['devices:read'] },
  },
  {
    label: 'Maintenance',
    href: '/maintenance',
    access: { permissions: ['maintenance:read'] },
  },
  {
    label: 'Analytics',
    href: '/analytics',
    access: { permissions: ['analytics:read'] },
  },
  {
    label: 'Reports',
    href: '/reports',
    access: { permissions: ['analytics:read', 'billing:read', 'maintenance:read'] },
  },
  {
    label: 'Smart City',
    href: '/smart-city',
    access: {
      roles: ['super_admin', 'lgu_officer', 'solar_company'],
      permissions: ['smart_city:read'],
    },
  },
  {
    label: 'Billing',
    href: '/billing',
    access: { permissions: ['billing:read'] },
  },
  {
    label: 'AI Assistant',
    href: '/ai-assistant',
    access: { permissions: ['analytics:read'] },
  },
  { label: 'Notifications', href: '/notifications' },
];

export const BOTTOM_NAV: DashboardNavItem[] = [
  { label: 'Knowledge Base', href: '/knowledge' },
  { label: 'DIY Guide', href: '/diy' },
  { label: 'Calculators', href: '/calculators' },
  {
    label: 'Admin',
    href: '/admin',
    access: { permissions: ['admin:read'] },
  },
  {
    label: 'Users',
    href: '/users',
    access: {
      roles: ['super_admin', 'solar_company'],
      permissions: ['clients:write', 'admin:read'],
    },
  },
  { label: 'Settings', href: '/settings' },
];

export function defaultLandingPath(role: UserRole): string {
  if (role === 'lgu_officer') return '/smart-city';
  if (role === 'technician') return '/maintenance';
  if (role === 'finance_officer') return '/billing';
  if (role === 'client' || role === 'investor') return '/dashboard';
  return '/dashboard';
}

/** Where to send the user immediately after login / register. */
export function postLoginPath(role: UserRole): string {
  return defaultLandingPath(role);
}
