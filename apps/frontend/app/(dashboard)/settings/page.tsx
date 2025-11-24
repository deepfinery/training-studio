'use client';

import { ChangeEvent, FormEvent, useState } from 'react';
import useSWR, { mutate } from 'swr';
import Link from 'next/link';
import { ClusterSummary, createClusterRequest, fetchClusters, fetchOrgContext, setDefaultCluster } from '../../../lib/api';

const preferenceToggles = [
  { label: 'Email me when a training job completes', key: 'jobComplete' },
  { label: 'Notify me when credit balance < 1 job', key: 'lowBalance' },
  { label: 'Daily ontology validation digest', key: 'digest' }
];

export default function SettingsPage() {
  const { data: clusters } = useSWR<ClusterSummary[]>('clusters', fetchClusters);
  const { data: orgContext } = useSWR('org-context', fetchOrgContext);
  const [toggles, setToggles] = useState<Record<string, boolean>>({
    jobComplete: true,
    lowBalance: true,
    digest: false
  });
  const [savingCluster, setSavingCluster] = useState(false);
  const [clusterStatus, setClusterStatus] = useState<string | null>(null);
  const [clusterForm, setClusterForm] = useState<{
    name: string;
    provider: ClusterSummary['provider'];
    apiBaseUrl: string;
    apiToken: string;
    gpuType: string;
    region: string;
  }>({
    name: '',
    provider: 'huggingface',
    apiBaseUrl: '',
    apiToken: '',
    gpuType: '',
    region: ''
  });
  const [clusterFormStatus, setClusterFormStatus] = useState<string | null>(null);

  const currentDefault = orgContext?.org?.defaultClusterId;
  const isAdmin = (orgContext?.membership?.role ?? 'standard') === 'admin' || orgContext?.isGlobalAdmin;

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
      setClusterForm({ name: '', provider: 'huggingface', apiBaseUrl: '', apiToken: '', gpuType: '', region: '' });
      mutate('clusters');
      setClusterFormStatus('Cluster added.');
    } catch (error) {
      setClusterFormStatus(error instanceof Error ? error.message : 'Unable to create cluster');
    }
  };

  return (
    <div className="space-y-6">
      <header className="glass-panel rounded-3xl border border-white/5 p-6">
        <p className="text-sm uppercase tracking-[0.35em] text-brand-200">Settings</p>
        <h1 className="text-3xl font-semibold text-white">Workspace controls</h1>
        <p className="text-slate-300">Choose your default cluster, tune notifications, and jump to profile or security panels.</p>
      </header>
      <div className="grid gap-6 lg:grid-cols-3">
        <section className="glass-panel rounded-3xl border border-white/5 p-6 lg:col-span-2 space-y-4">
          <h2 className="text-xl font-semibold text-white">Default cluster</h2>
          <p className="text-sm text-slate-400">Pick where new jobs run by default. Managed clusters require payment, customer clusters count toward the free tier.</p>
          <div className="mt-4 space-y-3">
            {clusters?.map(cluster => (
              <label
                key={cluster.id}
                className={`flex cursor-pointer items-center justify-between rounded-2xl border px-4 py-3 ${cluster.id === currentDefault ? 'border-brand-400 bg-brand-400/10' : 'border-white/10 bg-slate-900/40'}`}
              >
                <div>
                  <p className="text-sm font-semibold text-white">{cluster.name}</p>
                  <p className="text-xs text-slate-400 capitalize">
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
                  className="accent-brand-400"
                />
              </label>
            ))}
            {clusters && clusters.length === 0 && <p className="text-sm text-slate-400">No clusters yet. Admins can add one from the Training tab.</p>}
            {!clusters && <p className="text-sm text-slate-400">Loading clusters…</p>}
            {clusterStatus && (
              <p className={`text-sm ${clusterStatus.includes('Unable') ? 'text-rose-200' : 'text-emerald-200'}`}>{clusterStatus}</p>
            )}
          </div>
          {isAdmin && (
            <form onSubmit={handleClusterFormSubmit} className="mt-4 grid gap-3 rounded-2xl border border-dashed border-white/10 bg-slate-900/40 p-4 text-sm text-slate-200 md:grid-cols-2">
              <p className="md:col-span-2 text-xs uppercase tracking-[0.3em] text-slate-500">Add customer cluster</p>
              <label className="md:col-span-1">
                Name
                <input
                  type="text"
                  value={clusterForm.name}
                  onChange={handleClusterInput('name')}
                  required
                  className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950/40 px-3 py-2 text-white"
                />
              </label>
              <label>
                Provider
                <select
                  value={clusterForm.provider}
                  onChange={handleClusterInput('provider')}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950/40 px-3 py-2 text-white"
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
                  className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950/40 px-3 py-2 text-white"
                />
              </label>
              <label className="md:col-span-2">
                API token
                <input
                  type="text"
                  value={clusterForm.apiToken}
                  onChange={handleClusterInput('apiToken')}
                  required
                  className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950/40 px-3 py-2 text-white"
                />
              </label>
              <label>
                GPU type
                <input
                  type="text"
                  value={clusterForm.gpuType}
                  onChange={handleClusterInput('gpuType')}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950/40 px-3 py-2 text-white"
                />
              </label>
              <label>
                Region
                <input
                  type="text"
                  value={clusterForm.region}
                  onChange={handleClusterInput('region')}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-slate-950/40 px-3 py-2 text-white"
                />
              </label>
              <button type="submit" className="md:col-span-2 rounded-2xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white">
                Save cluster
              </button>
              {clusterFormStatus && <p className="md:col-span-2 text-xs text-slate-400">{clusterFormStatus}</p>}
            </form>
          )}
        </section>
        <section className="glass-panel rounded-3xl border border-white/5 p-6">
          <h2 className="text-xl font-semibold text-white">Profile & security</h2>
          <p className="text-sm text-slate-400">Manage personal details and passwords from dedicated screens.</p>
          <div className="mt-4 space-y-3">
            <Link className="block rounded-2xl border border-white/10 px-4 py-3 text-sm text-slate-200 transition hover:border-brand-400 hover:text-white" href="/profile">
              Profile & contact info
            </Link>
            <Link className="block rounded-2xl border border-white/10 px-4 py-3 text-sm text-slate-200 transition hover:border-brand-400 hover:text-white" href="/profile#security">
              Security & passwords
            </Link>
          </div>
        </section>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="glass-panel rounded-3xl border border-white/5 p-6">
          <h2 className="text-xl font-semibold text-white">Notifications</h2>
          <ul className="mt-4 space-y-3 text-sm text-slate-300">
            {preferenceToggles.map(pref => (
              <li
                key={pref.key}
                className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-900/40 px-4 py-3"
              >
                {pref.label}
                <label className="inline-flex items-center gap-2 text-[10px] uppercase tracking-wide">
                  <input
                    type="radio"
                    checked={toggles[pref.key]}
                    onChange={() => handleToggle(pref.key)}
                    className="accent-brand-400"
                  />
                  <span className={toggles[pref.key] ? 'text-emerald-200' : 'text-slate-500'}>
                    {toggles[pref.key] ? 'enabled' : 'disabled'}
                  </span>
                </label>
              </li>
            ))}
          </ul>
        </section>
        <section className="glass-panel rounded-3xl border border-white/5 p-6">
          <h2 className="text-xl font-semibold text-white">Automation defaults</h2>
          <div className="mt-4 space-y-4 text-sm text-slate-300">
            <label>
              Preferred base model
              <select className="mt-1 w-full rounded-2xl border border-white/10 bg-slate-900/40 px-4 py-3 text-white">
                <option>Llama 3.2 3B Instruct</option>
                <option>Llama 3.1 8B Instruct</option>
                <option>Nemotron 4 15B</option>
              </select>
            </label>
            <label>
              Deployment target
              <select className="mt-1 w-full rounded-2xl border border-white/10 bg-slate-900/40 px-4 py-3 text-white">
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
