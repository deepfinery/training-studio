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
      <header className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-blue-500">Workflows</p>
            <h1 className="text-3xl font-semibold text-slate-900">Operational playbooks</h1>
            <p className="text-slate-500">Capture ontology approval, SME checkpoints, and training prep steps. Editing is coming soon—today you can review the current catalog.</p>
          </div>
          <span className="rounded-full bg-amber-100 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-amber-700">Coming soon</span>
        </div>
      </header>
      <section className="grid gap-4 md:grid-cols-2">
        {workflows.map(flow => (
          <article key={flow.name} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">{flow.owner}</p>
                <h2 className="text-xl font-semibold text-slate-900">{flow.name}</h2>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{flow.status}</span>
            </div>
            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm text-slate-600">
              <div>
                <dt className="text-xs uppercase tracking-wide text-slate-500">Decision nodes</dt>
                <dd className="text-base font-semibold text-slate-900">{flow.steps}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-slate-500">Last run</dt>
                <dd className="text-base font-semibold text-slate-900">{flow.lastRun}</dd>
              </div>
            </dl>
            <p className="mt-4 text-xs text-slate-500">Share updates with SMEs to unlock training automations.</p>
          </article>
        ))}
      </section>
    </div>
  );
}
