import type { KbCategory } from './types';

export const KB_CATEGORIES: KbCategory[] = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    description: 'Account setup, navigation, and your first steps on SolarTech.',
    icon: 'rocket',
  },
  {
    id: 'systems-monitoring',
    title: 'Systems & Monitoring',
    description: 'Solar systems, production dashboards, and alerts.',
    icon: 'sun',
  },
  {
    id: 'quotations',
    title: 'Quotations & Sales',
    description: 'Sizing, ROI reports, and closing proposals.',
    icon: 'calculator',
  },
  {
    id: 'devices-iot',
    title: 'Devices & IoT',
    description: 'MQTT setup, gateways, and telemetry.',
    icon: 'zap',
  },
  {
    id: 'operations',
    title: 'Operations',
    description: 'Maintenance, marketplace, and smart city tools.',
    icon: 'wrench',
  },
  {
    id: 'billing',
    title: 'Billing & Plans',
    description: 'Invoices, payments, and subscriptions.',
    icon: 'credit-card',
  },
  {
    id: 'account',
    title: 'Account & Security',
    description: 'Roles, MFA, and organization settings.',
    icon: 'shield',
  },
];
