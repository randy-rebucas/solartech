import {
  Rocket, Sun, Calculator, Zap, Wrench, CreditCard, Shield,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const ICONS = {
  rocket: Rocket,
  sun: Sun,
  calculator: Calculator,
  zap: Zap,
  wrench: Wrench,
  'credit-card': CreditCard,
  shield: Shield,
} as const;

export function CategoryIcon({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  const Icon = ICONS[name as keyof typeof ICONS] ?? Sun;
  return <Icon className={cn('w-5 h-5', className)} />;
}
