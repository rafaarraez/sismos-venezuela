export function ChartShell({
  title,
  subtitle,
  icon,
  children,
  className = "",
}: {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`glass fade-up p-4 sm:p-5 ${className}`}>
      <header className="mb-4 flex items-center gap-2.5">
        {icon && <span className="text-accent">{icon}</span>}
        <div>
          <h3 className="text-sm font-semibold text-fg sm:text-base">{title}</h3>
          {subtitle && <p className="text-xs text-muted">{subtitle}</p>}
        </div>
      </header>
      {children}
    </section>
  );
}

export function emptyHint(label: string) {
  return (
    <div className="grid h-[240px] place-items-center text-sm text-muted">
      {label}
    </div>
  );
}
