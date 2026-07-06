import {
  Bomb,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  Layers,
  Clock4,
  CalendarDays,
  MapPinned,
  Waves,
} from "lucide-react";
import type { Stats } from "@/lib/stats";

function tnt(tons: number): string {
  if (tons >= 1e6) return `${(tons / 1e6).toFixed(2)} Mt`;
  if (tons >= 1e3) return `${(tons / 1e3).toFixed(2)} kt`;
  return `${tons.toFixed(1)} t`;
}

interface CardDef {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint?: string;
  /** Solo estados con semántica (tendencia, severidad) llevan color. */
  accent?: string;
}

function Card({ icon, label, value, hint, accent }: CardDef) {
  return (
    <div className="glass glass-hover fade-up p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">
            {label}
          </p>
          <p
            className="mt-2 truncate text-xl font-bold tabular-nums sm:text-2xl"
            style={accent ? { color: accent } : undefined}
          >
            {value}
          </p>
          {hint && <p className="mt-1 truncate text-xs text-muted">{hint}</p>}
        </div>
        <div
          className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${
            accent ? "" : "bg-accent-2/10 text-accent-2"
          }`}
          style={
            accent ? { background: `${accent}1a`, color: accent } : undefined
          }
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

export function AdvancedStats({ stats }: { stats: Stats }) {
  const pct = (n: number) =>
    stats.total > 0 ? `${((n / stats.total) * 100).toFixed(0)}%` : "—";

  const trendIcon =
    stats.trend24h == null ? (
      <Minus size={17} />
    ) : stats.trend24h >= 0 ? (
      <TrendingUp size={17} />
    ) : (
      <TrendingDown size={17} />
    );
  const trendColor =
    stats.trend24h == null
      ? undefined
      : stats.trend24h > 10
      ? "#ef4444"
      : stats.trend24h < -10
      ? "#34d399"
      : "#eab308";

  const cards: CardDef[] = [
    {
      icon: trendIcon,
      label: "Tendencia 24 h",
      value:
        stats.trend24h == null
          ? "N/D"
          : `${stats.trend24h >= 0 ? "+" : ""}${stats.trend24h.toFixed(0)}%`,
      hint: `${stats.last24h} ahora vs ${stats.prev24h} antes`,
      accent: trendColor,
    },
    {
      icon: <AlertTriangle size={17} />,
      label: "Sismos significativos",
      value: stats.significant4.toLocaleString("es-VE"),
      hint: `M ≥ 4 · ${stats.significant5} con M ≥ 5`,
      accent: stats.significant4 > 0 ? "#ef4444" : undefined,
    },
    {
      icon: <Bomb size={17} />,
      label: "Equivalente TNT",
      value: tnt(stats.tntTons),
      hint: "Energía total en explosivo",
    },
    {
      icon: <Waves size={17} />,
      label: "Reportados por personas",
      value: stats.felt.toLocaleString("es-VE"),
      hint: '"Lo sentí" (USGS y SGC)',
    },
    {
      icon: <Layers size={17} />,
      label: "Superficiales",
      value: `${pct(stats.shallow)}`,
      hint: `< 70 km · ${stats.intermediate} interm. · ${stats.deep} prof.`,
    },
    {
      icon: <Clock4 size={17} />,
      label: "Hora pico",
      value:
        stats.peakHour != null
          ? `${String(stats.peakHour).padStart(2, "0")}:00`
          : "—",
      hint: "Mayor actividad del día",
    },
    {
      icon: <CalendarDays size={17} />,
      label: "Día más activo",
      value: stats.busiestDay ? `${stats.busiestDay.count}` : "—",
      hint: stats.busiestDay ? stats.busiestDay.label : "—",
    },
    {
      icon: <MapPinned size={17} />,
      label: "Zona más activa",
      value: stats.topRegion ?? "—",
      hint: `Mediana de magnitud: ${
        stats.medianMag != null ? stats.medianMag.toFixed(1) : "N/D"
      }`,
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
