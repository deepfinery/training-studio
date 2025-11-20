const preferences = [
  { label: 'Email me when a training job completes', enabled: true },
  { label: 'Notify me when credit balance < 1M', enabled: true },
  { label: 'Daily ontology validation digest', enabled: false }
];

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <header className="glass-panel rounded-3xl border border-white/5 p-6">
        <p className="text-sm uppercase tracking-[0.35em] text-brand-200">Settings</p>
        <h1 className="text-3xl font-semibold text-white">Workspace controls</h1>
        <p className="text-slate-300">Fine tune notifications, integrations, and deployment defaults.</p>
      </header>
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="glass-panel rounded-3xl border border-white/5 p-6">
          <h2 className="text-xl font-semibold text-white">Notifications</h2>
          <ul className="mt-4 space-y-3 text-sm text-slate-300">
            {preferences.map(pref => (
              <li key={pref.label} className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-900/40 px-4 py-3">
                {pref.label}
                <span className={`inline-flex h-6 w-11 items-center rounded-full px-1 text-[10px] uppercase tracking-wide ${pref.enabled ? 'bg-emerald-500/20 text-emerald-200' : 'bg-slate-700 text-slate-400'}`}>
                  {pref.enabled ? 'on' : 'off'}
                </span>
              </li>
            ))}
          </ul>
        </section>
        <section className="glass-panel rounded-3xl border border-white/5 p-6">
          <h2 className="text-xl font-semibold text-white">Integrations</h2>
          <div className="mt-4 space-y-4 text-sm text-slate-300">
            <label>
              Default base model
              <select className="mt-1 w-full rounded-2xl border border-white/10 bg-slate-900/40 px-4 py-3 text-white">
                <option>Llama 3.2 3B Instruct</option>
                <option>Llama 3.1 8B Instruct</option>
                <option>Nemotron 4 15B</option>
              </select>
            </label>
            <label>
              Vertex project ID
              <input type="text" defaultValue="deepfinery-prod" className="mt-1 w-full rounded-2xl border border-white/10 bg-slate-900/40 px-4 py-3 text-white" />
            </label>
            <label>
              Default deployment target
              <select className="mt-1 w-full rounded-2xl border border-white/10 bg-slate-900/40 px-4 py-3 text-white">
                <option>EKS production</option>
                <option>Self-hosted edge</option>
              </select>
            </label>
          </div>
        </section>
      </div>
    </div>
  );
}
