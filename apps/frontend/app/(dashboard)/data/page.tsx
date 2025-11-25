import { FileUploadPanel } from '../../../components/FileUploadPanel';
import { HistoryPanel } from '../../../components/HistoryPanel';
import { DatasetTable } from '../../../components/DatasetTable';

export default function DataPage() {
  return (
    <div className="space-y-6">
      <header className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-blue-500">Datasets</p>
        <h1 className="text-3xl font-semibold text-slate-900">Manage uploads & lineage</h1>
        <p className="text-slate-500">
          Each project is isolated into its own S3 prefix. Upload datasets, capture metadata, and wire them into training runs.
        </p>
      </header>
      <DatasetTable />
      <FileUploadPanel />
      <HistoryPanel />
    </div>
  );
}
