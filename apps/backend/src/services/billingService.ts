import Stripe from 'stripe';
import { env } from '../config/env';
import { BillingOverview, BillingRecord, BillingSource, PaymentMethodSummary } from '../types/billing';
import { Cluster } from '../types/cluster';
import { Org } from '../types/org';
import { TrainingJob } from '../types/training';
import { orgService } from './orgService';

const stripeClient = env.STRIPE_SECRET_KEY ? new Stripe(env.STRIPE_SECRET_KEY) : null;

export interface BillingPlan {
  mode: BillingSource;
  amountUsd: number;
  promoCreditsToConsume?: number;
  freeTierIncrement?: number;
  requiresCharge: boolean;
}

function toPaymentSummary(pm: Stripe.PaymentMethod, defaultId?: string): PaymentMethodSummary {
  return {
    id: pm.id,
    brand: pm.card?.brand,
    last4: pm.card?.last4,
    expMonth: pm.card?.exp_month,
    expYear: pm.card?.exp_year,
    isDefault: pm.id === defaultId
  };
}

class BillingService {
  private assertStripe() {
    if (!stripeClient) {
      throw new Error('Stripe is not configured. Set STRIPE_SECRET_KEY.');
    }
    return stripeClient;
  }

  async ensureCustomer(org: Org): Promise<Org> {
    if (org.stripeCustomerId) return org;
    const stripe = this.assertStripe();
    const customer = await stripe.customers.create({
      name: org.name,
      metadata: { orgId: org.id }
    });

    return orgService.updateOrg(org.id, { stripeCustomerId: customer.id });
  }

  private async getCustomer(org: Org) {
    const stripe = this.assertStripe();
    const ensured = await this.ensureCustomer(org);
    const customer = await stripe.customers.retrieve(ensured.stripeCustomerId!);
    if (customer.deleted) {
      throw new Error('Stripe customer is deleted');
    }
    return customer;
  }

  private async requirePaymentMethod(org: Org) {
    const stripe = this.assertStripe();
    const customer = await this.getCustomer(org);
    const paymentMethods = await stripe.paymentMethods.list({
      customer: customer.id,
      type: 'card'
    });

    if (paymentMethods.data.length === 0 || !customer.invoice_settings.default_payment_method) {
      throw new Error('Add a default credit card before launching jobs.');
    }
  }

  async planJobCharge(org: Org, cluster: Cluster): Promise<BillingPlan> {
    if (!stripeClient) {
      return {
        mode: 'customer-free-tier',
        amountUsd: 0,
        freeTierIncrement: 1,
        requiresCharge: false
      };
    }

    await this.ensureCustomer(org);
    await this.requirePaymentMethod(org);

    if (org.promoCredits > 0) {
      return {
        mode: 'promo-credit',
        amountUsd: 0,
        promoCreditsToConsume: 1,
        requiresCharge: false
      };
    }

    if (cluster.kind === 'customer') {
      if ((org.freeJobsConsumed ?? 0) < env.ORG_FREE_JOB_LIMIT) {
        return {
          mode: 'customer-free-tier',
          amountUsd: 0,
          freeTierIncrement: 1,
          requiresCharge: false
        };
      }
    }

    if (!cluster.requiresPayment && cluster.kind === 'managed') {
      return {
        mode: 'managed-free-tier',
        amountUsd: 0,
        requiresCharge: false
      };
    }

    return {
      mode: 'card',
      amountUsd: env.JOB_FLAT_RATE_USD,
      requiresCharge: true
    };
  }

  async commitJobCharge(org: Org, job: TrainingJob, plan: BillingPlan): Promise<BillingRecord> {
    const now = new Date().toISOString();

    if (plan.mode === 'promo-credit' && plan.promoCreditsToConsume) {
      await orgService.adjustPromoCredits(org.id, -plan.promoCreditsToConsume);
      return {
        source: 'promo-credit',
        amountUsd: 0,
        currency: 'usd',
        promoCreditsUsed: plan.promoCreditsToConsume,
        recordedAt: now
      };
    }

    if (plan.mode === 'customer-free-tier' && plan.freeTierIncrement) {
      await orgService.incrementFreeJobs(org.id, plan.freeTierIncrement);
      return {
        source: 'customer-free-tier',
        amountUsd: 0,
        currency: 'usd',
        recordedAt: now
      };
    }

    if (plan.mode === 'managed-free-tier') {
      return {
        source: 'managed-free-tier',
        amountUsd: 0,
        currency: 'usd',
        recordedAt: now
      };
    }

    const stripe = this.assertStripe();
    const customer = await this.getCustomer(org);
    const paymentIntent = await stripe.paymentIntents.create({
      customer: customer.id,
      amount: Math.round(plan.amountUsd * 100),
      currency: 'usd',
      confirm: true,
      automatic_payment_methods: { enabled: true },
      description: `Training job ${job.name ?? job.id}`,
      metadata: {
        jobId: job.id,
        orgId: org.id
      }
    });

    return {
      source: 'card',
      amountUsd: plan.amountUsd,
      currency: 'usd',
      chargeId: paymentIntent.id,
      recordedAt: now
    };
  }

  async getOverview(org: Org): Promise<BillingOverview> {
    if (!stripeClient) {
      return {
        promoCredits: org.promoCredits,
        freeJobsRemaining: Math.max(0, env.ORG_FREE_JOB_LIMIT - org.freeJobsConsumed),
        paymentMethods: [],
        requiresPaymentMethod: true
      };
    }

    const stripe = this.assertStripe();
    const ensured = await this.ensureCustomer(org);
    const customer = await stripe.customers.retrieve(ensured.stripeCustomerId!);
    if (customer.deleted) {
      throw new Error('Stripe customer missing');
    }

    const paymentMethods = await stripe.paymentMethods.list({
      customer: customer.id,
      type: 'card'
    });

    const defaultSetting = customer.invoice_settings?.default_payment_method;
    let defaultPm: string | undefined;
    if (typeof defaultSetting === 'string') {
      defaultPm = defaultSetting;
    } else if (defaultSetting) {
      defaultPm = defaultSetting.id;
    }

    return {
      promoCredits: ensured.promoCredits,
      freeJobsRemaining: Math.max(0, env.ORG_FREE_JOB_LIMIT - ensured.freeJobsConsumed),
      paymentMethods: paymentMethods.data.map(pm => toPaymentSummary(pm, defaultPm)),
      defaultPaymentMethodId: defaultPm,
      requiresPaymentMethod: paymentMethods.data.length === 0 || !defaultPm,
      address: ensured.billingAddress
    };
  }

  async createSetupIntent(org: Org) {
    const stripe = this.assertStripe();
    const ensured = await this.ensureCustomer(org);
    const setupIntent = await stripe.setupIntents.create({
      customer: ensured.stripeCustomerId,
      payment_method_types: ['card']
    });
    return { clientSecret: setupIntent.client_secret };
  }

  async attachPaymentMethod(org: Org, paymentMethodId: string, makeDefault = true) {
    const stripe = this.assertStripe();
    const ensured = await this.ensureCustomer(org);
    await stripe.paymentMethods.attach(paymentMethodId, { customer: ensured.stripeCustomerId! });
    if (makeDefault) {
      await stripe.customers.update(ensured.stripeCustomerId!, {
        invoice_settings: { default_payment_method: paymentMethodId }
      });
    }
  }

  async removePaymentMethod(org: Org, paymentMethodId: string) {
    const stripe = this.assertStripe();
    const ensured = await this.ensureCustomer(org);
    await stripe.paymentMethods.detach(paymentMethodId);
    const customer = await stripe.customers.retrieve(ensured.stripeCustomerId!);
    if (!customer.deleted && customer.invoice_settings.default_payment_method === paymentMethodId) {
      await stripe.customers.update(ensured.stripeCustomerId!, {
        invoice_settings: { default_payment_method: null as unknown as string }
      });
    }
  }

  async setDefaultPaymentMethod(org: Org, paymentMethodId: string) {
    const stripe = this.assertStripe();
    const ensured = await this.ensureCustomer(org);
    await stripe.customers.update(ensured.stripeCustomerId!, {
      invoice_settings: { default_payment_method: paymentMethodId }
    });
  }

  async updateBillingAddress(org: Org, address: Org['billingAddress']) {
    const stripe = this.assertStripe();
    const ensured = await this.ensureCustomer(org);
    await stripe.customers.update(ensured.stripeCustomerId!, {
      address: {
        line1: address?.line1,
        line2: address?.line2,
        city: address?.city,
        state: address?.state,
        postal_code: address?.postalCode,
        country: address?.country
      }
    });

    await orgService.updateOrg(org.id, { billingAddress: address });
  }

  async applyPromoCode(org: Org, code: string) {
    const normalized = code.trim().toUpperCase();
    const promoMap: Record<string, number> = {
      LAUNCHPAD: 5,
      SCALE100: 10,
      BETAACCESS: 3
    };

    const credits = promoMap[normalized];
    if (!credits) {
      throw new Error('Invalid promo code');
    }

    return orgService.adjustPromoCredits(org.id, credits);
  }
}

export const billingService = new BillingService();
