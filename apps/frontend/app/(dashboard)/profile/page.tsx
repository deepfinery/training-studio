'use client';

import { useEffect, useMemo, useState } from 'react';
import { changePasswordApi, fetchProfile, updateProfile, UserProfile } from '../../../lib/api';

interface ProfileFormState {
  name: string;
  email: string;
  role: string;
  company: string;
  phone: string;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [form, setForm] = useState<ProfileFormState>({ name: '', email: '', role: '', company: '', phone: '' });
  const [status, setStatus] = useState<string | null>(null);
  const [statusTone, setStatusTone] = useState<'success' | 'error' | null>(null);
  const [saving, setSaving] = useState(false);
  const [passwordBusy, setPasswordBusy] = useState(false);
  const [passwordStatus, setPasswordStatus] = useState<string | null>(null);
  const [passwordTone, setPasswordTone] = useState<'success' | 'error' | null>(null);
  const [passwords, setPasswords] = useState({ current: '', next: '', confirm: '' });

  useEffect(() => {
    let mounted = true;
    const loadProfile = async () => {
      try {
        const data = await fetchProfile();
        if (!mounted) return;
        setProfile(data);
        setForm({
          name: data.name ?? '',
          email: data.email,
          role: data.role ?? '',
          company: data.company ?? '',
          phone: data.phone ?? ''
        });
      } catch (error) {
        if (!mounted) return;
        setStatus(error instanceof Error ? error.message : 'Unable to load profile');
        setStatusTone('error');
      }
    };
    loadProfile();
    return () => {
      mounted = false;
    };
  }, []);

  const lastUpdated = useMemo(() => {
    if (!profile) return '';
    return new Date(profile.updatedAt).toLocaleString();
  }, [profile]);

  const handleChange = (field: keyof ProfileFormState) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, [field]: event.target.value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setStatus(null);
    setStatusTone(null);
    try {
      const updated = await updateProfile({
        name: form.name,
        role: form.role,
        company: form.company,
        phone: form.phone
      });
      setProfile(updated);
      setStatus('Profile updated');
      setStatusTone('success');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Unable to save profile');
      setStatusTone('error');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (event: React.FormEvent) => {
    event.preventDefault();
    if (passwords.next !== passwords.confirm) {
      setPasswordStatus('New passwords do not match.');
      setPasswordTone('error');
      return;
    }

    setPasswordBusy(true);
    setPasswordStatus(null);
    setPasswordTone(null);
    try {
      await changePasswordApi({ email: form.email, currentPassword: passwords.current, newPassword: passwords.next });
      setPasswords({ current: '', next: '', confirm: '' });
      setPasswordStatus('Password updated.');
      setPasswordTone('success');
    } catch (error) {
      setPasswordStatus(error instanceof Error ? error.message : 'Unable to change password');
      setPasswordTone('error');
    } finally {
      setPasswordBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <header className="glass-panel rounded-3xl border border-white/5 p-6">
        <p className="text-sm uppercase tracking-[0.35em] text-brand-200">Profile</p>
        <h1 className="text-3xl font-semibold text-white">Account overview</h1>
        <div className="flex items-center gap-3">
          <p className="text-slate-300">Manage your identity, security, and workspace preferences.</p>
          {profile?.role && <span className="rounded-full border border-white/10 px-3 py-0.5 text-xs uppercase tracking-wide text-slate-200">{profile.role}</span>}
        </div>
      </header>
      <div className="grid gap-6 lg:grid-cols-2">
        <form className="glass-panel rounded-3xl border border-white/5 p-6" onSubmit={handleSubmit}>
          <h2 className="text-xl font-semibold text-white">Personal information</h2>
          <div className="mt-4 space-y-4 text-sm text-slate-300">
            <label>
              Full name
              <input
                type="text"
                value={form.name}
                onChange={handleChange('name')}
                className="mt-1 w-full rounded-2xl border border-white/10 bg-slate-900/40 px-4 py-3 text-white"
              />
            </label>
            <label>
              Email
              <input
                type="email"
                value={form.email}
                readOnly
                className="mt-1 w-full rounded-2xl border border-white/10 bg-slate-900/40 px-4 py-3 text-white/70"
              />
            </label>
            <label>
              Role
              <input
                type="text"
                value={form.role}
                onChange={handleChange('role')}
                className="mt-1 w-full rounded-2xl border border-white/10 bg-slate-900/40 px-4 py-3 text-white"
              />
            </label>
            <label>
              Company
              <input
                type="text"
                value={form.company}
                onChange={handleChange('company')}
                className="mt-1 w-full rounded-2xl border border-white/10 bg-slate-900/40 px-4 py-3 text-white"
              />
            </label>
            <label>
              Phone
              <input
                type="tel"
                value={form.phone}
                onChange={handleChange('phone')}
                className="mt-1 w-full rounded-2xl border border-white/10 bg-slate-900/40 px-4 py-3 text-white"
              />
            </label>
          </div>
          <div className="mt-5 flex gap-3">
            <button
              type="button"
              className="flex-1 rounded-2xl border border-white/10 px-4 py-2 text-sm text-slate-200"
              onClick={() => {
                if (profile) {
                  setForm({
                    name: profile.name ?? '',
                    email: profile.email,
                    role: profile.role ?? '',
                    company: profile.company ?? '',
                    phone: profile.phone ?? ''
                  });
                }
              }}
            >
              Reset
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded-2xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-70"
            >
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
          {status && (
            <p className={`mt-3 text-sm ${statusTone === 'error' ? 'text-rose-200' : 'text-emerald-200'}`}>{status}</p>
          )}
        </form>
        <div className="space-y-6">
          <article id="security" className="glass-panel rounded-3xl border border-white/5 p-6">
            <h3 className="text-lg font-semibold text-white">Security</h3>
            <ul className="mt-4 space-y-3 text-sm text-slate-300">
              <li className="flex items-center justify-between">
                Email verified <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs text-emerald-200">Yes</span>
              </li>
              <li className="flex items-center justify-between">
                Last profile update <span>{lastUpdated || '—'}</span>
              </li>
            </ul>
            <form className="mt-5 space-y-3 text-sm text-slate-300" onSubmit={handlePasswordChange}>
              <div className="grid gap-3">
                <label>
                  Current password
                  <input
                    type="password"
                    value={passwords.current}
                    onChange={event => setPasswords(prev => ({ ...prev, current: event.target.value }))}
                    className="mt-1 w-full rounded-2xl border border-white/10 bg-slate-900/40 px-4 py-3 text-white"
                    required
                  />
                </label>
                <label>
                  New password
                  <input
                    type="password"
                    value={passwords.next}
                    onChange={event => setPasswords(prev => ({ ...prev, next: event.target.value }))}
                    className="mt-1 w-full rounded-2xl border border-white/10 bg-slate-900/40 px-4 py-3 text-white"
                    required
                  />
                </label>
                <label>
                  Confirm new password
                  <input
                    type="password"
                    value={passwords.confirm}
                    onChange={event => setPasswords(prev => ({ ...prev, confirm: event.target.value }))}
                    className="mt-1 w-full rounded-2xl border border-white/10 bg-slate-900/40 px-4 py-3 text-white"
                    required
                  />
                </label>
              </div>
              <button
                type="submit"
                disabled={passwordBusy}
                className="w-full rounded-2xl border border-white/10 px-4 py-2 text-sm text-slate-200 disabled:opacity-70"
              >
                {passwordBusy ? 'Updating…' : 'Update password'}
              </button>
              {passwordStatus && (
                <p className={`text-sm ${passwordTone === 'error' ? 'text-rose-200' : 'text-emerald-200'}`}>{passwordStatus}</p>
              )}
            </form>
          </article>
          <article className="glass-panel rounded-3xl border border-white/5 p-6">
            <h3 className="text-lg font-semibold text-white">API tokens</h3>
            <p className="text-sm text-slate-400">Use tokens to automate dataset uploads and training triggers.</p>
            <button className="mt-4 w-full rounded-2xl border border-white/10 px-4 py-2 text-sm text-slate-200">
              Generate new token
            </button>
          </article>
        </div>
      </div>
    </div>
  );
}
