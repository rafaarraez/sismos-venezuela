"use client";

import { useState } from "react";
import { ArrowDownToLine, ExternalLink, MapPin, Waves } from "lucide-react";
import { MagBadge } from "./MagBadge";
import { formatDateTime, timeAgo } from "@/lib/format";
import { magnitudeInfo } from "@/lib/constants";
import type { Quake } from "@/lib/types";

type SortKey = "time" | "mag" | "depth";

export function QuakeList({
  quakes,
  now,
  selectedId,
  onHover,
  onSelect,
}: {
  quakes: Quake[];
  now: number;
  selectedId: string | null;
  onHover: (id: string | null) => void;
  onSelect: (id: string) => void;
}) {
  const [sort, setSort] = useState<SortKey>("time");
  const [limit, setLimit] = useState(40);

  const sorted = [...quakes].sort((a, b) => {
    if (sort === "mag") return (b.mag ?? -1) - (a.mag ?? -1);
    if (sort === "depth") return b.depth - a.depth;
    return b.time - a.time;
  });
  const shown = sorted.slice(0, limit);

  const sortBtn = (key: SortKey, label: string) => (
    <button
      onClick={() => setSort(key)}
      className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${
        sort === key
          ? "bg-accent/20 text-accent"
          : "text-muted hover:bg-white/5 hover:text-fg"
      }`}
    >
      {label}
    </button>
  );

  return (
    <section className="glass flex flex-col p-4 sm:p-5">
      <header className="mb-3 flex items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold sm:text-base">Lista de sismos</h3>
          <p className="text-xs text-muted">
            {quakes.length.toLocaleString("es-VE")} eventos · ordenar por
          </p>
        </div>
        <div className="flex gap-1">
          {sortBtn("time", "Fecha")}
          {sortBtn("mag", "Magnitud")}
          {sortBtn("depth", "Profundidad")}
        </div>
      </header>

      <div
        className="thin-scroll max-h-[560px] space-y-2 overflow-y-auto pr-1"
        onMouseLeave={() => onHover(null)}
      >
        {shown.length === 0 && (
          <div className="grid h-40 place-items-center text-sm text-muted">
            No hay sismos que coincidan con los filtros.
          </div>
        )}
        {shown.map((q) => {
          const info = magnitudeInfo(q.mag);
          const selected = q.id === selectedId;
          return (
            <article
              key={q.id}
              onMouseEnter={() => onHover(q.id)}
              onClick={() => onSelect(q.id)}
              title={selected ? "Quitar del mapa" : "Ver en el mapa"}
              className={`glass-hover flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition ${
                selected
                  ? "border-accent/60 bg-accent/10 ring-1 ring-accent/40"
                  : "border-border bg-bg-soft/40"
              }`}
            >
              <MagBadge mag={q.mag} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-medium text-fg">
                    {q.place}
                  </p>
                </div>
                <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted">
                  <span style={{ color: info.color }}>
                    {info.label}
                    {q.magType ? ` · ${q.magType}` : ""}
                  </span>
                  <span className="flex items-center gap-1">
                    <ArrowDownToLine size={11} /> {q.depth.toFixed(0)} km
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin size={11} /> {q.lat.toFixed(2)}, {q.lon.toFixed(2)}
                  </span>
                  {q.felt != null && q.felt > 0 && (
                    <span className="flex items-center gap-1 text-accent-2">
                      <Waves size={11} /> {q.felt} reportes
                    </span>
                  )}
                </div>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-xs font-medium text-fg">{timeAgo(q.time, now)}</p>
                <p className="mt-0.5 text-[11px] text-muted">
                  {formatDateTime(q.time)}
                </p>
                <div className="mt-1 flex items-center justify-end gap-1.5">
                  <span className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] text-muted">
                    {q.source}
                  </span>
                  {q.url && (
                    <a
                      href={q.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-muted transition hover:text-accent-2"
                      title="Ver detalle en la fuente"
                    >
                      <ExternalLink size={13} />
                    </a>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {limit < sorted.length && (
        <button
          onClick={() => setLimit((l) => l + 40)}
          className="mt-3 w-full rounded-lg border border-border bg-bg-soft/50 py-2 text-sm text-muted transition hover:border-border-strong hover:text-fg"
        >
          Mostrar más ({sorted.length - limit} restantes)
        </button>
      )}
    </section>
  );
}
