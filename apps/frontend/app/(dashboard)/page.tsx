import { JobMonitor } from '../../components/JobMonitor';
import { PipelineSteps } from '../../components/PipelineSteps';
import { TrainingConfigurator } from '../../components/TrainingConfigurator';

const metrics = [
  { label: 'Active ontologies', value: '42', delta: '+4 new this week' },
  { label: 'Queued jobs', value: '6', delta: '2 GPU, 4 Vertex' },
  { label: 'Avg. latency', value: '7.2 ms', delta: 'via vLLM + CPU autoscaling' },
  { label: 'Credit balance', value: '2.4M', delta: 'Enriched by billing last night' }
];

const activity = [
  { title: 'Policy underwriting bundle distilled', time: '3m ago', detail: '342 synthetic dialogues generated' },
  { title: 'Vertex job DF-09 completed', time: '21m ago', detail: 'Llama 3.1 8B LoRA adapters pushed to S3' },
  { title: 'New workflow "FX hedging" shared', time: '1h ago', detail: 'Approved by TreasuryOps' },
  { title: 'Credits topped up', time: '2h ago', detail: '$12k via enterprise billing' }
];

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <section className="glass-panel rounded-3xl bg-slate-900/70 p-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="space-y-3">
            <p className="text-sm uppercase tracking-[0.4em] text-brand-200">Business Logic Refinery</p>
            <h1 className="text-4xl font-semibold text-white">Operationalize deterministic SLMs</h1>
            <p className="max-w-2xl text-base text-slate-300">
              Streamline ingestion, distillation, and fine-tuning. Launch LoRA/QLoRA runs, monitor credits, and
              deploy to EKS or download portable vLLM containers—all inside one console.
            </p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-slate-900/60 px-5 py-4 text-right text-sm text-slate-300">
            <p>Last training session</p>
            <p className="text-2xl font-semibold text-white">58 minutes</p>
            <p className="text-xs text-slate-500">QLoRA · Llama 3.2 3B</p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {metrics.map(metric => (
          <article key={metric.label} className="glass-panel rounded-3xl border border-white/5 p-5">
            <p className="text-xs uppercase tracking-[0.35em] text-slate-500">{metric.label}</p>
            <p className="mt-3 text-3xl font-semibold text-white">{metric.value}</p>
            <p className="text-xs text-slate-400">{metric.delta}</p>
          </article>
        ))}
      </section>

      <PipelineSteps />

      <section className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <TrainingConfigurator />
        </div>
        <div className="lg:col-span-5">
          <JobMonitor />
        </div>
      </section>

      <section className="glass-panel grid gap-6 rounded-3xl border border-white/5 p-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-brand-200">Activity</p>
            <h2 className="text-2xl font-semibold text-white">What's happening</h2>
          </div>
          <ul className="space-y-4">
            {activity.map(item => (
              <li key={item.title} className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
                <p className="text-sm font-semibold text-white">{item.title}</p>
                <p className="text-xs text-slate-400">{item.detail}</p>
                <p className="text-[11px] uppercase tracking-wide text-slate-500">{item.time}</p>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-3xl border border-dashed border-brand-400/30 bg-slate-900/40 p-6 text-sm text-slate-300">
          <p className="text-xs uppercase tracking-[0.3em] text-brand-200">Job health</p>
          <h3 className="mt-3 text-3xl font-semibold text-white">99.3%</h3>
          <p className="text-xs text-slate-400">SLA adherence this week</p>
          <div className="mt-6 space-y-3">
            <div>
              <p className="text-xs text-slate-400">GPU occupancy</p>
              <div className="h-2 rounded-full bg-slate-800">
                <div className="h-full rounded-full bg-gradient-to-r from-brand-300 to-brand-500" style={{ width: '76%' }} />
              </div>
            </div>
            <div>
              <p className="text-xs text-slate-400">Curriculum coverage</p>
              <div className="h-2 rounded-full bg-slate-800">
                <div className="h-full rounded-full bg-emerald-400" style={{ width: '92%' }} />
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
