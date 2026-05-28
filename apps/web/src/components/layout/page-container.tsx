import { cn } from '@/lib/utils';

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
}

/** Shared dashboard page layout — width and padding come from DashboardShell. */
export function PageContainer({ children, className }: PageContainerProps) {
  return <div className={cn('space-y-6', className)}>{children}</div>;
}
