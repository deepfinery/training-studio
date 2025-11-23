'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { AuthCard } from '../../../components/AuthCard';
import { changePasswordApi } from '../../../lib/api';

export default function ChangePasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (newPassword !== confirmPassword) {
      setStatus('New passwords do not match.');
      return;
    }
    setBusy(true);
    setStatus(null);
    try {
      await changePasswordApi({ email, currentPassword, newPassword });
      setStatus('Password updated. You can sign in with your new password.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => router.push('/login'), 1200);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Unable to change password');
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthCard
      title="Change password"
      subtitle="Update your credentials to keep the workspace secure."
      footer={<Link href="/login" className="text-brand-200 hover:text-brand-100">Back to login</Link>}
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        <label className="text-sm text-slate-300">
          Company email
          <input
            type="email"
            value={email}
            onChange={event => setEmail(event.target.value)}
            className="mt-1 w-full rounded-2xl border border-white/10 bg-slate-900/40 px-4 py-3 text-white"
            required
          />
        </label>
        <label className="text-sm text-slate-300">
          Current password
          <input
            type="password"
            value={currentPassword}
            onChange={event => setCurrentPassword(event.target.value)}
            className="mt-1 w-full rounded-2xl border border-white/10 bg-slate-900/40 px-4 py-3 text-white"
            required
          />
        </label>
        <label className="text-sm text-slate-300">
          New password
          <input
            type="password"
            value={newPassword}
            onChange={event => setNewPassword(event.target.value)}
            className="mt-1 w-full rounded-2xl border border-white/10 bg-slate-900/40 px-4 py-3 text-white"
            required
          />
        </label>
        <label className="text-sm text-slate-300">
          Confirm new password
          <input
            type="password"
            value={confirmPassword}
            onChange={event => setConfirmPassword(event.target.value)}
            className="mt-1 w-full rounded-2xl border border-white/10 bg-slate-900/40 px-4 py-3 text-white"
            required
          />
        </label>
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-2xl bg-brand-500 py-3 text-sm font-semibold uppercase tracking-wide text-white disabled:opacity-70"
        >
          {busy ? 'Updating…' : 'Update password'}
        </button>
        {status && <p className="text-sm text-rose-200">{status}</p>}
      </form>
    </AuthCard>
  );
}
