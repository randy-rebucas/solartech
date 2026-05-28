import { FileText, Clock, CheckCircle2, XCircle, type LucideIcon } from 'lucide-react';

export const QUOTATION_STATUS = [
  'draft',
  'pending',
  'approved',
  'rejected',
  'expired',
] as const;

export type QuotationStatus = (typeof QUOTATION_STATUS)[number];

export const QUOTATION_APPROVAL_STATUS = ['approved', 'rejected', 'expired'] as const;

export const QUOTATION_STATUS_CONFIG: Record<
  QuotationStatus,
  { label: string; color: string; bg: string; icon: LucideIcon }
> = {
  draft:    { label: 'Draft',    color: 'text-muted-foreground', bg: 'bg-muted',           icon: FileText },
  pending:  { label: 'Pending',  color: 'text-yellow-500',       bg: 'bg-yellow-500/10',   icon: Clock },
  approved: { label: 'Approved', color: 'text-solar-500',        bg: 'bg-solar-500/10',    icon: CheckCircle2 },
  rejected: { label: 'Rejected', color: 'text-destructive',      bg: 'bg-destructive/10',  icon: XCircle },
  expired:  { label: 'Expired',  color: 'text-muted-foreground', bg: 'bg-muted',           icon: Clock },
};

export function getQuotationStatusConfig(status: string) {
  return QUOTATION_STATUS_CONFIG[status as QuotationStatus] ?? QUOTATION_STATUS_CONFIG.draft;
}
