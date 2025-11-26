import Link from 'next/link';
import { TrainingConfigurator } from '../../../components/TrainingConfigurator';
import { TrainingJobsTable } from '../../../components/TrainingJobsTable';

export default function TrainingPage() {
  return (
    <div className="space-y-6">
      <header className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-blue-500">Training hub</p>
        <h1 className="text-3xl font-semibold text-slate-900">Configure, dispatch, and review jobs</h1>
        <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
          <p>Select a cluster, review billing state, and launch jobs that fan out to DeepFinery or customer Kubernetes APIs.</p>
          <Link href="/training/results" className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-blue-600 hover:border-blue-400">
            View training results
          </Link>
        </div>
      </header>
      <div className="grid gap-6 lg:grid-cols-2">
        <TrainingConfigurator />
        <TrainingJobsTable allowActions title="Job queue" description="Manage active and recent jobs" />
      </div>
    </div>
  );
}
