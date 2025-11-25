'use client';

import useSWR from 'swr';
import { fetchBillingOverview, fetchOrgContext } from '../../../lib/api';

export default function CreditsPage() {
  const { data: billing } = useSWR('billing-overview', fetchBillingOverview, { refreshInterval: 30000 });
  const { data: orgContext } = useSWR('org-context', fetchOrgContext, { refreshInterval: 60000 });

  const promoCredits = billing?.promoCredits ?? orgContext?.org?.promoCredits ?? 0;
  const freeJobsRemaining = billing?.freeJobsRemaining ?? Math.max(0, 100 - (orgContext?.org?.freeJobsConsumed ?? 0));
  const freeJobsConsumed = orgContext?.org?.freeJobsConsumed ?? (billing?.freeJobsRemaining ? 100 - billing.freeJobsRemaining : 0);
  const requiresPaymentMethod = billing?.requiresPaymentMethod ?? false;
  const totalCapacity = freeJobsRemaining + freeJobsConsumed;
  const usagePercent = totalCapacity ? Math.min(1, freeJobsConsumed / totalCapacity) : 0;

  return (
    <div className="space-y-6">
      <header className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-blue-500">Credits</p>
        <h1 className="text-3xl font-semibold text-slate-900">Consumption & balance</h1>
        <p className="text-slate-500">Values reflect the latest billing snapshot. Promo credits sync whenever finance applies a top-up.</p>
      </header>
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">Promo credits</p>
            <p className="text-3xl font-semibold text-slate-900">{promoCredits.toLocaleString()} credits</p>
            <p className="text-xs text-slate-500">Shared across training jobs</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">Free jobs remaining</p>
            <p className="text-3xl font-semibold text-slate-900">{freeJobsRemaining}</p>
            <p className="text-xs text-slate-500">of 100 customer-cluster jobs</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">Payment status</p>
            <p className={`text-3xl font-semibold ${requiresPaymentMethod ? 'text-rose-600' : 'text-emerald-600'}`}>
              {requiresPaymentMethod ? 'Card required' : 'Ready'}
            </p>
            <p className="text-xs text-slate-500">{requiresPaymentMethod ? 'Add a method in Billing' : 'Charges route to your default card'}</p>
          </div>
        </div>
        <div className="mt-6">
          <div className="flex items-center justify-between text-sm text-slate-600">
            <p>Free-tier usage</p>
            <p>
              {freeJobsConsumed} consumed · {freeJobsRemaining} remaining
            </p>
          </div>
          <div className="mt-2 h-2 rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-gradient-to-r from-blue-400 to-blue-600" style={{ width: `${usagePercent * 100}%` }} />
          </div>
        </div>
      </section>
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-900">Payment methods</h2>
        <p className="text-sm text-slate-500">Mirror of the billing tab for quick visibility.</p>
        <div className="mt-4 space-y-3">
          {(billing?.paymentMethods ?? []).map(method => (
            <div key={method.id} className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
              <div>
                <p className="font-semibold text-slate-900">
                  {method.brand?.toUpperCase() ?? 'CARD'} •••• {method.last4}
                </p>
                <p className="text-xs text-slate-500">Expires {method.expMonth}/{method.expYear}</p>
              </div>
              {method.isDefault && <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">Default</span>}
            </div>
          ))}
          {billing && (billing.paymentMethods?.length ?? 0) === 0 && (
            <p className="rounded-lg border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-500">
              No cards on file. Add one from the Billing page to prevent job interruptions.
            </p>
          )}
          {!billing && <p className="text-sm text-slate-500">Loading billing overview…</p>}
        </div>
      </section>
    </div>
  );
}
