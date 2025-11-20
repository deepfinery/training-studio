const tiers = [
  { title: 'Distillation', usage: '1.3M tokens', progress: 0.64 },
  { title: 'Training', usage: '742k token-steps', progress: 0.48 },
  { title: 'Serving', usage: '512M tokens streamed', progress: 0.72 }
];

export default function CreditsPage() {
  return (
    <div className="space-y-6">
      <header className="glass-panel rounded-3xl border border-white/5 p-6">
        <p className="text-sm uppercase tracking-[0.35em] text-brand-200">Credits</p>
        <h1 className="text-3xl font-semibold text-white">Consumption & balance</h1>
        <p className="text-slate-300">Monitor where training tokens are spent and request new allocations.</p>
      </header>
      <div className="glass-panel rounded-3xl border border-white/5 p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Balance</p>
            <p className="text-4xl font-semibold text-white">2.4M credits</p>
            <p className="text-xs text-slate-500">Projected depletion in 26 days</p>
          </div>
          <div className="flex gap-3">
            <button className="rounded-2xl border border-white/10 px-4 py-2 text-sm text-slate-200">Request increase</button>
            <button className="rounded-2xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white">Purchase credits</button>
          </div>
        </div>
        <div className="mt-6 space-y-4">
          {tiers.map(tier => (
            <div key={tier.title}>
              <div className="flex items-center justify-between text-sm text-slate-300">
                <p>{tier.title}</p>
                <p>{tier.usage}</p>
              </div>
              <div className="mt-2 h-2 rounded-full bg-slate-800">
                <div className="h-full rounded-full bg-gradient-to-r from-brand-300 to-brand-500" style={{ width: `${tier.progress * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
