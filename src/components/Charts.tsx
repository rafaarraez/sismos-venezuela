"use client";

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
import {
  Activity,
  LineChart as LineIcon,
  BarChart3,
  Clock,
  Layers,
  MapPinned,
  Zap,
} from "lucide-react";
import { ChartShell, emptyHint } from "./ChartShell";
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

/** Frecuencia: cantidad de sismos por día. */
export function FrequencyChart({ quakes }: { quakes: Quake[] }) {
  const data = dailyBuckets(quakes);
  return (
    <ChartShell
      title="Frecuencia diaria"
      subtitle="Número de sismos registrados por día"
      icon={<BarChart3 size={17} />}
    >
      {data.length === 0 ? (
        emptyHint("Sin datos para los filtros actuales")
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={data} margin={{ top: 6, right: 6, left: -18, bottom: 0 }}>
            <CartesianGrid stroke={GRID} vertical={false} />
            <XAxis dataKey="label" tick={AXIS} tickLine={false} axisLine={false} />
            <YAxis tick={AXIS} tickLine={false} axisLine={false} allowDecimals={false} />
            <Tooltip content={<Tip />} cursor={{ fill: "rgba(148,163,184,0.08)" }} />
            <Bar dataKey="count" name="Sismos" radius={[5, 5, 0, 0]} fill="#38bdf8" maxBarSize={46} isAnimationActive={false} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </ChartShell>
  );
}

/** Evolución de intensidad: magnitud promedio y máxima a través del tiempo. */
export function IntensityEvolution({ quakes }: { quakes: Quake[] }) {
  const data: DailyBucket[] = dailyBuckets(quakes);
  return (
    <ChartShell
      title="Evolución de la intensidad"
      subtitle="Magnitud promedio y máxima por día"
      icon={<LineIcon size={17} />}
    >
      {data.length === 0 ? (
        emptyHint("Sin datos para los filtros actuales")
      ) : (
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
              stroke="#f59e0b"
              strokeWidth={2.5}
              dot={{ r: 2.5 }}
              connectNulls
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </ChartShell>
  );
}

/** Distribución por rango de magnitud (histograma). */
export function MagnitudeDistribution({ quakes }: { quakes: Quake[] }) {
  const data = magBuckets(quakes);
  const hasData = data.some((d) => d.count > 0);
  return (
    <ChartShell
      title="Distribución de magnitudes"
      subtitle="Cuántos sismos en cada rango"
      icon={<Activity size={17} />}
    >
      {!hasData ? (
        emptyHint("Sin datos para los filtros actuales")
      ) : (
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
      )}
    </ChartShell>
  );
}

/** Distribución por hora del día (0–23, hora de Venezuela). */
export function HourlyChart({ quakes }: { quakes: Quake[] }) {
  const data = hourlyBuckets(quakes).map((b) => ({
    ...b,
    label: `${String(b.hour).padStart(2, "0")}h`,
  }));
  const hasData = data.some((d) => d.count > 0);
  return (
    <ChartShell
      title="Actividad por hora"
      subtitle="Distribución horaria (hora de Venezuela)"
      icon={<Clock size={17} />}
    >
      {!hasData ? (
        emptyHint("Sin datos para los filtros actuales")
      ) : (
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
            <Bar dataKey="count" name="Sismos" radius={[4, 4, 0, 0]} fill="#a78bfa" maxBarSize={26} isAnimationActive={false} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </ChartShell>
  );
}

/** Energía sísmica acumulada liberada a través del tiempo. */
export function CumulativeEnergyChart({ quakes }: { quakes: Quake[] }) {
  const data = cumulativeEnergy(quakes);
  return (
    <ChartShell
      title="Energía sísmica acumulada"
      subtitle="Energía total liberada (Gutenberg-Richter)"
      icon={<Zap size={17} />}
    >
      {data.length === 0 ? (
        emptyHint("Sin datos para los filtros actuales")
      ) : (
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
      )}
    </ChartShell>
  );
}

/** Distribución por profundidad (clasificación sismológica). */
export function DepthDistribution({ quakes }: { quakes: Quake[] }) {
  const data = depthBuckets(quakes);
  const hasData = data.some((d) => d.count > 0);
  return (
    <ChartShell
      title="Distribución por profundidad"
      subtitle="Profundidad del foco en km (superficial → profundo)"
      icon={<Layers size={17} />}
    >
      {!hasData ? (
        emptyHint("Sin datos para los filtros actuales")
      ) : (
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
      )}
    </ChartShell>
  );
}

/** Zonas/localidades con más actividad sísmica. */
export function TopRegionsChart({ quakes }: { quakes: Quake[] }) {
  const data = topRegions(quakes, 8);
  return (
    <ChartShell
      title="Zonas más activas"
      subtitle="Localidades con mayor número de sismos"
      icon={<MapPinned size={17} />}
    >
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
            <Bar dataKey="count" name="Sismos" radius={[0, 5, 5, 0]} fill="#2dd4bf" maxBarSize={20} isAnimationActive={false} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </ChartShell>
  );
}
