export type QuakeSource = "FUNVISIS" | "USGS" | "EMSC" | "SGC";

/** Sismo normalizado, común a todas las fuentes. */
export interface Quake {
  id: string;
  /** Tiempo del evento en milisegundos epoch (UTC). */
  time: number;
  /** Magnitud. Puede ser null si la fuente no la reporta aún. */
  mag: number | null;
  /** Tipo de magnitud reportada (mb, ml, mw, etc.). */
  magType: string | null;
  /** Descripción del lugar. */
  place: string;
  lat: number;
  lon: number;
  /** Profundidad en kilómetros. */
  depth: number;
  source: QuakeSource;
  url: string | null;
  /** Número de reportes "lo sentí" (USGS y SGC). */
  felt: number | null;
  tsunami: boolean;
}

export interface QuakeApiResponse {
  generated: number;
  count: number;
  sources: QuakeSource[];
  quakes: Quake[];
}
