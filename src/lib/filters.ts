import { START_DATE } from "./constants";
import type { Quake } from "./types";

export type DatePreset =
  | "all"
  | "today"
  | "yesterday"
  | "last24h"
  | "last3d"
  | "last7d"
  | "day"
  | "custom";

export interface Filters {
  preset: DatePreset;
  /** Para preset "day": fecha YYYY-MM-DD. */
  dayValue: string;
  /** Para preset "custom": rango de fechas YYYY-MM-DD. */
  customFrom: string;
  customTo: string;
  /** Magnitud mínima (0 = todas). */
  minMag: number;
  /** Hora del día 0–23 (hora de Venezuela). */
  hourFrom: number;
  hourTo: number;
  /** Fuentes activas. */
  sources: Record<string, boolean>;
  /** Texto libre para buscar en la ubicación. */
  search: string;
}

export const DEFAULT_FILTERS: Filters = {
  preset: "today",
  dayValue: "",
  customFrom: "",
  customTo: "",
  minMag: 0,
  hourFrom: 0,
  hourTo: 23,
  sources: { FUNVISIS: true, USGS: true, EMSC: true, SGC: true },
  search: "",
};

export const START_MS = Date.parse(`${START_DATE}T00:00:00-04:00`);
const DAY_MS = 86_400_000;
const TZ = "America/Caracas";

const dayKeyFmt = new Intl.DateTimeFormat("en-CA", {
  timeZone: TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});
const hourFmt = new Intl.DateTimeFormat("en-US", {
  timeZone: TZ,
  hour: "numeric",
  hour12: false,
});

/** Inicio (00:00 VE) del día calendario de Venezuela que contiene `ms`. */
function startOfVEDay(ms: number): number {
  const key = dayKeyFmt.format(ms); // YYYY-MM-DD en VE
  return Date.parse(`${key}T00:00:00-04:00`);
}

function startOfDateStr(d: string): number {
  return Date.parse(`${d}T00:00:00-04:00`);
}
function endOfDateStr(d: string): number {
  return Date.parse(`${d}T23:59:59.999-04:00`);
}

/**
 * Convierte el filtro de fecha en una ventana absoluta [fromMs, toMs].
 * `now` permite que los presets relativos ("últimas 24h", "hoy") se mantengan
 * vivos a medida que entran datos nuevos.
 */
export function resolveWindow(
  f: Filters,
  now: number
): { fromMs: number; toMs: number } {
  switch (f.preset) {
    case "today":
      return { fromMs: startOfVEDay(now), toMs: now };
    case "yesterday": {
      const todayStart = startOfVEDay(now);
      return { fromMs: todayStart - DAY_MS, toMs: todayStart - 1 };
    }
    case "last24h":
      return { fromMs: now - DAY_MS, toMs: now };
    case "last3d":
      return { fromMs: now - 3 * DAY_MS, toMs: now };
    case "last7d":
      return { fromMs: now - 7 * DAY_MS, toMs: now };
    case "day":
      return f.dayValue
        ? { fromMs: startOfDateStr(f.dayValue), toMs: endOfDateStr(f.dayValue) }
        : { fromMs: START_MS, toMs: now };
    case "custom":
      return {
        fromMs: f.customFrom ? startOfDateStr(f.customFrom) : START_MS,
        toMs: f.customTo ? endOfDateStr(f.customTo) : now,
      };
    case "all":
    default:
      return { fromMs: START_MS, toMs: now };
  }
}

export function applyFilters(quakes: Quake[], f: Filters, now: number): Quake[] {
  const { fromMs, toMs } = resolveWindow(f, now);
  const search = f.search.trim().toLowerCase();
  const checkHour = f.hourFrom !== 0 || f.hourTo !== 23;

  return quakes.filter((q) => {
    if (q.time < fromMs || q.time > toMs) return false;

    if (checkHour) {
      const hour = parseInt(hourFmt.format(q.time), 10) % 24;
      if (hour < f.hourFrom || hour > f.hourTo) return false;
    }

    if ((q.mag ?? 0) < f.minMag) return false;
    if (f.sources[q.source] === false) return false;
    if (search && !q.place.toLowerCase().includes(search)) return false;

    return true;
  });
}

const PRESET_IDS: DatePreset[] = [
  "all", "today", "yesterday", "last24h", "last3d", "last7d", "day", "custom",
];

/** Serializa a query string solo lo que difiere del default (compartible). */
export function filtersToQuery(f: Filters): string {
  const p = new URLSearchParams();
  if (f.preset !== DEFAULT_FILTERS.preset) p.set("rango", f.preset);
  if (f.preset === "day" && f.dayValue) p.set("dia", f.dayValue);
  if (f.preset === "custom") {
    if (f.customFrom) p.set("desde", f.customFrom);
    if (f.customTo) p.set("hasta", f.customTo);
  }
  if (f.minMag > 0) p.set("mag", String(f.minMag));
  if (f.hourFrom !== 0) p.set("h1", String(f.hourFrom));
  if (f.hourTo !== 23) p.set("h2", String(f.hourTo));
  const off = Object.entries(f.sources)
    .filter(([, v]) => v === false)
    .map(([k]) => k);
  if (off.length) p.set("sin", off.join(","));
  if (f.search.trim()) p.set("q", f.search.trim());
  return p.toString();
}

/** Reconstruye filtros desde una query string; null si no trae ninguna. */
export function filtersFromQuery(qs: string): Filters | null {
  const p = new URLSearchParams(qs);
  if ([...p.keys()].length === 0) return null;
  const f: Filters = {
    ...DEFAULT_FILTERS,
    sources: { ...DEFAULT_FILTERS.sources },
  };
  const preset = p.get("rango");
  if (preset && PRESET_IDS.includes(preset as DatePreset)) {
    f.preset = preset as DatePreset;
  }
  f.dayValue = p.get("dia") ?? "";
  f.customFrom = p.get("desde") ?? "";
  f.customTo = p.get("hasta") ?? "";
  const mag = parseFloat(p.get("mag") ?? "");
  if (Number.isFinite(mag) && mag > 0) f.minMag = mag;
  const h1 = parseInt(p.get("h1") ?? "", 10);
  const h2 = parseInt(p.get("h2") ?? "", 10);
  if (h1 >= 0 && h1 <= 23) f.hourFrom = h1;
  if (h2 >= 0 && h2 <= 23) f.hourTo = h2;
  for (const s of (p.get("sin") ?? "").split(",")) {
    if (s in f.sources) f.sources[s] = false;
  }
  f.search = p.get("q") ?? "";
  return f;
}

export function isDefault(f: Filters): boolean {
  return (
    f.preset === "today" &&
    f.minMag === 0 &&
    f.hourFrom === 0 &&
    f.hourTo === 23 &&
    f.sources.FUNVISIS &&
    f.sources.USGS &&
    f.sources.EMSC &&
    f.sources.SGC &&
    !f.search
  );
}
