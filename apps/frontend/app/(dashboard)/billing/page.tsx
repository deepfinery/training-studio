const invoices = [
  { id: 'INV-2038', amount: '$12,400', status: 'Paid', date: 'Mar 12, 2024' },
  { id: 'INV-2037', amount: '$9,980', status: 'Paid', date: 'Feb 8, 2024' },
  { id: 'INV-2036', amount: '$10,120', status: 'Paid', date: 'Jan 10, 2024' }
];

export default function BillingPage() {
  return (
    <div className="space-y-6">
      <header className="glass-panel rounded-3xl border border-white/5 p-6">
        <p className="text-sm uppercase tracking-[0.35em] text-brand-200">Billing</p>
        <h1 className="text-3xl font-semibold text-white">Plan & payments</h1>
        <p className="text-slate-300">Track consumption, manage invoices, and top up credits.</p>
      </header>
      <div className="grid gap-6 lg:grid-cols-3">
        <article className="glass-panel rounded-3xl border border-white/5 p-6 lg:col-span-2">
          <h2 className="text-xl font-semibold text-white">Invoices</h2>
          <div className="mt-4 divide-y divide-white/5 text-sm text-slate-300">
            {invoices.map(invoice => (
              <div key={invoice.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="font-semibold text-white">{invoice.id}</p>
                  <p className="text-xs text-slate-500">{invoice.date}</p>
                </div>
                <div className="text-right">
                  <p>{invoice.amount}</p>
                  <span className="text-xs text-emerald-300">{invoice.status}</span>
                </div>
              </div>
            ))}
          </div>
        </article>
        <article className="glass-panel rounded-3xl border border-white/5 p-6 space-y-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Current plan</p>
            <p className="text-3xl font-semibold text-white">Enterprise</p>
          </div>
          <p className="text-sm text-slate-300">Unlimited seats, priority GPUs, and dedicated TAM. Usage billed monthly.</p>
          <button className="w-full rounded-2xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white">Download latest invoice</button>
          <button className="w-full rounded-2xl border border-white/10 px-4 py-2 text-sm text-slate-200">Update payment method</button>
        </article>
      </div>
    </div>
  );
}
