const steps = [
  {
    title: 'Ingest & Refine',
    description: 'Upload policy docs, let the Agentic Teacher resolve ambiguities into an ontology.'
  },
  {
    title: 'Distill',
    description: 'Synthetic data generation renders AML prompts + Drools-style decisions.'
  },
  {
    title: 'Train',
    description: 'Fine-tune LoRA/QLoRA/full SLMs with TRL and dynamic packing.'
  },
  {
    title: 'Serve & Reinforce',
    description: 'Deploy via vLLM REST on EKS or download the container for the edge.'
  }
];

export function PipelineSteps() {
  return (
    <section className="col-span-12 grid gap-4 md:grid-cols-4">
      {steps.map((step, index) => (
        <article key={step.title} className="gradient-card flex flex-col gap-2 rounded-3xl px-4 py-5">
          <p className="text-xs uppercase tracking-[0.3em] text-brand-200">Step {index + 1}</p>
          <h3 className="text-lg font-semibold text-white">{step.title}</h3>
          <p className="text-sm text-slate-300">{step.description}</p>
        </article>
      ))}
    </section>
  );
}
