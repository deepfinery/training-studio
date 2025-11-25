const runtimes = [
  { name: 'EKS prod (us-west-2)', status: 'Healthy', requests: '1.2k / min', latency: '8.4 ms' },
  { name: 'Edge CPU fleet', status: 'Scaling', requests: '420 / min', latency: '12.1 ms' }
];

export default function DeployPage() {
  return (
    <div className="space-y-6">
      <header className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-blue-500">Serve & reinforce</p>
            <h1 className="text-3xl font-semibold text-slate-900">Manage runtimes & reinforcement</h1>
            <p className="text-slate-500">Deployment orchestration is almost here. Track the planned targets below while we wire up promotion flows.</p>
          </div>
          <span className="rounded-full bg-amber-100 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-amber-700">Coming soon</span>
        </div>
      </header>
      <section className="grid gap-4 lg:grid-cols-2">
        {runtimes.map(runtime => (
          <article key={runtime.name} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">{runtime.name}</h2>
            <p className="text-sm text-slate-500">Status: {runtime.status}</p>
            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm text-slate-600">
              <div>
                <dt className="text-xs uppercase tracking-wide text-slate-500">Requests</dt>
                <dd className="text-base font-semibold text-slate-900">{runtime.requests}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-slate-500">Latency</dt>
                <dd className="text-base font-semibold text-slate-900">{runtime.latency}</dd>
              </div>
            </dl>
            <div className="mt-5 flex flex-wrap gap-3">
              <button className="flex-1 rounded-md border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:border-blue-400 hover:text-blue-600">
                Download container
              </button>
              <button className="flex-1 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500">
                Reinforce model
              </button>
            </div>
            <p className="mt-3 text-xs text-slate-500">Automation hooks will enable staging → prod promotions and RLHF pipelines soon.</p>
          </article>
        ))}
      </section>
    </div>
  );
}
