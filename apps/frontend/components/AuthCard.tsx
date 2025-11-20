interface AuthCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export function AuthCard({ title, subtitle, children, footer }: AuthCardProps) {
  return (
    <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-8 shadow-2xl shadow-black/40">
      <div className="space-y-2 text-center">
        <p className="text-xs uppercase tracking-[0.4em] text-brand-200">DeepFinery</p>
        <h1 className="text-3xl font-semibold text-white">{title}</h1>
        {subtitle && <p className="text-sm text-slate-300">{subtitle}</p>}
      </div>
      <div className="mt-6 space-y-6">
        {children}
        {footer && <div className="border-t border-white/10 pt-4 text-center text-sm text-slate-400">{footer}</div>}
      </div>
    </div>
  );
}
