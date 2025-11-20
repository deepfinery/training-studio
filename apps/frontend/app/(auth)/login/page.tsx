import Link from 'next/link';
import { AuthCard } from '../../../components/AuthCard';

export default function LoginPage() {
  return (
    <AuthCard
      title="Welcome back"
      subtitle="Sign in to access your Training Studio workspace."
      footer={
        <div className="space-y-2">
          <p>
            Need an account?{' '}
            <Link href="/register" className="text-brand-200 hover:text-brand-100">
              Create one
            </Link>
          </p>
          <Link href="/forgot-password" className="text-brand-200 hover:text-brand-100">
            Forgot password?
          </Link>
        </div>
      }
    >
      <form className="space-y-4">
        <label className="text-sm text-slate-300">
          Email address
          <input
            type="email"
            placeholder="you@enterprise.com"
            className="mt-1 w-full rounded-2xl border border-white/10 bg-slate-900/40 px-4 py-3 text-white"
          />
        </label>
        <label className="text-sm text-slate-300">
          Password
          <input
            type="password"
            className="mt-1 w-full rounded-2xl border border-white/10 bg-slate-900/40 px-4 py-3 text-white"
          />
        </label>
        <div className="flex items-center justify-between text-xs text-slate-400">
          <label className="inline-flex items-center gap-2">
            <input type="checkbox" className="h-4 w-4 rounded border-white/20 bg-transparent" />
            Remember me
          </label>
          <Link href="/change-password" className="text-brand-200 hover:text-brand-100">
            Change password
          </Link>
        </div>
        <button
          type="submit"
          className="w-full rounded-2xl bg-brand-500 py-3 text-sm font-semibold uppercase tracking-wide text-white shadow-lg shadow-brand-500/40"
        >
          Sign in
        </button>
      </form>
    </AuthCard>
  );
}
