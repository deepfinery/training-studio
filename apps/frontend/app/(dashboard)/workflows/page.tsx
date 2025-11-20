const workflows = [
  {
    name: 'Insurance underwriting',
    owner: 'RiskOps',
    status: 'Validated',
    steps: 68,
    lastRun: '12 min ago'
  },
  {
    name: 'FX Hedge Advisor',
    owner: 'Treasury',
    status: 'Needs review',
    steps: 42,
    lastRun: '3 hours ago'
  },
  {
    name: 'KYC adjudication',
    owner: 'Compliance',
    status: 'Draft',
    steps: 27,
    lastRun: 'Yesterday'
  }
];

export default function WorkflowsPage() {
  return (
    <div className="space-y-6">
      <header className="glass-panel rounded-3xl border border-white/5 p-6">
        <p className="text-sm uppercase tracking-[0.35em] text-brand-200">Workflows</p>
        <h1 className="text-3xl font-semibold text-white">Ingest, refine, and version your rule books</h1>
        <p className="text-slate-300">Track ontology health and collaborate with SMEs before promotion to distillation.</p>
      </header>
      <div className="grid gap-4 md:grid-cols-2">
        {workflows.map(flow => (
          <article key={flow.name} className="glass-panel rounded-3xl border border-white/5 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">{flow.owner}</p>
                <h2 className="text-xl font-semibold text-white">{flow.name}</h2>
              </div>
              <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300">{flow.status}</span>
            </div>
            <div className="mt-4 flex items-center justify-between text-sm text-slate-400">
              <p>{flow.steps} decision nodes</p>
              <p>Last run {flow.lastRun}</p>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
