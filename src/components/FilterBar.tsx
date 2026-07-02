"use client";

import { Search, SlidersHorizontal, X, CalendarRange } from "lucide-react";
import {
  DEFAULT_FILTERS,
  isDefault,
  type DatePreset,
  type Filters,
} from "@/lib/filters";
import type { QuakeSource } from "@/lib/types";
import { START_DATE } from "@/lib/constants";

const inputCls =
  "rounded-lg border border-border bg-bg-soft/70 px-3 py-2 text-sm text-fg outline-none transition focus:border-accent-2/60";
const labelCls = "mb-2 block text-xs font-medium uppercase tracking-wide text-muted";

const DATE_PRESETS: { id: DatePreset; label: string }[] = [
  { id: "all", label: "Todo" },
  { id: "today", label: "Hoy" },
  { id: "yesterday", label: "Ayer" },
  { id: "last24h", label: "Últimas 24 h" },
  { id: "last3d", label: "Últimos 3 días" },
  { id: "last7d", label: "Últimos 7 días" },
  { id: "day", label: "Día específico" },
  { id: "custom", label: "Rango…" },
];

const MAG_PRESETS = [
  { v: 0, label: "Todas" },
  { v: 2, label: "≥ 2" },
  { v: 3, label: "≥ 3" },
  { v: 4, label: "≥ 4" },
  { v: 5, label: "≥ 5" },
];

function Chip({
  active,
  onClick,
  children,
  disabled,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
        active
          ? "bg-accent/20 text-accent ring-1 ring-accent/50"
          : "bg-bg-soft/70 text-muted ring-1 ring-border hover:text-fg"
      } ${disabled ? "cursor-not-allowed opacity-40" : ""}`}
    >
      {children}
    </button>
  );
}

export function FilterBar({
  filters,
  onChange,
  sources,
  maxDate,
  actions,
}: {
  filters: Filters;
  onChange: (f: Filters) => void;
  sources: QuakeSource[];
  maxDate: string;
  actions?: React.ReactNode;
}) {
  const set = (patch: Partial<Filters>) => onChange({ ...filters, ...patch });
  const dirty = !isDefault(filters);

  return (
    <section className="glass p-4 sm:p-5">
      <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <SlidersHorizontal size={16} className="text-accent" />
          Filtros
        </div>
        <div className="flex items-center gap-2">
          {actions}
          {dirty && (
            <button
              onClick={() => onChange({ ...DEFAULT_FILTERS })}
              className="flex items-center gap-1 rounded-md px-2 py-1.5 text-xs text-muted transition hover:bg-white/5 hover:text-fg"
            >
              <X size={13} /> Limpiar
            </button>
          )}
        </div>
      </header>

      {/* Rango de fecha por presets */}
      <div className="mb-4">
        <label className={labelCls}>Rango de fecha</label>
        <div className="flex flex-wrap gap-1.5">
          {DATE_PRESETS.map((p) => (
            <Chip
              key={p.id}
              active={filters.preset === p.id}
              onClick={() => set({ preset: p.id })}
            >
              {p.label}
            </Chip>
          ))}
        </div>

        {filters.preset === "day" && (
          <div className="mt-3 flex items-center gap-2">
            <CalendarRange size={15} className="text-muted" />
            <input
              type="date"
              className={inputCls}
              min={START_DATE}
              max={maxDate}
              value={filters.dayValue}
              onChange={(e) => set({ dayValue: e.target.value })}
            />
          </div>
        )}

        {filters.preset === "custom" && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted">Desde</span>
            <input
              type="date"
              className={inputCls}
              min={START_DATE}
              max={maxDate}
              value={filters.customFrom}
              onChange={(e) => set({ customFrom: e.target.value })}
            />
            <span className="text-xs text-muted">hasta</span>
            <input
              type="date"
              className={inputCls}
              min={START_DATE}
              max={maxDate}
              value={filters.customTo}
              onChange={(e) => set({ customTo: e.target.value })}
            />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Magnitud mínima */}
        <div>
          <label className={labelCls}>Magnitud mínima</label>
          <div className="flex flex-wrap gap-1.5">
            {MAG_PRESETS.map((mp) => (
              <Chip
                key={mp.v}
                active={filters.minMag === mp.v}
                onClick={() => set({ minMag: mp.v })}
              >
                {mp.label}
              </Chip>
            ))}
          </div>
        </div>

        {/* Hora del día */}
        <div>
          <label className={labelCls}>Hora del día (Venezuela)</label>
          <div className="flex items-center gap-2 text-sm">
            <select
              className={inputCls}
              value={filters.hourFrom}
              onChange={(e) =>
                set({
                  hourFrom: Math.min(parseInt(e.target.value), filters.hourTo),
                })
              }
            >
              {Array.from({ length: 24 }, (_, h) => (
                <option key={h} value={h}>
                  {String(h).padStart(2, "0")}:00
                </option>
              ))}
            </select>
            <span className="text-muted">a</span>
            <select
              className={inputCls}
              value={filters.hourTo}
              onChange={(e) =>
                set({
                  hourTo: Math.max(parseInt(e.target.value), filters.hourFrom),
                })
              }
            >
              {Array.from({ length: 24 }, (_, h) => (
                <option key={h} value={h}>
                  {String(h).padStart(2, "0")}:59
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Fuentes */}
        <div>
          <label className={labelCls}>Fuentes</label>
          <div className="flex flex-wrap gap-1.5">
            {(["FUNVISIS", "USGS", "EMSC", "SGC"] as QuakeSource[]).map((s) => {
              const active = filters.sources[s] !== false;
              const available = sources.includes(s);
              return (
                <Chip
                  key={s}
                  active={active}
                  disabled={!available}
                  onClick={() =>
                    set({ sources: { ...filters.sources, [s]: !active } })
                  }
                >
                  {s}
                </Chip>
              );
            })}
          </div>
        </div>
      </div>

      {/* Búsqueda */}
      <div className="mt-4">
        <label className={labelCls}>Buscar ubicación</label>
        <div className="relative max-w-md">
          <Search
            size={15}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
          />
          <input
            className={`${inputCls} w-full pl-9`}
            placeholder="Ej. Caracas, San Felipe, Sucre…"
            value={filters.search}
            onChange={(e) => set({ search: e.target.value })}
          />
        </div>
      </div>
    </section>
  );
}
