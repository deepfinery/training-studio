import { TrainingConfigurator } from '../../../components/TrainingConfigurator';
import { TrainingJobsTable } from '../../../components/TrainingJobsTable';

export default function TrainingPage() {
  return (
    <div className="space-y-6">
      <header className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-blue-500">Training hub</p>
        <h1 className="text-3xl font-semibold text-slate-900">Configure, dispatch, and review jobs</h1>
        <p className="text-slate-500">Select a cluster, review billing state, and launch jobs that fan out to DeepFinery or customer Kubernetes APIs.</p>
      </header>
      <div className="grid gap-6 lg:grid-cols-2">
        <TrainingConfigurator />
        <TrainingJobsTable allowActions title="Job queue" description="Manage active and recent jobs" />
      </div>
    </div>
  );
}
