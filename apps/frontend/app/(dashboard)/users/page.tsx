'use client';

import useSWR from 'swr';
import Link from 'next/link';
import { fetchOrgContext, fetchOrgMembers, OrgMemberSummary } from '../../../lib/api';

export default function UsersPage() {
  const { data: orgContext } = useSWR('org-context', fetchOrgContext);
  const isAdmin = (orgContext?.membership?.role ?? 'standard') === 'admin' || orgContext?.isGlobalAdmin;
  const {
    data: members,
    error,
    isLoading
  } = useSWR<OrgMemberSummary[]>(isAdmin ? 'org-members' : null, fetchOrgMembers, { refreshInterval: 30000 });

  return (
    <div className="space-y-6">
      <header className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-blue-500">Users</p>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-semibold text-slate-900">Workspace access</h1>
            <p className="text-slate-500">Invite collaborators through Cognito and review who can launch jobs, manage billing, or administer the org.</p>
          </div>
          <div className="rounded-full bg-slate-100 px-4 py-1 text-xs font-semibold text-slate-600">
            {isAdmin ? 'Admin access' : 'Read-only access'}
          </div>
        </div>
      </header>

      {!isAdmin && (
        <section className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
          <p className="font-semibold">Admin access required</p>
          <p className="mt-1">Only workspace admins can view and manage members. Ask an admin to update your role if you need this view.</p>
        </section>
      )}

      {isAdmin && (
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Workspace members</h2>
              <p className="text-sm text-slate-500">{members?.length ?? 0} people with access to this org.</p>
            </div>
            <button
              type="button"
              onClick={() => window.open('https://us-east-1.console.aws.amazon.com/cognito/home', '_blank')}
              className="rounded-md border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:border-blue-400 hover:text-blue-600"
            >
              Open Cognito console
            </button>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-3 py-2">Name</th>
                  <th className="px-3 py-2">Email</th>
                  <th className="px-3 py-2">Role</th>
                  <th className="px-3 py-2">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {members?.map(member => (
                  <tr key={member.id}>
                    <td className="px-3 py-3 text-slate-900">{member.profile?.name ?? member.profile?.email ?? member.userId}</td>
                    <td className="px-3 py-3 text-slate-500">{member.profile?.email ?? '—'}</td>
                    <td className="px-3 py-3">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          member.role === 'admin' ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {member.role}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-slate-500">{new Date(member.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
                {!isLoading && members && members.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-3 py-6 text-center text-sm text-slate-500">
                      No members recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {isLoading && <p className="mt-3 text-sm text-slate-500">Loading members…</p>}
          {error && <p className="mt-3 text-sm text-rose-600">Unable to load members</p>}
        </section>
      )}

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-900">How to invite teammates</h2>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-slate-600">
          <li>
            Open the Amazon Cognito console for the user pool configured in <code className="rounded bg-slate-100 px-1">NEXT_PUBLIC_COGNITO_USER_POOL_ID</code>.
          </li>
          <li>Create a new user or send an invite. Once confirmed, the user will appear here after their first login.</li>
          <li>
            Assign the <strong>Admin</strong> group if they should be able to see billing, users, or training management.
          </li>
        </ol>
        <p className="mt-4 text-sm text-slate-500">
          Need API-only access? Generate tokens from the <Link className="text-blue-600" href="/profile#tokens">profile &amp; tokens</Link> panel instead.
        </p>
      </section>
    </div>
  );
}
