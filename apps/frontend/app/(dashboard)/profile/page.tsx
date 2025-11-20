export default function ProfilePage() {
  return (
    <div className="space-y-6">
      <header className="glass-panel rounded-3xl border border-white/5 p-6">
        <p className="text-sm uppercase tracking-[0.35em] text-brand-200">Profile</p>
        <h1 className="text-3xl font-semibold text-white">Account overview</h1>
        <p className="text-slate-300">Manage your identity, Cognito MFA, and workspace preferences.</p>
      </header>
      <div className="grid gap-6 lg:grid-cols-2">
        <form className="glass-panel rounded-3xl border border-white/5 p-6">
          <h2 className="text-xl font-semibold text-white">Personal information</h2>
          <div className="mt-4 space-y-4 text-sm text-slate-300">
            <label>
              Full name
              <input type="text" defaultValue="Alex Product" className="mt-1 w-full rounded-2xl border border-white/10 bg-slate-900/40 px-4 py-3 text-white" />
            </label>
            <label>
              Email
              <input type="email" defaultValue="alex@deepfinery.ai" className="mt-1 w-full rounded-2xl border border-white/10 bg-slate-900/40 px-4 py-3 text-white" />
            </label>
            <label>
              Role
              <input type="text" defaultValue="Head of Automation" className="mt-1 w-full rounded-2xl border border-white/10 bg-slate-900/40 px-4 py-3 text-white" />
            </label>
          </div>
          <div className="mt-5 flex gap-3">
            <button type="button" className="flex-1 rounded-2xl border border-white/10 px-4 py-2 text-sm text-slate-200">
              Cancel
            </button>
            <button type="submit" className="flex-1 rounded-2xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white">
              Save changes
            </button>
          </div>
        </form>
        <div className="space-y-6">
          <article className="glass-panel rounded-3xl border border-white/5 p-6">
            <h3 className="text-lg font-semibold text-white">Security</h3>
            <ul className="mt-4 space-y-3 text-sm text-slate-300">
              <li className="flex items-center justify-between">
                MFA status <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs text-emerald-200">Enabled</span>
              </li>
              <li className="flex items-center justify-between">
                Last password change <span>14 days ago</span>
              </li>
              <li className="flex items-center justify-between">
                Trusted devices <span>3</span>
              </li>
            </ul>
            <div className="mt-5 flex gap-3">
              <a href="/change-password" className="flex-1 rounded-2xl border border-white/10 px-4 py-2 text-center text-sm text-slate-200">
                Update password
              </a>
              <a href="/logout" className="flex-1 rounded-2xl border border-rose-500/50 px-4 py-2 text-center text-sm text-rose-200">
                Sign out
              </a>
            </div>
          </article>
          <article className="glass-panel rounded-3xl border border-white/5 p-6">
            <h3 className="text-lg font-semibold text-white">API tokens</h3>
            <p className="text-sm text-slate-400">Use tokens to automate dataset uploads and training triggers.</p>
            <button className="mt-4 w-full rounded-2xl border border-white/10 px-4 py-2 text-sm text-slate-200">Generate new token</button>
          </article>
        </div>
      </div>
    </div>
  );
}
