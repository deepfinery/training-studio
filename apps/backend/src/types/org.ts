export type OrgRole = 'admin' | 'standard';

export interface BillingAddress {
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

export interface Org {
  id: string;
  name: string;
  slug: string;
  stripeCustomerId?: string;
  promoCredits: number;
  freeJobsConsumed: number;
  defaultClusterId?: string;
  billingAddress?: BillingAddress;
  createdAt: string;
  updatedAt: string;
}

export interface OrgMembership {
  id: string;
  orgId: string;
  userId: string;
  role: OrgRole;
  createdAt: string;
  updatedAt: string;
}

export interface OrgContext {
  org: Org;
  membership: OrgMembership;
  isGlobalAdmin: boolean;
}
