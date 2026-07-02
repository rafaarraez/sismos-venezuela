import {
  Zap,
  Bomb,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  Layers,
  Clock4,
  CalendarDays,
  MapPinned,
} from "lucide-react";
import type { Stats } from "@/lib/stats";
import { formatEnergy } from "@/lib/format";

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
  accent: string;
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
            className="mt-2 text-xl font-bold tabular-nums sm:text-2xl"
            style={{ color: accent }}
          >
            {value}
          </p>
          {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
        </div>
        <div
          className="grid h-9 w-9 shrink-0 place-items-center rounded-lg"
          style={{ background: `${accent}1a`, color: accent }}
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
      ? "#94a3b8"
      : stats.trend24h > 10
      ? "#ef4444"
      : stats.trend24h < -10
      ? "#34d399"
      : "#eab308";

  const cards: CardDef[] = [
    {
      icon: <Zap size={17} />,
      label: "Energía liberada",
      value: formatEnergy(stats.energyJoules),
      hint:
        stats.energyMagEq != null
          ? `≈ magnitud ${stats.energyMagEq.toFixed(1)} equivalente`
          : "—",
      accent: "#f59e0b",
    },
    {
      icon: <Bomb size={17} />,
      label: "Equivalente TNT",
      value: tnt(stats.tntTons),
      hint: "Energía total en explosivo",
      accent: "#fb923c",
    },
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
      accent: "#ef4444",
    },
    {
      icon: <Layers size={17} />,
      label: "Superficiales",
      value: `${pct(stats.shallow)}`,
      hint: `< 70 km · ${stats.intermediate} interm. · ${stats.deep} prof.`,
      accent: "#34d399",
    },
    {
      icon: <Clock4 size={17} />,
      label: "Hora pico",
      value:
        stats.peakHour != null
          ? `${String(stats.peakHour).padStart(2, "0")}:00`
          : "—",
      hint: "Mayor actividad del día",
      accent: "#a78bfa",
    },
    {
      icon: <CalendarDays size={17} />,
      label: "Día más activo",
      value: stats.busiestDay ? `${stats.busiestDay.count}` : "—",
      hint: stats.busiestDay ? stats.busiestDay.label : "—",
      accent: "#38bdf8",
    },
    {
      icon: <MapPinned size={17} />,
      label: "Zona más activa",
      value: stats.topRegion ?? "—",
      hint: `Mediana de magnitud: ${
        stats.medianMag != null ? stats.medianMag.toFixed(1) : "N/D"
      }`,
      accent: "#2dd4bf",
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
