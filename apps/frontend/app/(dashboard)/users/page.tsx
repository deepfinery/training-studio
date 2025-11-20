const members = [
  { name: 'Alex Product', email: 'alex@deepfinery.ai', role: 'Owner', status: 'Active' },
  { name: 'Priya ML', email: 'priya@deepfinery.ai', role: 'ML Lead', status: 'Active' },
  { name: 'Ken Finance', email: 'ken@deepfinery.ai', role: 'Billing', status: 'Invited' }
];

export default function UsersPage() {
  return (
    <div className="space-y-6">
      <header className="glass-panel rounded-3xl border border-white/5 p-6">
        <p className="text-sm uppercase tracking-[0.35em] text-brand-200">Users</p>
        <h1 className="text-3xl font-semibold text-white">Access control & invitations</h1>
        <p className="text-slate-300">Manage Cognito users, roles, and API-only service principals.</p>
      </header>
      <div className="grid gap-6 lg:grid-cols-2">
        <article className="glass-panel rounded-3xl border border-white/5 p-6">
          <h2 className="text-xl font-semibold text-white">Add teammate</h2>
          <form className="mt-4 space-y-4 text-sm text-slate-300">
            <label>
              Full name
              <input type="text" className="mt-1 w-full rounded-2xl border border-white/10 bg-slate-900/40 px-4 py-3 text-white" />
            </label>
            <label>
              Work email
              <input type="email" className="mt-1 w-full rounded-2xl border border-white/10 bg-slate-900/40 px-4 py-3 text-white" />
            </label>
            <label>
              Role
              <select className="mt-1 w-full rounded-2xl border border-white/10 bg-slate-900/40 px-4 py-3 text-white">
                <option>Owner</option>
                <option>Administrator</option>
                <option>Engineer</option>
                <option>Billing</option>
              </select>
            </label>
            <button type="submit" className="w-full rounded-2xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white">
              Send invitation
            </button>
          </form>
        </article>
        <article className="glass-panel rounded-3xl border border-white/5 p-6">
          <h2 className="text-xl font-semibold text-white">Workspace members</h2>
          <div className="mt-4 space-y-3 text-sm text-slate-300">
            {members.map(member => (
              <div key={member.email} className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-900/40 px-4 py-3">
                <div>
                  <p className="font-semibold text-white">{member.name}</p>
                  <p className="text-xs text-slate-500">{member.email}</p>
                </div>
                <div className="text-right">
                  <p>{member.role}</p>
                  <span className="text-xs text-slate-500">{member.status}</span>
                </div>
              </div>
            ))}
          </div>
        </article>
      </div>
    </div>
  );
}
