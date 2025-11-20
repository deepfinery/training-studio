import Link from 'next/link';
import { AuthCard } from '../../../components/AuthCard';

export default function ChangePasswordPage() {
  return (
    <AuthCard
      title="Change password"
      subtitle="Update your credentials to keep the workspace secure."
      footer={<Link href="/login" className="text-brand-200 hover:text-brand-100">Back to login</Link>}
    >
      <form className="space-y-4">
        <label className="text-sm text-slate-300">
          Current password
          <input type="password" className="mt-1 w-full rounded-2xl border border-white/10 bg-slate-900/40 px-4 py-3 text-white" />
        </label>
        <label className="text-sm text-slate-300">
          New password
          <input type="password" className="mt-1 w-full rounded-2xl border border-white/10 bg-slate-900/40 px-4 py-3 text-white" />
        </label>
        <label className="text-sm text-slate-300">
          Confirm new password
          <input type="password" className="mt-1 w-full rounded-2xl border border-white/10 bg-slate-900/40 px-4 py-3 text-white" />
        </label>
        <button
          type="submit"
          className="w-full rounded-2xl bg-brand-500 py-3 text-sm font-semibold uppercase tracking-wide text-white"
        >
          Update password
        </button>
      </form>
    </AuthCard>
  );
}
