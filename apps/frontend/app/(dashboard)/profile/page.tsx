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
      <header className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-blue-500">Profile</p>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-semibold text-slate-900">Account overview</h1>
            <p className="text-slate-500">Manage your identity, security, and workspace preferences.</p>
          </div>
          {profile?.role && (
            <span className="rounded-full bg-slate-100 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600">
              {profile.role}
            </span>
          )}
        </div>
      </header>
      <div className="grid gap-6 lg:grid-cols-2">
        <form className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm" onSubmit={handleSubmit}>
          <h2 className="text-xl font-semibold text-slate-900">Personal information</h2>
          <div className="mt-4 space-y-4 text-sm text-slate-700">
            <label className="block">
              Full name
              <input
                type="text"
                value={form.name}
                onChange={handleChange('name')}
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900"
              />
            </label>
            <label className="block">
              Email
              <input
                type="email"
                value={form.email}
                readOnly
                className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-500"
              />
            </label>
            <label className="block">
              Role
              <select
                value={form.role || 'standard'}
                onChange={event => setForm(prev => ({ ...prev, role: event.target.value }))}
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900"
              >
                <option value="admin">Admin</option>
                <option value="standard">Standard</option>
              </select>
            </label>
            <label className="block">
              Company
              <input
                type="text"
                value={form.company}
                onChange={handleChange('company')}
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900"
              />
            </label>
            <label className="block">
              Phone
              <input
                type="tel"
                value={form.phone}
                onChange={handleChange('phone')}
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900"
              />
            </label>
          </div>
          <div className="mt-5 flex gap-3">
            <button
              type="button"
              className="flex-1 rounded-md border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:border-blue-400 hover:text-blue-600"
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
              className="flex-1 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-70"
            >
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
          {status && (
            <p className={`mt-3 text-sm ${statusTone === 'error' ? 'text-rose-600' : 'text-emerald-600'}`}>{status}</p>
          )}
        </form>
        <div className="space-y-6">
          <article id="security" className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900">Security</h3>
            <ul className="mt-4 space-y-3 text-sm text-slate-600">
              <li className="flex items-center justify-between">
                Email verified <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">Yes</span>
              </li>
              <li className="flex items-center justify-between">
                Last profile update <span>{lastUpdated || '—'}</span>
              </li>
            </ul>
            <form className="mt-5 space-y-3 text-sm text-slate-700" onSubmit={handlePasswordChange}>
              <div className="grid gap-3">
                <label className="block">
                  Current password
                  <input
                    type="password"
                    value={passwords.current}
                    onChange={event => setPasswords(prev => ({ ...prev, current: event.target.value }))}
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900"
                    required
                  />
                </label>
                <label className="block">
                  New password
                  <input
                    type="password"
                    value={passwords.next}
                    onChange={event => setPasswords(prev => ({ ...prev, next: event.target.value }))}
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900"
                    required
                  />
                </label>
                <label className="block">
                  Confirm new password
                  <input
                    type="password"
                    value={passwords.confirm}
                    onChange={event => setPasswords(prev => ({ ...prev, confirm: event.target.value }))}
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900"
                    required
                  />
                </label>
              </div>
              <button
                type="submit"
                disabled={passwordBusy}
                className="w-full rounded-md border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:border-blue-400 hover:text-blue-600 disabled:opacity-70"
              >
                {passwordBusy ? 'Updating…' : 'Update password'}
              </button>
              {passwordStatus && (
                <p className={`text-sm ${passwordTone === 'error' ? 'text-rose-600' : 'text-emerald-600'}`}>{passwordStatus}</p>
              )}
            </form>
          </article>
          <article id="tokens" className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900">API tokens</h3>
            <p className="text-sm text-slate-600">Use tokens to automate dataset uploads and training triggers.</p>
            <button className="mt-4 w-full rounded-md border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:border-blue-400 hover:text-blue-600">
              Generate new token
            </button>
          </article>
        </div>
      </div>
    </div>
  );
}
