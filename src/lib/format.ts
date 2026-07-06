const TZ = "America/Caracas";

// Formato 24h con hourCycle "h23" (00–23) explícito. Evita dos discrepancias
// de hidratación entre el ICU de Node y el del navegador:
//  - AM/PM: el espacio antes de "p. m." (U+202F vs espacio normal).
//  - Medianoche: "h24" muestra 24:40 y "h23" muestra 00:40 según el entorno.
// Además el formato 24h es el estándar para datos sísmicos.
const dateTimeFmt = new Intl.DateTimeFormat("es-VE", {
  timeZone: TZ,
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

const timeFmt = new Intl.DateTimeFormat("es-VE", {
  timeZone: TZ,
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

export function formatDateTime(ms: number): string {
  return dateTimeFmt.format(ms);
}

export function formatTime(ms: number): string {
  return timeFmt.format(ms);
}

/** Tiempo relativo en español a partir de una diferencia en ms. */
export function timeAgoFromDiff(diff: number): string {
  const min = Math.floor(diff / 60_000);
  if (min < 1) return "hace instantes";
  if (min < 60) return `hace ${min} min`;
  const hours = Math.floor(min / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.floor(hours / 24);
  return `hace ${days} d`;
}

/** Tiempo relativo en español ("hace 3 h", "hace 12 min"). */
export function timeAgo(ms: number, now: number = Date.now()): string {
  return timeAgoFromDiff(now - ms);
}

export function formatMag(mag: number | null): string {
  return mag == null ? "N/D" : mag.toFixed(1);
}

/** Energía sísmica en joules a unidad SI legible (J, kJ, … PJ). */
export function formatEnergy(j: number): string {
  if (j <= 0) return "0 J";
  const units: [string, number][] = [
    ["PJ", 1e15], ["TJ", 1e12], ["GJ", 1e9], ["MJ", 1e6], ["kJ", 1e3],
  ];
  for (const [u, v] of units) {
    if (j >= v) return `${(j / v).toFixed(2)} ${u}`;
  }
  return `${j.toFixed(0)} J`;
}
