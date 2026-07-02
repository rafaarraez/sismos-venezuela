import { START_DATE, VENEZUELA_BBOX } from "./constants";
import type { Quake, QuakeSource } from "./types";

const { minLat, maxLat, minLon, maxLon } = VENEZUELA_BBOX;

const DIRECTIONS: Record<string, string> = {
  N: "N", S: "S", E: "E", W: "O",
  NE: "NE", NW: "NO", SE: "SE", SW: "SO",
  NNE: "NNE", ENE: "ENE", ESE: "ESE", SSE: "SSE",
  SSW: "SSO", WSW: "OSO", WNW: "ONO", NNW: "NNO",
};

/** Convierte ubicaciones en inglés de USGS a un español legible. */
function localizePlaceUSGS(place: string): string {
  // "27 km N of Caraballeda, Venezuela" -> "27 km al N de Caraballeda, Venezuela"
  return place.replace(
    /^(\d+)\s*km\s+([NSEW]{1,3})\s+of\s+/i,
    (_m, dist: string, dir: string) =>
      `${dist} km al ${DIRECTIONS[dir.toUpperCase()] ?? dir} de `
  );
}

/** EMSC entrega regiones en mayúsculas (ej. "OFFSHORE VARGAS, VENEZUELA"). */
function titleCase(s: string): string {
  return s
    .toLowerCase()
    .replace(/\boffshore\b/g, "costa afuera de")
    .replace(/\bregion\b/g, "región")
    .replace(/(^|\s|,)([a-záéíóúñ])/g, (_m, p, c) => p + c.toUpperCase());
}

const NAMED_ENTITIES: Record<string, string> = {
  aacute: "á", eacute: "é", iacute: "í", oacute: "ó", uacute: "ú",
  Aacute: "Á", Eacute: "É", Iacute: "Í", Oacute: "Ó", Uacute: "Ú",
  ntilde: "ñ", Ntilde: "Ñ", uuml: "ü", Uuml: "Ü",
  amp: "&", quot: '"', nbsp: " ", ordm: "º",
};

/** Decodifica entidades HTML (nombradas y numéricas). */
function decodeEntities(s: string): string {
  return s
    .replace(/&#x([0-9a-f]+);/gi, (_m, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_m, d) => String.fromCodePoint(parseInt(d, 10)))
    .replace(/&([a-z]+);/gi, (m, name) => NAMED_ENTITIES[name] ?? m);
}

function stripTags(s: string): string {
  return decodeEntities(s.replace(/<[^>]+>/g, "")).replace(/\s+/g, " ").trim();
}

function toNumber(s: string): number {
  return parseFloat(s.replace(",", "."));
}

/** Inicio del tracking en epoch ms (00:00 hora de Venezuela, UTC−4). */
const START_MS = Date.parse(`${START_DATE}T00:00:00-04:00`);

/**
 * Fuente 3: FUNVISIS — red sismológica oficial de Venezuela.
 * No expone API: se parsea la tabla "sismos del mes" (sis_mes.php).
 * Detecta muchos más microsismos locales y reporta magnitud Mw.
 */
/**
 * Descarga vía el módulo http de Node con `insecureHTTPParser: true`. El
 * servidor de FUNVISIS emite un chunked HTTP/1.1 ligeramente malformado
 * ("Invalid character in chunk size") que el fetch de Node (undici) rechaza;
 * el parser permisivo lo tolera, igual que curl.
 */
async function httpGetLenient(url: string): Promise<string> {
  const http = await import("node:http");
  return new Promise((resolve, reject) => {
    const req = http.get(
      url,
      {
        insecureHTTPParser: true,
        timeout: 18_000,
        headers: { "User-Agent": "Mozilla/5.0 (compatible; SismosVE/1.0)" },
      },
      (res) => {
        if (res.statusCode !== 200) {
          res.resume();
          reject(new Error(`FUNVISIS respondió ${res.statusCode}`));
          return;
        }
        res.setEncoding("utf8");
        let data = "";
        res.on("data", (c) => (data += c));
        res.on("end", () => resolve(data));
      }
    );
    req.on("timeout", () => req.destroy(new Error("FUNVISIS: timeout")));
    req.on("error", reject);
  });
}

async function fetchFUNVISISHtml(): Promise<string> {
  // El servidor de FUNVISIS es inestable: reintentar un par de veces.
  let lastErr: unknown;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await httpGetLenient("http://www.funvisis.gob.ve/old/sis_mes.php");
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr ?? new Error("FUNVISIS no respondió");
}

async function fetchFUNVISIS(): Promise<Quake[]> {
  const html = await fetchFUNVISISHtml();

  const rows = html.match(/<tr[^>]*>[\s\S]*?<\/tr>/gi) ?? [];
  const quakes: Quake[] = [];

  for (const row of rows) {
    const cells = (row.match(/<t[dh][^>]*>[\s\S]*?<\/t[dh]>/gi) ?? []).map(
      stripTags
    );
    if (cells.length !== 7) continue;

    const [fecha, hora, latStr, lonStr, depthStr, magStr, place] = cells;
    // Validar formato fecha DD/MM/YYYY y hora HH:MM.
    const fm = fecha.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    const hm = hora.match(/^(\d{1,2}):(\d{2})$/);
    if (!fm || !hm) continue;

    const lat = toNumber(latStr);
    const lon = toNumber(lonStr);
    const depth = toNumber(depthStr);
    const mag = toNumber(magStr);
    if ([lat, lon, depth, mag].some((n) => !Number.isFinite(n))) continue;

    const [, dd, mm, yyyy] = fm;
    const [, hh, min] = hm;
    // Hora Legal de Venezuela = UTC−4.
    const time = Date.parse(
      `${yyyy}-${mm}-${dd}T${hh.padStart(2, "0")}:${min}:00-04:00`
    );
    if (!Number.isFinite(time) || time < START_MS) continue;

    // Mantener solo eventos dentro de la caja de Venezuela.
    if (lat < minLat || lat > maxLat || lon < minLon || lon > maxLon) continue;

    quakes.push({
      id: `funvisis:${time}:${lat.toFixed(2)}:${lon.toFixed(2)}`,
      time,
      mag,
      magType: "Mw",
      // Limpia "30. km" -> "30 km" (sin afectar "8.9 km").
      place: place.replace(/(\d)\.(\s+km)/gi, "$1$2") || "Ubicación desconocida",
      lat,
      lon,
      depth,
      source: "FUNVISIS",
      url: "http://www.funvisis.gob.ve/monitor.html",
      felt: null,
      tsunami: false,
    });
  }

  return quakes;
}

/**
 * "La Guaira ( Venezuela) a 74 km" -> "A 74 km de La Guaira, Venezuela".
 * Si la población más cercana está en Colombia, el paréntesis trae el
 * departamento: "Agustín Codazzi (Cesar) a 46 km".
 */
function placeFromCloserTowns(towns: string): string | null {
  const m = towns.match(/^([^(]+?)\s*\(\s*([^)]+?)\s*\)\s*a\s*(\d+)\s*km/);
  if (!m) return null;
  const [, town, region, km] = m;
  const suffix = region === "Venezuela" ? "Venezuela" : `${region}, Colombia`;
  return `A ${km} km de ${town.trim().replace(/\s+/g, " ")}, ${suffix}`;
}

/**
 * Fuente 4: SGC (Servicio Geológico Colombiano) — red oficial de Colombia.
 * Feed GeoJSON rodante de 5 días (el mismo que consume sgc.gov.co/sismos);
 * los eventos viejos persisten gracias al almacén de disco, igual que con
 * FUNVISIS. Su red cubre muy bien la zona fronteriza (Zulia, Táchira), pero
 * el grueso del feed son microsismos de Colombia (nido de Bucaramanga), así
 * que solo se conservan los eventos que el SGC ubica en Venezuela.
 */
async function fetchSGC(): Promise<Quake[]> {
  const res = await fetch(
    "https://archive.sgc.gov.co/feed/v1.0.1/summary/five_days_all.json",
    { next: { revalidate: 60 } }
  );
  if (!res.ok) throw new Error(`SGC respondió ${res.status}`);
  const data = await res.json();

  const quakes: Quake[] = [];
  for (const f of data.features ?? []) {
    const p = f.properties ?? {};
    if (!/venezuela/i.test(p.place ?? "")) continue;

    // Ojo: el feed del SGC usa [lat, lon, depth], NO el orden GeoJSON estándar.
    const [lat, lon, depth] = f.geometry?.coordinates ?? [];
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;
    if (lat < minLat || lat > maxLat || lon < minLon || lon > maxLon) continue;

    // utcTime viene con precisión de minuto: "2026-07-01 23:44".
    const utc: string = p.utcTime ?? "";
    const time = Date.parse(
      `${utc.replace(" ", "T")}${utc.length === 16 ? ":00" : ""}Z`
    );
    if (!Number.isFinite(time) || time < START_MS) continue;

    const mag = typeof p.mag === "number" ? p.mag : null;

    quakes.push({
      id: `sgc:${f.id}`,
      time,
      mag,
      // "MLr_4" y similares son variantes internas por grupo de estaciones.
      magType: p.magType ? String(p.magType).replace(/_.*$/, "") : null,
      place:
        placeFromCloserTowns(p.closerTowns ?? "") ??
        (p.place ?? "Venezuela").replace(
          /near coast of venezuela/i,
          "Cerca de la costa de Venezuela"
        ),
      lat,
      lon,
      depth: Number.isFinite(depth) ? depth : 0,
      source: "SGC",
      url: f.id ? `https://www.sgc.gov.co/detallesismo/${f.id}/` : null,
      felt: p.felt > 0 ? p.felt : null,
      tsunami: false,
    });
  }

  return quakes;
}

/** Fuente 1: USGS (United States Geological Survey) — global, gratuito. */
async function fetchUSGS(): Promise<Quake[]> {
  const url =
    "https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson" +
    `&starttime=${START_DATE}` +
    `&minlatitude=${minLat}&maxlatitude=${maxLat}` +
    `&minlongitude=${minLon}&maxlongitude=${maxLon}` +
    "&orderby=time";

  const res = await fetch(url, { next: { revalidate: 60 } });
  if (!res.ok) throw new Error(`USGS respondió ${res.status}`);
  const data = await res.json();

  return (data.features ?? []).map((f: any): Quake => {
    const [lon, lat, depth] = f.geometry?.coordinates ?? [0, 0, 0];
    return {
      id: `usgs:${f.id}`,
      time: f.properties.time,
      mag: f.properties.mag ?? null,
      magType: f.properties.magType ?? null,
      place: localizePlaceUSGS(f.properties.place ?? "Ubicación desconocida"),
      lat,
      lon,
      depth: depth ?? 0,
      source: "USGS",
      url: f.properties.url ?? null,
      felt: f.properties.felt ?? null,
      tsunami: Boolean(f.properties.tsunami),
    };
  });
}

/** Fuente 2: EMSC (European-Mediterranean Seismological Centre) — gratuito. */
async function fetchEMSC(): Promise<Quake[]> {
  const url =
    "https://www.seismicportal.eu/fdsnws/event/1/query?format=json" +
    `&starttime=${START_DATE}` +
    `&minlat=${minLat}&maxlat=${maxLat}` +
    `&minlon=${minLon}&maxlon=${maxLon}` +
    "&limit=1000";

  const res = await fetch(url, { next: { revalidate: 60 } });
  if (!res.ok) throw new Error(`EMSC respondió ${res.status}`);
  const data = await res.json();

  return (data.features ?? []).map((f: any): Quake => {
    const p = f.properties;
    return {
      id: `emsc:${f.id}`,
      time: new Date(p.time).getTime(),
      mag: p.mag ?? null,
      magType: p.magtype ?? null,
      place: p.flynn_region ? titleCase(p.flynn_region) : "Ubicación desconocida",
      lat: p.lat,
      lon: p.lon,
      depth: p.depth ?? 0,
      source: "EMSC",
      url: p.unid
        ? `https://www.seismicportal.eu/eventdetails.html?unid=${p.unid}`
        : null,
      felt: null,
      tsunami: false,
    };
  });
}

/**
 * ¿Son el mismo sismo?
 * - Misma fuente: solo si casi coinciden (revisión del mismo evento). Umbral
 *   estricto para NO fusionar sismos distintos cercanos en el tiempo, como el
 *   doblete del 24/06 (M7.2 a las 18:04 y M7.5 a las 18:05).
 * - Fuentes distintas: ventana amplia, porque FUNVISIS solo da precisión de
 *   minuto y los tiempos de origen entre redes difieren algunos segundos.
 */
function isDuplicate(a: Quake, b: Quake): boolean {
  const dt = Math.abs(a.time - b.time);
  const dLat = Math.abs(a.lat - b.lat);
  const dLon = Math.abs(a.lon - b.lon);
  if (a.source === b.source) {
    return dt <= 30_000 && dLat < 0.15 && dLon < 0.15;
  }
  return dt < 90_000 && dLat < 0.5 && dLon < 0.5;
}

/**
 * Prioridad ante duplicados: FUNVISIS (red oficial de Venezuela, mayor
 * precisión local y magnitud Mw) > USGS (revisado) > SGC (red oficial de
 * Colombia, buena cobertura fronteriza) > EMSC.
 */
const SOURCE_PRIORITY: Record<QuakeSource, number> = {
  FUNVISIS: 0,
  USGS: 1,
  SGC: 2,
  EMSC: 3,
};

export function dedupe(quakes: Quake[]): Quake[] {
  const ordered = [...quakes].sort(
    (a, b) => SOURCE_PRIORITY[a.source] - SOURCE_PRIORITY[b.source]
  );
  const kept: Quake[] = [];
  for (const q of ordered) {
    // Entre los candidatos duplicados, escoger el más cercano en el tiempo.
    let best: Quake | null = null;
    let bestDt = Infinity;
    for (const k of kept) {
      if (isDuplicate(k, q)) {
        const dt = Math.abs(k.time - q.time);
        if (dt < bestDt) {
          bestDt = dt;
          best = k;
        }
      }
    }
    if (!best) {
      kept.push(q);
    } else {
      // Conservar el evento de mayor prioridad pero enriquecer datos útiles
      // que solo trae otra fuente (ej. reportes "lo sentí" de USGS).
      if (best.felt == null && q.felt != null) best.felt = q.felt;
      if (!best.tsunami && q.tsunami) best.tsunami = true;
    }
  }
  return kept;
}

export interface FetchResult {
  quakes: Quake[];
  sources: QuakeSource[];
}

/** Obtiene y fusiona los sismos de todas las fuentes gratuitas disponibles. */
export async function fetchAllQuakes(): Promise<FetchResult> {
  const labels: QuakeSource[] = ["FUNVISIS", "USGS", "EMSC", "SGC"];
  const results = await Promise.allSettled([
    fetchFUNVISIS(),
    fetchUSGS(),
    fetchEMSC(),
    fetchSGC(),
  ]);
  const all: Quake[] = [];
  const sources: QuakeSource[] = [];

  results.forEach((r, i) => {
    if (r.status === "fulfilled") {
      all.push(...r.value);
      sources.push(labels[i]);
    } else {
      console.error(`Fuente ${labels[i]} falló:`, r.reason);
    }
  });

  const quakes = dedupe(all).sort((a, b) => b.time - a.time);
  return { quakes, sources };
}
