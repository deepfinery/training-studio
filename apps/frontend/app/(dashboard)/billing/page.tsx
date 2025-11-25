'use client';

import { useEffect, useState } from 'react';
import useSWR, { mutate } from 'swr';
import { CardElement, Elements, useElements, useStripe } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import {
  applyPromoCode,
  attachPaymentMethod,
  BillingOverview,
  createSetupIntent,
  fetchBillingOverview,
  removePaymentMethod,
  setDefaultPaymentMethod,
  updateBillingAddress
} from '../../../lib/api';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? '');
const billingPortalUrl = process.env.NEXT_PUBLIC_STRIPE_PORTAL_URL;

function BillingContent() {
  const { data: overview } = useSWR<BillingOverview>('billing-overview', fetchBillingOverview);
  const stripe = useStripe();
  const elements = useElements();
  const [cardStatus, setCardStatus] = useState<string | null>(null);
  const [cardBusy, setCardBusy] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [promoStatus, setPromoStatus] = useState<string | null>(null);
  const [address, setAddress] = useState(overview?.address ?? {});
  const [addressStatus, setAddressStatus] = useState<string | null>(null);

  const handleAddCard = async () => {
    if (!stripe || !elements) return;
    const card = elements.getElement(CardElement);
    if (!card) return;

    setCardBusy(true);
    setCardStatus('Saving card...');
    try {
      const intent = await createSetupIntent();
      const confirmation = await stripe.confirmCardSetup(intent.clientSecret, {
        payment_method: {
          card
        }
      });
      if (confirmation.error) {
        throw new Error(confirmation.error.message);
      }
      const paymentMethodId = confirmation.setupIntent?.payment_method;
      if (typeof paymentMethodId !== 'string') {
        throw new Error('Missing payment method ID');
      }
      await attachPaymentMethod(paymentMethodId, true);
      mutate('billing-overview');
      card.clear();
      setCardStatus('Card saved as default.');
    } catch (error) {
      setCardStatus(error instanceof Error ? error.message : 'Unable to save card');
    } finally {
      setCardBusy(false);
    }
  };

  const handlePromo = async () => {
    setPromoStatus(null);
    try {
      await applyPromoCode(promoCode);
      mutate('billing-overview');
      setPromoCode('');
      setPromoStatus('Promo applied.');
    } catch (error) {
      setPromoStatus(error instanceof Error ? error.message : 'Unable to apply promo');
    }
  };

  const handleAddressUpdate = async () => {
    setAddressStatus('Saving address...');
    try {
      await updateBillingAddress(address);
      mutate('billing-overview');
      setAddressStatus('Billing address updated.');
    } catch (error) {
      setAddressStatus(error instanceof Error ? error.message : 'Unable to update address');
    }
  };

  useEffect(() => {
    if (overview?.address) {
      setAddress(overview.address);
    }
  }, [overview?.address]);

  const handleMakeDefault = async (paymentMethodId: string) => {
    setCardStatus(null);
    try {
      await setDefaultPaymentMethod(paymentMethodId);
      mutate('billing-overview');
      setCardStatus('Default payment method updated.');
    } catch (error) {
      setCardStatus(error instanceof Error ? error.message : 'Unable to set default method');
    }
  };

  const handleRemoveMethod = async (paymentMethodId: string) => {
    setCardStatus(null);
    try {
      await removePaymentMethod(paymentMethodId);
      mutate('billing-overview');
      setCardStatus('Payment method removed.');
    } catch (error) {
      setCardStatus(error instanceof Error ? error.message : 'Unable to remove card');
    }
  };

  const paymentMethods = overview?.paymentMethods ?? [];

  return (
    <div className="space-y-6">
      <header className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-blue-500">Billing</p>
        <h1 className="text-3xl font-semibold text-slate-900">Plan & payments</h1>
        <p className="text-slate-500">Cards, promo credits, and per-job charges. DeepFinery clusters are $50/run; customer clusters are free up to 100 jobs.</p>
      </header>
      <div className="grid gap-6 lg:grid-cols-3">
        <article className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Payment methods</h2>
              <p className="text-sm text-slate-500">Manage the cards used for DeepFinery job charges.</p>
            </div>
            {billingPortalUrl && (
              <button
                type="button"
                onClick={() => window.open(billingPortalUrl, '_blank')}
                className="rounded-md border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:border-blue-400 hover:text-blue-600"
              >
                Pay in Stripe
              </button>
            )}
          </div>
          <div className="mt-4 space-y-3">
            {paymentMethods.map(method => (
              <div key={method.id} className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                <div>
                  <p className="font-semibold text-slate-900">{method.brand?.toUpperCase()} •••• {method.last4}</p>
                  <p className="text-xs text-slate-500">Expires {method.expMonth}/{method.expYear}</p>
                </div>
                <div className="flex items-center gap-2">
                  {!method.isDefault && (
                    <button
                      onClick={() => handleMakeDefault(method.id)}
                      className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 hover:border-blue-400 hover:text-blue-600"
                    >
                      Make default
                    </button>
                  )}
                  <button
                    onClick={() => handleRemoveMethod(method.id)}
                    className="rounded-full border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-600 hover:border-rose-400"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
            {paymentMethods.length === 0 && (
              <p className="rounded-lg border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-500">
                No cards on file. A valid card is required even for free-tier launches.
              </p>
            )}
          </div>
          <div className="mt-6 space-y-3">
            <CardElement
              options={{
                style: {
                  base: { color: '#0f172a', fontSize: '15px', '::placeholder': { color: '#94a3b8' } }
                }
              }}
              className="rounded-lg border border-slate-200 bg-white px-4 py-3"
            />
            <button
              onClick={handleAddCard}
              disabled={cardBusy || !stripe}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-70"
            >
              {cardBusy ? 'Saving…' : 'Add card'}
            </button>
            {cardStatus && <p className="text-sm text-slate-600">{cardStatus}</p>}
          </div>
        </article>
        <article className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Promo & free tier</p>
            <p className="text-3xl font-semibold text-slate-900">{overview?.promoCredits ?? 0} credits</p>
            <p className="text-xs text-slate-500">{overview?.freeJobsRemaining ?? 0} customer-cluster jobs remaining</p>
          </div>
          <div className="space-y-2 text-sm text-slate-600">
            <input
              type="text"
              value={promoCode}
              onChange={event => setPromoCode(event.target.value)}
              placeholder="Promo code"
              className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900"
            />
            <button
              onClick={handlePromo}
              className="w-full rounded-md border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:border-blue-400 hover:text-blue-600"
            >
              Apply promo
            </button>
            {promoStatus && <p className="text-xs text-slate-500">{promoStatus}</p>}
          </div>
          <div className="space-y-2 text-sm text-slate-600">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Billing address</p>
            <input
              type="text"
              placeholder="Line 1"
              value={address?.line1 ?? ''}
              onChange={event => setAddress(prev => ({ ...prev, line1: event.target.value }))}
              className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900"
            />
            <input
              type="text"
              placeholder="Line 2"
              value={address?.line2 ?? ''}
              onChange={event => setAddress(prev => ({ ...prev, line2: event.target.value }))}
              className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="City"
                value={address?.city ?? ''}
                onChange={event => setAddress(prev => ({ ...prev, city: event.target.value }))}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900"
              />
              <input
                type="text"
                placeholder="State"
                value={address?.state ?? ''}
                onChange={event => setAddress(prev => ({ ...prev, state: event.target.value }))}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="Postal code"
                value={address?.postalCode ?? ''}
                onChange={event => setAddress(prev => ({ ...prev, postalCode: event.target.value }))}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900"
              />
              <input
                type="text"
                placeholder="Country"
                value={address?.country ?? ''}
                onChange={event => setAddress(prev => ({ ...prev, country: event.target.value }))}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900"
              />
            </div>
            <button
              onClick={handleAddressUpdate}
              className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
            >
              Save billing address
            </button>
            {addressStatus && <p className="text-xs text-slate-500">{addressStatus}</p>}
          </div>
        </article>
      </div>
    </div>
  );
}

export default function BillingPage() {
  if (!stripePromise) {
    return (
      <div className="space-y-6">
        <header className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-3xl font-semibold text-slate-900">Billing</h1>
          <p className="text-slate-500">Stripe publishable key missing. Set NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY.</p>
        </header>
      </div>
    );
  }

  return (
    <Elements stripe={stripePromise}>
      <BillingContent />
    </Elements>
  );
}
