import { FileUploadPanel } from '../../../components/FileUploadPanel';
import { HistoryPanel } from '../../../components/HistoryPanel';
import { EvaluationForm } from '../../../components/EvaluationForm';

export default function DataPage() {
  return (
    <div className="space-y-6">
      <header className="glass-panel rounded-3xl border border-white/5 p-6">
        <p className="text-sm uppercase tracking-[0.35em] text-brand-200">Datasets</p>
        <h1 className="text-3xl font-semibold text-white">Manage uploads & lineage</h1>
        <p className="text-slate-300">Each user is isolated into their own S3 prefix. Upload datasets, then wire them into training runs and evaluations.</p>
      </header>
      <FileUploadPanel />
      <EvaluationForm />
      <HistoryPanel />
    </div>
  );
}
