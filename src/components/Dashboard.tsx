"use client";

import { useMemo, useState } from "react";
import { Activity, RefreshCw, RadioTower } from "lucide-react";
import { useQuakes } from "./useQuakes";
import { StatsGrid } from "./StatsGrid";
import { AdvancedStats } from "./AdvancedStats";
import { FilterBar } from "./FilterBar";
import { ExportButtons } from "./ExportButtons";
import {
  FrequencyChart,
  IntensityEvolution,
  MagnitudeDistribution,
  HourlyChart,
  CumulativeEnergyChart,
  DepthDistribution,
  TopRegionsChart,
} from "./Charts";
import { QuakeList } from "./QuakeList";
import { QuakeMap } from "./QuakeMap";
import { applyFilters, DEFAULT_FILTERS, type Filters } from "@/lib/filters";
import { computeStats } from "@/lib/stats";
import { formatTime } from "@/lib/format";
import { START_DATE } from "@/lib/constants";
import type { Quake, QuakeSource } from "@/lib/types";

const startLabel = new Intl.DateTimeFormat("es-VE", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "America/Caracas",
}).format(new Date(`${START_DATE}T12:00:00Z`));

export function Dashboard({
  initialQuakes,
  initialSources,
  initialGenerated,
}: {
  initialQuakes: Quake[];
  initialSources: QuakeSource[];
  initialGenerated: number;
}) {
  const { quakes, sources, generated, loading, error, refresh } = useQuakes({
    quakes: initialQuakes,
    sources: initialSources,
    generated: initialGenerated,
  });

  const [filters, setFilters] = useState<Filters>({ ...DEFAULT_FILTERS });

  // `generated` actúa como reloj: avanza con cada actualización de datos, de
  // modo que los presets relativos ("últimas 24 h") siguen vivos.
  const now = generated || Date.now();
  const filtered = useMemo(
    () => applyFilters(quakes, filters, now),
    [quakes, filters, now]
  );
  const stats = useMemo(() => computeStats(filtered, now), [filtered, now]);

  const todayLocal = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Caracas",
  }).format(now);

  return (
    <div className="mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-6 sm:py-8">
      {/* Encabezado */}
      <header className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-accent/15">
              <Activity size={19} className="text-accent" />
              <span className="absolute inset-0 rounded-xl ring-1 ring-accent/40" />
            </div>
            <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-400 ring-1 ring-emerald-500/30">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping-slow rounded-full bg-emerald-400" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
              </span>
              EN VIVO
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Monitor Sísmico de Venezuela
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-muted">
            Seguimiento en tiempo real de la actividad sísmica desde el{" "}
            <span className="text-fg">{startLabel}</span>. Datos combinados de{" "}
            <span className="text-fg">{sources.join(" + ") || "—"}</span>.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right text-xs text-muted">
            <p className="flex items-center justify-end gap-1.5">
              <RadioTower size={13} className="text-accent-2" />
              Actualizado {generated ? formatTime(generated) : "—"}
            </p>
            <p>Se actualiza solo cada 60 s</p>
          </div>
          <button
            onClick={refresh}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl border border-border bg-bg-soft/70 px-3 py-2 text-sm font-medium transition hover:border-border-strong disabled:opacity-60"
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
            Actualizar
          </button>
        </div>
      </header>

      {error && (
        <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          No se pudo actualizar: {error}. Mostrando los últimos datos disponibles.
        </div>
      )}

      {/* KPIs principales */}
      <StatsGrid stats={stats} />

      {/* Filtros */}
      <div className="mt-4 sm:mt-6">
        <FilterBar
          filters={filters}
          onChange={setFilters}
          sources={sources}
          maxDate={todayLocal}
          actions={<ExportButtons quakes={filtered} />}
        />
      </div>

      {/* Panel de análisis avanzado */}
      <div className="mt-4 sm:mt-6">
        <div className="mb-3 flex items-center gap-2">
          <h2 className="text-sm font-semibold text-fg">Análisis para prevención</h2>
          <span className="h-px flex-1 bg-border" />
        </div>
        <AdvancedStats stats={stats} />
      </div>

      {/* Gráficos */}
      <div className="mt-4 grid grid-cols-1 gap-3 sm:mt-6 sm:gap-4 lg:grid-cols-2">
        <FrequencyChart quakes={filtered} />
        <IntensityEvolution quakes={filtered} />
        <CumulativeEnergyChart quakes={filtered} />
        <MagnitudeDistribution quakes={filtered} />
        <DepthDistribution quakes={filtered} />
        <HourlyChart quakes={filtered} />
        <div className="lg:col-span-2">
          <TopRegionsChart quakes={filtered} />
        </div>
      </div>

      {/* Mapa + Lista */}
      <div className="mt-4 grid grid-cols-1 gap-3 sm:gap-4 lg:mt-6 lg:grid-cols-2">
        <QuakeMap quakes={filtered} />
        <QuakeList quakes={filtered} now={now} />
      </div>

      <footer className="mt-8 border-t border-border pt-4 text-center text-xs text-muted">
        Fuentes gratuitas: USGS (earthquake.usgs.gov), EMSC (seismicportal.eu)
        y SGC (sgc.gov.co).
        Horas en zona horaria de Venezuela (UTC−4). Este panel es informativo y
        no sustituye los avisos oficiales de FUNVISIS.
      </footer>
    </div>
  );
}
