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
          <Link href="/login" className="text-blue-600 hover:text-blue-500">
            Return to login
          </Link>
        </p>
      }
    >
      <form className="space-y-5">
        <label className="text-sm font-medium text-slate-700">
          Company email
          <input
            type="email"
            className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </label>
        <button
          type="submit"
          className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500"
        >
          Send reset link
        </button>
      </form>
    </AuthCard>
  );
}
