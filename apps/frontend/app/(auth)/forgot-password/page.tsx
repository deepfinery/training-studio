import Link from 'next/link';
import { AuthCard } from '../../../components/AuthCard';

export default function ForgotPasswordPage() {
  return (
    <AuthCard
      title="Reset password"
      subtitle="Enter your email to receive a secure reset link."
      footer={
        <p>
          Remembered your password?{' '}
          <Link href="/login" className="text-brand-200 hover:text-brand-100">
            Return to login
          </Link>
        </p>
      }
    >
      <form className="space-y-4">
        <label className="text-sm text-slate-300">
          Company email
          <input type="email" className="mt-1 w-full rounded-2xl border border-white/10 bg-slate-900/40 px-4 py-3 text-white" />
        </label>
        <button
          type="submit"
          className="w-full rounded-2xl bg-brand-500 py-3 text-sm font-semibold uppercase tracking-wide text-white"
        >
          Send reset link
        </button>
      </form>
    </AuthCard>
  );
}
