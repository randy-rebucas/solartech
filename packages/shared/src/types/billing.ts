export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
export type PaymentMethod = 'stripe' | 'paypal' | 'gcash' | 'paymaya' | 'bank_transfer' | 'cash';

export interface Invoice {
  id: string;
  invoiceNumber: string;
  clientId: string;
  organizationId: string;
  projectId?: string;
  status: InvoiceStatus;
  lineItems: InvoiceLineItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  discountAmount: number;
  total: number;
  currency: string;
  dueDate: string;
  paidAt?: string;
  paymentMethod?: PaymentMethod;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface FinancingPlan {
  id: string;
  clientId: string;
  organizationId: string;
  projectId: string;
  type: 'installment' | 'loan' | 'lease' | 'ppa';
  totalAmount: number;
  downPayment: number;
  financedAmount: number;
  interestRate: number;
  termMonths: number;
  monthlyPayment: number;
  startDate: string;
  endDate: string;
  status: 'active' | 'completed' | 'defaulted' | 'cancelled';
  installments: Installment[];
  createdAt: string;
}

export interface Installment {
  id: string;
  dueDate: string;
  amount: number;
  principal: number;
  interest: number;
  balance: number;
  status: 'pending' | 'paid' | 'overdue';
  paidAt?: string;
}

export interface Subscription {
  id: string;
  organizationId: string;
  plan: 'starter' | 'professional' | 'enterprise';
  status: 'active' | 'past_due' | 'cancelled' | 'trialing';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  stripeSubscriptionId?: string;
  cancelAt?: string;
}
