import Link from 'next/link';
import { AuthCard } from '../../../components/AuthCard';

export default function RegisterPage() {
  return (
    <AuthCard
      title="Create workspace"
      subtitle="Spin up a DeepFinery Training Studio tenant in minutes."
      footer={
        <p>
          Already onboarded?{' '}
          <Link href="/login" className="text-brand-200 hover:text-brand-100">
            Sign in
          </Link>
        </p>
      }
    >
      <form className="space-y-4">
        <label className="text-sm text-slate-300">
          Full name
          <input type="text" className="mt-1 w-full rounded-2xl border border-white/10 bg-slate-900/40 px-4 py-3 text-white" />
        </label>
        <label className="text-sm text-slate-300">
          Company email
          <input type="email" className="mt-1 w-full rounded-2xl border border-white/10 bg-slate-900/40 px-4 py-3 text-white" />
        </label>
        <label className="text-sm text-slate-300">
          Password
          <input type="password" className="mt-1 w-full rounded-2xl border border-white/10 bg-slate-900/40 px-4 py-3 text-white" />
        </label>
        <label className="text-sm text-slate-300">
          Confirm password
          <input type="password" className="mt-1 w-full rounded-2xl border border-white/10 bg-slate-900/40 px-4 py-3 text-white" />
        </label>
        <button
          type="submit"
          className="w-full rounded-2xl bg-brand-500 py-3 text-sm font-semibold uppercase tracking-wide text-white shadow-lg shadow-brand-500/40"
        >
          Create workspace
        </button>
      </form>
    </AuthCard>
  );
}
