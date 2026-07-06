import { Activity, TrendingUp, Clock, Zap } from "lucide-react";
import type { Stats } from "@/lib/stats";
import { magnitudeColor } from "@/lib/constants";
import { formatEnergy, timeAgoFromDiff } from "@/lib/format";

interface CardDef {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint?: string;
  /** Solo los valores que SON una magnitud llevan color; el resto, neutro. */
  accent?: string;
}

function Card({ icon, label, value, hint, accent }: CardDef) {
  return (
    <div className="glass glass-hover fade-up p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">
            {label}
          </p>
          <p
            className="mt-2 truncate text-2xl font-bold tabular-nums sm:text-3xl"
            style={accent ? { color: accent } : undefined}
          >
            {value}
          </p>
          {hint && <p className="mt-1 truncate text-xs text-muted">{hint}</p>}
        </div>
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent-2/10 text-accent-2">
          {icon}
        </div>
      </div>
    </div>
  );
}

export function StatsGrid({ stats }: { stats: Stats }) {
  const trend =
    stats.trend24h != null
      ? ` · ${stats.trend24h >= 0 ? "+" : ""}${stats.trend24h.toFixed(0)}% vs día previo`
      : "";

  const cards: CardDef[] = [
    {
      icon: <Activity size={18} />,
      label: "Sismos registrados",
      value: stats.total.toLocaleString("es-VE"),
      hint: `${stats.last24h} en las últimas 24 h${trend}`,
    },
    {
      icon: <TrendingUp size={18} />,
      label: "Magnitud máxima",
      value: stats.maxMag != null ? stats.maxMag.toFixed(1) : "N/D",
      hint: stats.strongest?.place ?? "—",
      accent: stats.maxMag != null ? magnitudeColor(stats.maxMag) : undefined,
    },
    {
      icon: <Clock size={18} />,
      label: "Último sismo",
      value:
        stats.msSinceLatest != null
          ? timeAgoFromDiff(stats.msSinceLatest)
          : "—",
      hint: stats.latest?.place ?? "—",
    },
    {
      icon: <Zap size={18} />,
      label: "Energía liberada",
      value: formatEnergy(stats.energyJoules),
      hint:
        stats.energyMagEq != null
          ? `≈ magnitud ${stats.energyMagEq.toFixed(1)} equivalente`
          : "—",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      {cards.map((c) => (
        <Card key={c.label} {...c} />
      ))}
    </div>
  );
}
