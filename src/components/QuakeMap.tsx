"use client";

import dynamic from "next/dynamic";
import { MapPin } from "lucide-react";
import { MAGNITUDE_SCALE } from "@/lib/constants";
import type { Quake } from "@/lib/types";

const MapView = dynamic(() => import("./MapView"), {
  ssr: false,
  loading: () => (
    <div className="grid h-full place-items-center text-sm text-muted">
      Cargando mapa…
    </div>
  ),
});

export function QuakeMap({
  quakes,
  allQuakes,
  highlightId,
  selectedId,
}: {
  quakes: Quake[];
  allQuakes: Quake[];
  highlightId: string | null;
  selectedId: string | null;
}) {
  return (
    <section className="glass fade-up overflow-hidden p-4 sm:p-5">
      <header className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <MapPin size={17} className="text-accent" />
          <div>
            <h3 className="text-sm font-semibold sm:text-base">
              Mapa sísmico
            </h3>
            <p className="text-xs text-muted">
              Tamaño y color según magnitud · puntos tenues: fuera del filtro
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          {MAGNITUDE_SCALE.filter((_, i) => i % 1 === 0).map((s) => (
            <span key={s.label} className="flex items-center gap-1 text-[11px] text-muted">
              <span
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{ background: s.color }}
              />
              {s.min}+
            </span>
          ))}
        </div>
      </header>
      <div className="h-[420px] w-full overflow-hidden rounded-xl border border-border sm:h-[520px]">
        <MapView
          quakes={quakes}
          allQuakes={allQuakes}
          highlightId={highlightId}
          selectedId={selectedId}
        />
      </div>
    </section>
  );
}
