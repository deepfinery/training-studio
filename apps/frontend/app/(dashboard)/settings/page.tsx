'use client';

import { ChangeEvent, FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import useSWR, { mutate } from 'swr';
import {
  ClusterSummary,
  createClusterRequest,
  deleteCluster,
  fetchClusters,
  fetchOrgContext,
  setDefaultCluster,
  updateOrgProfile
} from '../../../lib/api';

const preferenceToggles = [
  { label: 'Email me when a training job completes', key: 'jobComplete' },
  { label: 'Notify me when credit balance < 1 job', key: 'lowBalance' },
  { label: 'Daily ontology validation digest', key: 'digest' }
];

export default function SettingsPage() {
  const { data: clusters } = useSWR<ClusterSummary[]>('clusters', fetchClusters);
  const { data: orgContext } = useSWR('org-context', fetchOrgContext, { refreshInterval: 60000 });
  const [toggles, setToggles] = useState<Record<string, boolean>>({
    jobComplete: true,
    lowBalance: true,
    digest: false
  });
  const [savingCluster, setSavingCluster] = useState(false);
  const [clusterStatus, setClusterStatus] = useState<string | null>(null);
  const [clusterTableStatus, setClusterTableStatus] = useState<string | null>(null);
  const [clusterForm, setClusterForm] = useState<{
    name: string;
    provider: ClusterSummary['provider'];
    apiBaseUrl: string;
    apiToken: string;
    authHeaderName: string;
    gpuType: string;
    region: string;
    s3AccessKeyId: string;
    s3SecretAccessKey: string;
    s3SessionToken: string;
    s3Region: string;
  }>({
    name: '',
    provider: 'huggingface',
    apiBaseUrl: '',
    apiToken: '',
    authHeaderName: 'Authorization',
    gpuType: '',
    region: '',
    s3AccessKeyId: '',
    s3SecretAccessKey: '',
    s3SessionToken: '',
    s3Region: ''
  });
  const [clusterFormStatus, setClusterFormStatus] = useState<string | null>(null);
  const [orgForm, setOrgForm] = useState({ name: '', slug: '' });
  const [orgStatus, setOrgStatus] = useState<string | null>(null);
  const [updatingOrg, setUpdatingOrg] = useState(false);

  const currentDefault = orgContext?.org?.defaultClusterId;
  const isAdmin = (orgContext?.membership?.role ?? 'standard') === 'admin' || orgContext?.isGlobalAdmin;

  useEffect(() => {
    if (orgContext?.org) {
      setOrgForm({ name: orgContext.org.name ?? '', slug: orgContext.org.slug ?? '' });
    }
  }, [orgContext?.org?.name, orgContext?.org?.slug]);

  const handleToggle = (key: string) => {
    setToggles(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleClusterChange = async (clusterId: string) => {
    setSavingCluster(true);
    setClusterStatus(null);
    try {
      await setDefaultCluster(clusterId);
      mutate('org-context');
      setClusterStatus('Default cluster updated.');
    } catch (error) {
      setClusterStatus(error instanceof Error ? error.message : 'Unable to update default cluster');
    } finally {
      setSavingCluster(false);
    }
  };

  const handleClusterInput = (field: string) => (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const value = event.target.value;
    setClusterForm(prev => ({ ...prev, [field]: value }));
  };

  const handleClusterFormSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setClusterFormStatus('Saving cluster…');
    try {
      await createClusterRequest(clusterForm);
      setClusterForm({
        name: '',
        provider: 'huggingface',
        apiBaseUrl: '',
        apiToken: '',
        authHeaderName: 'Authorization',
        gpuType: '',
        region: '',
        s3AccessKeyId: '',
        s3SecretAccessKey: '',
        s3SessionToken: '',
        s3Region: ''
      });
      mutate('clusters');
      setClusterFormStatus('Cluster added.');
    } catch (error) {
      setClusterFormStatus(error instanceof Error ? error.message : 'Unable to create cluster');
    }
  };

  const handleOrgInput = (field: 'name' | 'slug') => (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setOrgForm(prev => ({ ...prev, [field]: value }));
  };

  const handleDeleteCluster = async (clusterId: string, locked?: boolean) => {
    if (locked) {
      setClusterTableStatus('Locked clusters cannot be removed.');
      return;
    }
    if (!window.confirm('Delete this cluster? Jobs pointed at it will fail until you choose another.')) return;
    setClusterTableStatus('Removing cluster…');
    try {
      await deleteCluster(clusterId);
      mutate('clusters');
      setClusterTableStatus('Cluster deleted.');
    } catch (error) {
      setClusterTableStatus(error instanceof Error ? error.message : 'Unable to delete cluster');
    }
  };

  const handleOrgSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!isAdmin) return;
    setOrgStatus('Saving organization…');
    setUpdatingOrg(true);
    try {
      await updateOrgProfile({ name: orgForm.name, slug: orgForm.slug });
      mutate('org-context');
      setOrgStatus('Organization updated.');
    } catch (error) {
      setOrgStatus(error instanceof Error ? error.message : 'Unable to update organization');
    } finally {
      setUpdatingOrg(false);
    }
  };

  return (
    <div className="space-y-6">
      <header className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-blue-500">Settings</p>
        <h1 className="text-3xl font-semibold text-slate-900">Workspace controls</h1>
        <p className="text-slate-500">Manage organization metadata, choose the default cluster, and fine-tune notification preferences.</p>
      </header>

      <section id="organization" className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Organization profile</h2>
            <p className="text-sm text-slate-500">Update the display name and slug shown across invites.</p>
          </div>
          {!isAdmin && <span className="rounded-full bg-slate-100 px-4 py-1 text-xs font-semibold text-slate-600">View only</span>}
        </div>
        <form onSubmit={handleOrgSubmit} className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="text-sm text-slate-700">
            Name
            <input
              type="text"
              value={orgForm.name}
              onChange={handleOrgInput('name')}
              disabled={!isAdmin}
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 disabled:bg-slate-50"
            />
          </label>
          <label className="text-sm text-slate-700">
            Slug
            <input
              type="text"
              value={orgForm.slug}
              onChange={handleOrgInput('slug')}
              disabled={!isAdmin}
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 disabled:bg-slate-50"
            />
          </label>
          <div className="md:col-span-2 flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={!isAdmin || updatingOrg}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-60"
            >
              {updatingOrg ? 'Saving…' : 'Save organization'}
            </button>
            <p className="text-xs text-slate-500">Slug updates propagate to invoices and invites.</p>
          </div>
          {orgStatus && <p className="md:col-span-2 text-sm text-slate-600">{orgStatus}</p>}
        </form>
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2 space-y-4">
          <h2 className="text-xl font-semibold text-slate-900">Default cluster</h2>
          <p className="text-sm text-slate-500">Pick where new jobs run by default. Managed clusters require payment, customer clusters count toward the free tier.</p>
          <div className="mt-2 space-y-3">
            {clusters?.map(cluster => (
              <label
                key={cluster.id}
                className={`flex cursor-pointer items-center justify-between rounded-lg border px-4 py-3 ${
                  cluster.id === currentDefault ? 'border-blue-500 bg-blue-50' : 'border-slate-200 bg-white'
                }`}
              >
                <div>
                  <p className="text-sm font-semibold text-slate-900">{cluster.name}</p>
                  <p className="text-xs text-slate-500 capitalize">
                    {cluster.provider} · {cluster.kind === 'managed' ? 'billable' : 'free tier'}
                  </p>
                </div>
                <input
                  type="radio"
                  name="default-cluster"
                  value={cluster.id}
                  checked={cluster.id === currentDefault}
                  onChange={() => handleClusterChange(cluster.id)}
                  disabled={savingCluster}
                  className="accent-blue-500"
                />
              </label>
            ))}
            {clusters && clusters.length === 0 && <p className="text-sm text-slate-500">No clusters yet. Admins can add one below.</p>}
            {!clusters && <p className="text-sm text-slate-500">Loading clusters…</p>}
            {clusterStatus && <p className="text-sm text-slate-600">{clusterStatus}</p>}
          </div>
          {isAdmin && (
            <form onSubmit={handleClusterFormSubmit} className="mt-4 grid gap-3 rounded-lg border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 md:grid-cols-2">
              <p className="md:col-span-2 text-xs uppercase tracking-[0.3em] text-slate-500">Add customer cluster</p>
              <label>
                Name
                <input
                  type="text"
                  value={clusterForm.name}
                  onChange={handleClusterInput('name')}
                  required
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
                />
              </label>
              <label>
                Provider
                <select
                  value={clusterForm.provider}
                  onChange={handleClusterInput('provider')}
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
                >
                  <option value="huggingface">Hugging Face</option>
                  <option value="meta">Meta</option>
                  <option value="nemo">NVIDIA NeMo</option>
                </select>
              </label>
              <label className="md:col-span-2">
                API base URL
                <input
                  type="url"
                  value={clusterForm.apiBaseUrl}
                  onChange={handleClusterInput('apiBaseUrl')}
                  required
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
                />
              </label>
              <label>
                API token
                <input
                  type="text"
                  value={clusterForm.apiToken}
                  onChange={handleClusterInput('apiToken')}
                  required
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
                />
              </label>
              <label>
                Auth header
                <input
                  type="text"
                  value={clusterForm.authHeaderName}
                  onChange={handleClusterInput('authHeaderName')}
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
                />
              </label>
              <label>
                GPU type
                <select
                  value={clusterForm.gpuType}
                  onChange={handleClusterInput('gpuType')}
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
                >
                  <option value="">Select GPU</option>
                  {gpuOptions.map(option => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Region
                <input
                  type="text"
                  value={clusterForm.region}
                  onChange={handleClusterInput('region')}
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
                />
              </label>
              <label>
                S3 access key
                <input
                  type="text"
                  value={clusterForm.s3AccessKeyId}
                  onChange={handleClusterInput('s3AccessKeyId')}
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
                  placeholder="Leave blank to reuse existing"
                />
              </label>
              <label>
                S3 secret key
                <input
                  type="password"
                  value={clusterForm.s3SecretAccessKey}
                  onChange={handleClusterInput('s3SecretAccessKey')}
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
                  placeholder="Leave blank to reuse existing"
                />
              </label>
              <label>
                S3 session token
                <input
                  type="password"
                  value={clusterForm.s3SessionToken}
                  onChange={handleClusterInput('s3SessionToken')}
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
                  placeholder="Optional"
                />
              </label>
              <label>
                S3 region
                <input
                  type="text"
                  value={clusterForm.s3Region}
                  onChange={handleClusterInput('s3Region')}
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
                />
              </label>
              <button type="submit" className="md:col-span-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500">
                Save cluster
              </button>
              {clusterFormStatus && <p className="md:col-span-2 text-xs text-slate-500">{clusterFormStatus}</p>}
            </form>
          )}
        </section>
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Training clusters</h2>
              <p className="text-sm text-slate-500">Endpoints configured for launches. Tokens and AWS credentials stay server-side.</p>
            </div>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-3 py-2">Name</th>
                  <th className="px-3 py-2">Endpoint</th>
                  <th className="px-3 py-2">Provider</th>
                  <th className="px-3 py-2">Token header</th>
                  <th className="px-3 py-2">GPU</th>
                  <th className="px-3 py-2">Region</th>
                  <th className="px-3 py-2">S3 access</th>
                  <th className="px-3 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(clusters ?? []).map(cluster => (
                  <tr key={cluster.id}>
                    <td className="px-3 py-3">
                      <div className="font-semibold text-slate-900">{cluster.name}</div>
                      <p className="text-xs text-slate-500">{cluster.tokenPreview ?? '—'}</p>
                    </td>
                    <td className="px-3 py-3 text-slate-600 break-all">{cluster.apiBaseUrl}</td>
                    <td className="px-3 py-3 capitalize text-slate-600">{cluster.provider}</td>
                    <td className="px-3 py-3 text-slate-600">{cluster.metadata?.authHeaderName ?? 'Authorization'}</td>
                    <td className="px-3 py-3 text-slate-600">{cluster.metadata?.gpuType ?? '—'}</td>
                    <td className="px-3 py-3 text-slate-600">{cluster.metadata?.region ?? '—'}</td>
                    <td className="px-3 py-3">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          cluster.metadata?.hasS3Credentials ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-600'
                        }`}
                      >
                        {cluster.metadata?.hasS3Credentials ? 'Configured' : 'Missing'}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-right">
                      {cluster.locked ? (
                        <span className="text-xs font-semibold text-slate-500">Locked</span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleDeleteCluster(cluster.id, cluster.locked)}
                          className="rounded-full border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-600 hover:border-rose-400"
                        >
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {clusters && clusters.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-3 py-6 text-center text-sm text-slate-500">
                      No clusters defined yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {clusterTableStatus && <p className="mt-3 text-sm text-slate-600">{clusterTableStatus}</p>}
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">Notifications</h2>
          <ul className="mt-4 space-y-3 text-sm text-slate-600">
            {preferenceToggles.map(pref => (
              <li key={pref.key} className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                {pref.label}
                <label className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide">
                  <input type="checkbox" checked={toggles[pref.key]} onChange={() => handleToggle(pref.key)} className="accent-blue-500" />
                  <span className={toggles[pref.key] ? 'text-emerald-600' : 'text-slate-500'}>
                    {toggles[pref.key] ? 'Enabled' : 'Disabled'}
                  </span>
                </label>
              </li>
            ))}
          </ul>
        </section>
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">Automation defaults</h2>
          <div className="mt-4 space-y-4 text-sm text-slate-700">
            <label className="block">
              Preferred base model
              <select className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900">
                <option>Llama 3.2 3B Instruct</option>
                <option>Llama 3.1 8B Instruct</option>
                <option>Nemotron 4 15B</option>
              </select>
            </label>
            <label className="block">
              Deployment target
              <select className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900">
                <option>EKS production</option>
                <option>Self-hosted edge</option>
              </select>
            </label>
          </div>
        </section>
      </div>
    </div>
  );
}
  const gpuOptions = ['L4', 'L40', 'H100', 'H200', 'A100', 'B100', 'B200', 'B10'];
