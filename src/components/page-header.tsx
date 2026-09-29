export function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <header className="mb-6">
      <h1 className="text-2xl font-semibold sm:text-3xl">{title}</h1>
      {subtitle && <p className="mt-1 text-base text-muted-foreground">{subtitle}</p>}
    </header>
  );
}

export function ComingSoon({ phase, children }: { phase: number; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed p-6 text-base text-muted-foreground">
      <p>{children}</p>
      <p className="mt-2 text-sm">Em construção (fase {phase} do plano).</p>
    </div>
  );
}
