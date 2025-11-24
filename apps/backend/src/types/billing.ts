export type BillingSource = 'promo-credit' | 'customer-free-tier' | 'managed-free-tier' | 'card';

export interface BillingRecord {
  source: BillingSource;
  amountUsd: number;
  currency: string;
  promoCreditsUsed?: number;
  chargeId?: string;
  recordedAt: string;
}

export interface PaymentMethodSummary {
  id: string;
  brand?: string | null;
  last4?: string | null;
  expMonth?: number | null;
  expYear?: number | null;
  isDefault?: boolean;
}

export interface BillingOverview {
  promoCredits: number;
  freeJobsRemaining: number;
  paymentMethods: PaymentMethodSummary[];
  defaultPaymentMethodId?: string;
  requiresPaymentMethod: boolean;
  address?: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
}
