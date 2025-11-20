const runtimes = [
  { name: 'EKS prod (us-west-2)', status: 'Healthy', requests: '1.2k / min', latency: '8.4 ms' },
  { name: 'Edge CPU fleet', status: 'Scaling', requests: '420 / min', latency: '12.1 ms' }
];

export default function DeployPage() {
  return (
    <div className="space-y-6">
      <header className="glass-panel rounded-3xl border border-white/5 p-6">
        <p className="text-sm uppercase tracking-[0.35em] text-brand-200">Serve & reinforce</p>
        <h1 className="text-3xl font-semibold text-white">Manage vLLM runtimes and reinforcement jobs</h1>
        <p className="text-slate-300">Promote adapters, issue blue/green deployments, and ship portable containers.</p>
      </header>
      <div className="grid gap-4 lg:grid-cols-2">
        {runtimes.map(runtime => (
          <article key={runtime.name} className="glass-panel rounded-3xl border border-white/5 p-5">
            <h2 className="text-xl font-semibold text-white">{runtime.name}</h2>
            <p className="text-sm text-slate-400">Status: {runtime.status}</p>
            <div className="mt-4 flex items-center justify-between text-sm text-slate-300">
              <p>{runtime.requests}</p>
              <p>{runtime.latency}</p>
            </div>
            <div className="mt-5 flex gap-3">
              <button className="flex-1 rounded-2xl border border-white/10 px-4 py-2 text-sm text-slate-200 hover:border-brand-400">
                Download container
              </button>
              <button className="flex-1 rounded-2xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white">
                Reinforce model
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
