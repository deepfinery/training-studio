import { JobMonitor } from '../../../components/JobMonitor';
import { FileUploadPanel } from '../../../components/FileUploadPanel';
import { TrainingConfigurator } from '../../../components/TrainingConfigurator';

export default function TrainingPage() {
  return (
    <div className="space-y-8">
      <header className="glass-panel rounded-3xl border border-white/5 p-6">
        <p className="text-sm uppercase tracking-[0.35em] text-brand-200">Training Hub</p>
        <h1 className="text-3xl font-semibold text-white">Configure, dispatch, and review every job</h1>
        <p className="text-slate-300">Select a cluster, review billing state, and launch jobs that fan out to DeepFinery or customer Kubernetes APIs.</p>
      </header>
      <FileUploadPanel />
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <TrainingConfigurator />
        </div>
        <div className="lg:col-span-5">
          <JobMonitor />
        </div>
      </div>
    </div>
  );
}
