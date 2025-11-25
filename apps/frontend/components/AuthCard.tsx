interface AuthCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export function AuthCard({ title, subtitle, children, footer }: AuthCardProps) {
  return (
    <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/70">
      <div className="space-y-2 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-blue-500">DeepFinery</p>
        <h1 className="text-3xl font-semibold text-slate-900">{title}</h1>
        {subtitle && <p className="text-sm text-slate-600">{subtitle}</p>}
      </div>
      <div className="mt-6 space-y-6">
        {children}
        {footer && <div className="border-t border-slate-200 pt-4 text-center text-sm text-slate-600">{footer}</div>}
      </div>
    </div>
  );
}
