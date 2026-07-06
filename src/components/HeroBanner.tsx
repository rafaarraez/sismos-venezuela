"use client";

import { ArrowDownToLine, MapPin, ShieldCheck } from "lucide-react";
import { MagBadge } from "./MagBadge";
import { magnitudeInfo } from "@/lib/constants";
import { formatDateTime, timeAgo } from "@/lib/format";
import type { Quake } from "@/lib/types";

const dayKeyFmt = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Caracas",
});

/**
 * Respuesta inmediata al "tembló, ¿qué fue?": el último sismo registrado en
 * grande, o un estado tranquilo si hoy no ha habido actividad. Trabaja sobre
 * el dataset completo, independiente de los filtros.
 */
export function HeroBanner({
  latest,
  now,
  onSelect,
}: {
  latest: Quake | null;
  now: number;
  onSelect: (id: string) => void;
}) {
  if (!latest) return null;

  const isToday = dayKeyFmt.format(latest.time) === dayKeyFmt.format(now);
  const info = magnitudeInfo(latest.mag);

  if (!isToday) {
    return (
      <section className="glass fade-up mb-4 flex flex-wrap items-center gap-3 border-l-4 p-4 sm:mb-6 sm:px-5 border-l-emerald-500/70">
        <ShieldCheck size={20} className="shrink-0 text-emerald-400" />
        <p className="text-sm">
          <span className="font-semibold">Sin sismos registrados hoy.</span>{" "}
          <span className="text-muted">
            Último evento: M {latest.mag != null ? latest.mag.toFixed(1) : "N/D"}{" "}
            en {latest.place}, {timeAgo(latest.time, now)}.
          </span>
        </p>
      </section>
    );
  }

  return (
    <section
      className="glass fade-up mb-4 border-l-4 p-4 sm:mb-6 sm:p-5"
      style={{ borderLeftColor: info.color }}
    >
      <div className="flex flex-wrap items-center gap-4">
        <MagBadge mag={latest.mag} size="lg" />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">
            Último sismo · {timeAgo(latest.time, now)}
          </p>
          <h2 className="mt-0.5 truncate text-lg font-bold sm:text-xl">
            {latest.place}
          </h2>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted">
            <span style={{ color: info.color }}>
              {info.label} — {info.desc}
            </span>
            <span className="flex items-center gap-1">
              <ArrowDownToLine size={11} /> {latest.depth.toFixed(0)} km de
              profundidad
            </span>
            <span>{formatDateTime(latest.time)}</span>
            <span className="rounded bg-white/5 px-1.5 py-0.5 text-[10px]">
              {latest.source}
            </span>
          </div>
        </div>
        <button
          onClick={() => onSelect(latest.id)}
          className="flex shrink-0 items-center gap-1.5 rounded-xl border border-border bg-bg-soft/70 px-3 py-2 text-xs font-medium transition hover:border-border-strong"
        >
          <MapPin size={13} className="text-accent-2" /> Ver en el mapa
        </button>
      </div>
    </section>
  );
}
