import {
  Activity,
  Gauge,
  TrendingUp,
  Waves,
  CalendarClock,
  ArrowDownToLine,
  Sigma,
  Clock,
} from "lucide-react";
import type { Stats } from "@/lib/stats";
import { magnitudeColor } from "@/lib/constants";

interface CardDef {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint?: string;
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
            className="mt-2 text-2xl font-bold tabular-nums sm:text-3xl"
            style={accent ? { color: accent } : undefined}
          >
            {value}
          </p>
          {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
        </div>
        <div
          className="grid h-10 w-10 shrink-0 place-items-center rounded-xl"
          style={{
            background: `${accent ?? "#38bdf8"}1a`,
            color: accent ?? "#38bdf8",
          }}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

export function StatsGrid({ stats }: { stats: Stats }) {
  const cards: CardDef[] = [
    {
      icon: <Activity size={18} />,
      label: "Sismos registrados",
      value: stats.total.toLocaleString("es-VE"),
      hint: `${stats.last24h} en las últimas 24 h`,
      accent: "#38bdf8",
    },
    {
      icon: <Gauge size={18} />,
      label: "Magnitud promedio",
      value: stats.avgMag != null ? stats.avgMag.toFixed(2) : "N/D",
      hint: "Escala de Richter",
      accent: stats.avgMag != null ? magnitudeColor(stats.avgMag) : undefined,
    },
    {
      icon: <TrendingUp size={18} />,
      label: "Magnitud máxima",
      value: stats.maxMag != null ? stats.maxMag.toFixed(1) : "N/D",
      hint: stats.strongest?.place ?? "—",
      accent: stats.maxMag != null ? magnitudeColor(stats.maxMag) : undefined,
    },
    {
      icon: <Sigma size={18} />,
      label: "Variación de intensidad",
      value: stats.stdMag != null ? `±${stats.stdMag.toFixed(2)}` : "N/D",
      hint: "Desviación estándar",
      accent: "#a78bfa",
    },
    {
      icon: <CalendarClock size={18} />,
      label: "Frecuencia diaria",
      value: stats.perDay.toFixed(1),
      hint: "Sismos por día (promedio)",
      accent: "#f59e0b",
    },
    {
      icon: <ArrowDownToLine size={18} />,
      label: "Profundidad promedio",
      value: stats.avgDepth != null ? `${stats.avgDepth.toFixed(0)} km` : "N/D",
      hint: "Bajo la superficie",
      accent: "#34d399",
    },
    {
      icon: <Waves size={18} />,
      label: "Rango de magnitud",
      value:
        stats.minMag != null && stats.maxMag != null
          ? `${stats.minMag.toFixed(1)}–${stats.maxMag.toFixed(1)}`
          : "N/D",
      hint: "Mínima a máxima",
      accent: "#fb7185",
    },
    {
      icon: <Clock size={18} />,
      label: "Reportados por personas",
      value: stats.felt.toLocaleString("es-VE"),
      hint: '"Lo sentí" (USGS)',
      accent: "#22d3ee",
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
