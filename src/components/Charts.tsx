"use client";

import { useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  Legend,
} from "recharts";
import { CalendarRange, BarChart3, MapPinned } from "lucide-react";
import { emptyHint } from "./ChartShell";
import {
  dailyBuckets,
  hourlyBuckets,
  magBuckets,
  depthBuckets,
  topRegions,
  cumulativeEnergy,
  type DailyBucket,
} from "@/lib/stats";
import { formatEnergy } from "@/lib/format";
import type { Quake } from "@/lib/types";

const AXIS = { fill: "#93a0bd", fontSize: 11 };
const GRID = "rgba(148,163,184,0.12)";
/** Un solo matiz para "cantidad de sismos" en todos los gráficos. */
const COUNT_COLOR = "#38bdf8";

interface TipProps {
  active?: boolean;
  payload?: Array<{ name?: string; value?: number; color?: string; payload?: unknown }>;
  label?: string | number;
}

function Tip({ active, payload, label }: TipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass !rounded-lg p-2.5 text-xs shadow-xl">
      {label != null && (
        <p className="mb-1 font-semibold text-fg">{label}</p>
      )}
      {payload.map((p, i) => (
        <p key={i} className="flex items-center gap-1.5 text-muted">
          <span
            className="inline-block h-2 w-2 rounded-full"
            style={{ background: p.color }}
          />
          {p.name}:{" "}
          <span className="font-semibold text-fg tabular-nums">
            {typeof p.value === "number" ? p.value.toFixed(p.value % 1 ? 2 : 0) : p.value}
          </span>
        </p>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Tarjeta con pestañas                                                */
/* ------------------------------------------------------------------ */

interface TabDef {
  id: string;
  label: string;
  subtitle: string;
  render: () => React.ReactNode;
}

function TabbedChartCard({
  title,
  icon,
  tabs,
}: {
  title: string;
  icon?: React.ReactNode;
  tabs: TabDef[];
}) {
  const [active, setActive] = useState(tabs[0].id);
  const tab = tabs.find((t) => t.id === active) ?? tabs[0];

  return (
    <section className="glass fade-up p-4 sm:p-5">
      <header className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          {icon && <span className="text-accent-2">{icon}</span>}
          <div>
            <h3 className="text-sm font-semibold text-fg sm:text-base">
              {title}
            </h3>
            <p className="text-xs text-muted">{tab.subtitle}</p>
          </div>
        </div>
        <div className="flex gap-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setActive(t.id)}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${
                t.id === active
                  ? "bg-accent-2/15 text-accent-2"
                  : "text-muted hover:bg-white/5 hover:text-fg"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </header>
      {tab.render()}
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Cuerpos de gráfico                                                  */
/* ------------------------------------------------------------------ */

function FrequencyBody({ data }: { data: DailyBucket[] }) {
  if (data.length === 0) return emptyHint("Sin datos para los filtros actuales");
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ top: 6, right: 6, left: -18, bottom: 0 }}>
        <CartesianGrid stroke={GRID} vertical={false} />
        <XAxis dataKey="label" tick={AXIS} tickLine={false} axisLine={false} />
        <YAxis tick={AXIS} tickLine={false} axisLine={false} allowDecimals={false} />
        <Tooltip content={<Tip />} cursor={{ fill: "rgba(148,163,184,0.08)" }} />
        <Bar dataKey="count" name="Sismos" radius={[5, 5, 0, 0]} fill={COUNT_COLOR} maxBarSize={46} isAnimationActive={false} />
      </BarChart>
    </ResponsiveContainer>
  );
}

function IntensityBody({ data }: { data: DailyBucket[] }) {
  if (data.length === 0) return emptyHint("Sin datos para los filtros actuales");
  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={data} margin={{ top: 6, right: 10, left: -18, bottom: 0 }}>
        <CartesianGrid stroke={GRID} vertical={false} />
        <XAxis dataKey="label" tick={AXIS} tickLine={false} axisLine={false} />
        <YAxis
          tick={AXIS}
          tickLine={false}
          axisLine={false}
          domain={[0, (max: number) => Math.ceil(max + 0.5)]}
        />
        <Tooltip content={<Tip />} />
        <Legend wrapperStyle={{ fontSize: 11, color: "#93a0bd" }} iconType="plainline" />
        <Line
          type="monotone"
          dataKey="maxMag"
          name="Máxima"
          stroke="#ef4444"
          strokeWidth={2}
          dot={{ r: 2.5 }}
          connectNulls
          isAnimationActive={false}
        />
        <Line
          type="monotone"
          dataKey="avgMag"
          name="Promedio"
          stroke={COUNT_COLOR}
          strokeWidth={2.5}
          dot={{ r: 2.5 }}
          connectNulls
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

function EnergyBody({ quakes }: { quakes: Quake[] }) {
  const data = cumulativeEnergy(quakes);
  if (data.length === 0) return emptyHint("Sin datos para los filtros actuales");
  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart data={data} margin={{ top: 6, right: 10, left: 4, bottom: 0 }}>
        <defs>
          <linearGradient id="enGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.5} />
            <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={GRID} vertical={false} />
        <XAxis dataKey="label" tick={AXIS} tickLine={false} axisLine={false} />
        <YAxis
          tick={AXIS}
          tickLine={false}
          axisLine={false}
          width={56}
          tickFormatter={(v: number) => formatEnergy(v)}
        />
        <Tooltip
          content={({ active, payload, label }) => {
            if (!active || !payload?.length) return null;
            return (
              <div className="glass !rounded-lg p-2.5 text-xs shadow-xl">
                <p className="mb-1 font-semibold text-fg">{label}</p>
                <p className="text-muted">
                  Acumulada:{" "}
                  <span className="font-semibold text-accent">
                    {formatEnergy(payload[0].value as number)}
                  </span>
                </p>
              </div>
            );
          }}
        />
        <Area
          type="monotone"
          dataKey="cumulative"
          name="Energía"
          stroke="#f59e0b"
          strokeWidth={2}
          fill="url(#enGrad)"
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function MagnitudeBody({ quakes }: { quakes: Quake[] }) {
  const data = magBuckets(quakes);
  if (!data.some((d) => d.count > 0))
    return emptyHint("Sin datos para los filtros actuales");
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ top: 6, right: 6, left: -18, bottom: 0 }}>
        <CartesianGrid stroke={GRID} vertical={false} />
        <XAxis dataKey="range" tick={AXIS} tickLine={false} axisLine={false} />
        <YAxis tick={AXIS} tickLine={false} axisLine={false} allowDecimals={false} />
        <Tooltip content={<Tip />} cursor={{ fill: "rgba(148,163,184,0.08)" }} />
        <Bar dataKey="count" name="Sismos" radius={[5, 5, 0, 0]} maxBarSize={56} isAnimationActive={false}>
          {data.map((d) => (
            <Cell key={d.range} fill={d.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

function DepthBody({ quakes }: { quakes: Quake[] }) {
  const data = depthBuckets(quakes);
  if (!data.some((d) => d.count > 0))
    return emptyHint("Sin datos para los filtros actuales");
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ top: 6, right: 6, left: -18, bottom: 0 }}>
        <CartesianGrid stroke={GRID} vertical={false} />
        <XAxis dataKey="range" tick={AXIS} tickLine={false} axisLine={false} />
        <YAxis tick={AXIS} tickLine={false} axisLine={false} allowDecimals={false} />
        <Tooltip content={<Tip />} cursor={{ fill: "rgba(148,163,184,0.08)" }} />
        <Bar dataKey="count" name="Sismos" radius={[5, 5, 0, 0]} maxBarSize={48} isAnimationActive={false}>
          {data.map((d) => (
            <Cell key={d.range} fill={d.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

function HourlyBody({ quakes }: { quakes: Quake[] }) {
  const data = hourlyBuckets(quakes).map((b) => ({
    ...b,
    label: `${String(b.hour).padStart(2, "0")}h`,
  }));
  if (!data.some((d) => d.count > 0))
    return emptyHint("Sin datos para los filtros actuales");
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ top: 6, right: 6, left: -18, bottom: 0 }}>
        <CartesianGrid stroke={GRID} vertical={false} />
        <XAxis
          dataKey="label"
          tick={AXIS}
          tickLine={false}
          axisLine={false}
          interval={2}
        />
        <YAxis tick={AXIS} tickLine={false} axisLine={false} allowDecimals={false} />
        <Tooltip content={<Tip />} cursor={{ fill: "rgba(148,163,184,0.08)" }} />
        <Bar dataKey="count" name="Sismos" radius={[4, 4, 0, 0]} fill={COUNT_COLOR} maxBarSize={26} isAnimationActive={false} />
      </BarChart>
    </ResponsiveContainer>
  );
}

/* ------------------------------------------------------------------ */
/* Tarjetas exportadas                                                 */
/* ------------------------------------------------------------------ */

/** Actividad en el tiempo: frecuencia, intensidad y energía en pestañas. */
export function ActivityChartCard({ quakes }: { quakes: Quake[] }) {
  const daily = dailyBuckets(quakes);
  return (
    <TabbedChartCard
      title="Actividad en el tiempo"
      icon={<CalendarRange size={17} />}
      tabs={[
        {
          id: "freq",
          label: "Frecuencia",
          subtitle: "Número de sismos registrados por día",
          render: () => <FrequencyBody data={daily} />,
        },
        {
          id: "mag",
          label: "Magnitud",
          subtitle: "Magnitud promedio y máxima por día",
          render: () => <IntensityBody data={daily} />,
        },
        {
          id: "energy",
          label: "Energía",
          subtitle: "Energía acumulada liberada (Gutenberg-Richter)",
          render: () => <EnergyBody quakes={quakes} />,
        },
      ]}
    />
  );
}

/** Distribuciones: por magnitud, profundidad y hora del día en pestañas. */
export function DistributionChartCard({ quakes }: { quakes: Quake[] }) {
  return (
    <TabbedChartCard
      title="Distribuciones"
      icon={<BarChart3 size={17} />}
      tabs={[
        {
          id: "mag",
          label: "Magnitud",
          subtitle: "Cuántos sismos en cada rango (color = severidad)",
          render: () => <MagnitudeBody quakes={quakes} />,
        },
        {
          id: "depth",
          label: "Profundidad",
          subtitle: "Foco en km — más oscuro = más profundo",
          render: () => <DepthBody quakes={quakes} />,
        },
        {
          id: "hour",
          label: "Por hora",
          subtitle: "Distribución horaria (hora de Venezuela)",
          render: () => <HourlyBody quakes={quakes} />,
        },
      ]}
    />
  );
}

/** Zonas/localidades con más actividad sísmica. */
export function TopRegionsChart({ quakes }: { quakes: Quake[] }) {
  const data = topRegions(quakes, 8);
  return (
    <section className="glass fade-up p-4 sm:p-5">
      <header className="mb-4 flex items-center gap-2.5">
        <span className="text-accent-2">
          <MapPinned size={17} />
        </span>
        <div>
          <h3 className="text-sm font-semibold text-fg sm:text-base">
            Zonas más activas
          </h3>
          <p className="text-xs text-muted">
            Localidades con mayor número de sismos
          </p>
        </div>
      </header>
      {data.length === 0 ? (
        emptyHint("Sin datos para los filtros actuales")
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 0, right: 14, left: 4, bottom: 0 }}
          >
            <CartesianGrid stroke={GRID} horizontal={false} />
            <XAxis type="number" tick={AXIS} tickLine={false} axisLine={false} allowDecimals={false} />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ ...AXIS, fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              width={120}
            />
            <Tooltip content={<Tip />} cursor={{ fill: "rgba(148,163,184,0.08)" }} />
            <Bar dataKey="count" name="Sismos" radius={[0, 5, 5, 0]} fill={COUNT_COLOR} maxBarSize={20} isAnimationActive={false} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </section>
  );
}
