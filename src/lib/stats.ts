import type { Quake } from "./types";

export interface DailyBucket {
  date: string;
  label: string;
  count: number;
  avgMag: number | null;
  maxMag: number | null;
  /** Energía sísmica liberada ese día (joules). */
  energy: number;
}

export interface HourlyBucket {
  hour: number;
  count: number;
}

export interface MagBucket {
  range: string;
  count: number;
  color: string;
}

export interface NamedBucket {
  name: string;
  count: number;
}

export interface DepthBucket {
  range: string;
  count: number;
  color: string;
}

export interface Stats {
  total: number;
  avgMag: number | null;
  maxMag: number | null;
  minMag: number | null;
  /** Desviación estándar de la magnitud (variación de intensidad). */
  stdMag: number | null;
  /** Mediana de la magnitud. */
  medianMag: number | null;
  avgDepth: number | null;
  minDepth: number | null;
  maxDepth: number | null;
  perDay: number;
  daysTracked: number;
  last24h: number;
  /** Sismos en las 24h previas a las últimas 24h (para tendencia). */
  prev24h: number;
  /** Variación porcentual de actividad 24h vs 24h anteriores. */
  trend24h: number | null;
  felt: number;
  significant4: number;
  significant5: number;
  /** Energía sísmica total liberada (joules). */
  energyJoules: number;
  /** Magnitud equivalente de la energía total acumulada. */
  energyMagEq: number | null;
  /** Equivalente en toneladas de TNT. */
  tntTons: number;
  /** Profundidad: superficial (<70km) / intermedia (70–300) / profunda (>300). */
  shallow: number;
  intermediate: number;
  deep: number;
  peakHour: number | null;
  busiestDay: { label: string; count: number } | null;
  topRegion: string | null;
  strongest: Quake | null;
  latest: Quake | null;
  msSinceLatest: number | null;
}

const TZ = "America/Caracas";

const dayFmt = new Intl.DateTimeFormat("en-CA", {
  timeZone: TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});
const labelFmt = new Intl.DateTimeFormat("es-VE", {
  timeZone: TZ,
  day: "numeric",
  month: "short",
});
const hourFmt = new Intl.DateTimeFormat("en-US", {
  timeZone: TZ,
  hour: "numeric",
  hour12: false,
});

function mags(quakes: Quake[]): number[] {
  return quakes.map((q) => q.mag).filter((m): m is number => m != null);
}

function avg(nums: number[]): number | null {
  if (nums.length === 0) return null;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function median(nums: number[]): number | null {
  if (nums.length === 0) return null;
  const s = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

/** Energía sísmica en joules: log10(E) = 4.8 + 1.5·M (Gutenberg-Richter). */
export function quakeEnergy(mag: number | null): number {
  if (mag == null) return 0;
  return Math.pow(10, 4.8 + 1.5 * mag);
}

/** Extrae el nombre de la zona/localidad de la descripción del lugar. */
export function regionOf(place: string): string {
  let r = place;
  const m = r.match(/\sde\s(.+)$/i); // "28 km al noreste de San Felipe"
  if (m) r = m[1];
  r = r.replace(/,\s*venezuela\s*$/i, "").trim();
  return r || place;
}

export function computeStats(quakes: Quake[], now: number = Date.now()): Stats {
  const m = mags(quakes);
  const depths = quakes.map((q) => q.depth).filter((d) => Number.isFinite(d));
  const avgMag = avg(m);

  let stdMag: number | null = null;
  if (m.length > 1 && avgMag != null) {
    const variance = m.reduce((acc, x) => acc + (x - avgMag) ** 2, 0) / m.length;
    stdMag = Math.sqrt(variance);
  }

  const days = new Set(quakes.map((q) => dayFmt.format(q.time)));
  const last24h = quakes.filter((q) => now - q.time <= 86_400_000).length;
  const prev24h = quakes.filter(
    (q) => now - q.time > 86_400_000 && now - q.time <= 172_800_000
  ).length;
  const trend24h =
    prev24h > 0 ? ((last24h - prev24h) / prev24h) * 100 : null;

  const energyJoules = quakes.reduce((acc, q) => acc + quakeEnergy(q.mag), 0);
  const energyMagEq =
    energyJoules > 0 ? (Math.log10(energyJoules) - 4.8) / 1.5 : null;

  // Hora pico.
  const hourCounts = new Array(24).fill(0);
  for (const q of quakes) hourCounts[parseInt(hourFmt.format(q.time), 10) % 24]++;
  const peakHour =
    quakes.length > 0 ? hourCounts.indexOf(Math.max(...hourCounts)) : null;

  // Día más activo.
  const dayCounts = new Map<string, number>();
  for (const q of quakes) {
    const k = dayFmt.format(q.time);
    dayCounts.set(k, (dayCounts.get(k) ?? 0) + 1);
  }
  let busiestDay: { label: string; count: number } | null = null;
  for (const [key, count] of dayCounts) {
    if (!busiestDay || count > busiestDay.count) {
      busiestDay = { label: labelFmt.format(Date.parse(`${key}T12:00:00-04:00`)), count };
    }
  }

  // Zona más activa.
  const regionCounts = new Map<string, number>();
  for (const q of quakes) {
    const r = regionOf(q.place);
    regionCounts.set(r, (regionCounts.get(r) ?? 0) + 1);
  }
  let topRegion: string | null = null;
  let topRegionCount = 0;
  for (const [r, c] of regionCounts) {
    if (c > topRegionCount) {
      topRegionCount = c;
      topRegion = r;
    }
  }

  const strongest =
    quakes.filter((q) => q.mag != null).sort((a, b) => b.mag! - a.mag!)[0] ?? null;
  const latest = quakes.slice().sort((a, b) => b.time - a.time)[0] ?? null;

  return {
    total: quakes.length,
    avgMag,
    maxMag: m.length ? Math.max(...m) : null,
    minMag: m.length ? Math.min(...m) : null,
    stdMag,
    medianMag: median(m),
    avgDepth: avg(depths),
    minDepth: depths.length ? Math.min(...depths) : null,
    maxDepth: depths.length ? Math.max(...depths) : null,
    perDay: quakes.length / (days.size || 1),
    daysTracked: days.size,
    last24h,
    prev24h,
    trend24h,
    felt: quakes.filter((q) => (q.felt ?? 0) > 0).length,
    significant4: quakes.filter((q) => (q.mag ?? 0) >= 4).length,
    significant5: quakes.filter((q) => (q.mag ?? 0) >= 5).length,
    energyJoules,
    energyMagEq,
    tntTons: energyJoules / 4.184e9,
    shallow: quakes.filter((q) => q.depth < 70).length,
    intermediate: quakes.filter((q) => q.depth >= 70 && q.depth < 300).length,
    deep: quakes.filter((q) => q.depth >= 300).length,
    peakHour,
    busiestDay,
    topRegion,
    strongest,
    latest,
    msSinceLatest: latest ? now - latest.time : null,
  };
}

export function dailyBuckets(quakes: Quake[]): DailyBucket[] {
  const map = new Map<string, Quake[]>();
  for (const q of quakes) {
    const key = dayFmt.format(q.time);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(q);
  }

  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, group]) => {
      const m = mags(group);
      return {
        date,
        label: labelFmt.format(group[0].time),
        count: group.length,
        avgMag: avg(m),
        maxMag: m.length ? Math.max(...m) : null,
        energy: group.reduce((acc, q) => acc + quakeEnergy(q.mag), 0),
      };
    });
}

/** Energía acumulada día a día (para ver liberación de energía en el tiempo). */
export function cumulativeEnergy(
  quakes: Quake[]
): { label: string; cumulative: number }[] {
  const daily = dailyBuckets(quakes);
  let acc = 0;
  return daily.map((d) => {
    acc += d.energy;
    return { label: d.label, cumulative: acc };
  });
}

export function hourlyBuckets(quakes: Quake[]): HourlyBucket[] {
  const counts = new Array(24).fill(0);
  for (const q of quakes) counts[parseInt(hourFmt.format(q.time), 10) % 24]++;
  return counts.map((count, hour) => ({ hour, count }));
}

export function magBuckets(quakes: Quake[]): MagBucket[] {
  const ranges = [
    { range: "< 2", min: -Infinity, max: 2, color: "#22c55e" },
    { range: "2–3", min: 2, max: 3, color: "#84cc16" },
    { range: "3–4", min: 3, max: 4, color: "#eab308" },
    { range: "4–5", min: 4, max: 5, color: "#f97316" },
    { range: "5–6", min: 5, max: 6, color: "#ef4444" },
    { range: "6+", min: 6, max: Infinity, color: "#b91c1c" },
  ];
  return ranges.map((r) => ({
    range: r.range,
    color: r.color,
    count: quakes.filter((q) => q.mag != null && q.mag >= r.min && q.mag < r.max)
      .length,
  }));
}

/** Distribución por profundidad (clasificación sismológica). */
export function depthBuckets(quakes: Quake[]): DepthBucket[] {
  // Rampa secuencial de un solo matiz: más claro = superficial, más oscuro =
  // profundo. El color aquí es magnitud (profundidad), no identidad.
  const ranges = [
    { range: "0–10", min: 0, max: 10, color: "#e0f2fe" },
    { range: "10–30", min: 10, max: 30, color: "#7dd3fc" },
    { range: "30–70", min: 30, max: 70, color: "#38bdf8" },
    { range: "70–150", min: 70, max: 150, color: "#0ea5e9" },
    { range: "150–300", min: 150, max: 300, color: "#0284c7" },
    { range: "300+", min: 300, max: Infinity, color: "#0369a1" },
  ];
  return ranges.map((r) => ({
    range: r.range,
    color: r.color,
    count: quakes.filter((q) => q.depth >= r.min && q.depth < r.max).length,
  }));
}

/** Zonas/localidades con más actividad. */
export function topRegions(quakes: Quake[], limit = 8): NamedBucket[] {
  const counts = new Map<string, number>();
  for (const q of quakes) {
    const r = regionOf(q.place);
    counts.set(r, (counts.get(r) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}
