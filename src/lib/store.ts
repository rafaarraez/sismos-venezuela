import { promises as fs } from "fs";
import path from "path";
import { get, put } from "@vercel/blob";
import { dedupe, fetchAllQuakes, type FetchResult } from "./sources";
import { START_DATE } from "./constants";
import type { Quake, QuakeSource } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const STORE_FILE = path.join(DATA_DIR, "sismos-store.json");
const BLOB_KEY = "sismos-store.json";
const START_MS = Date.parse(`${START_DATE}T00:00:00-04:00`);

interface StoreFile {
  updated: number;
  quakes: Quake[];
}

/**
 * En Vercel el filesystem es efímero y de solo lectura: si hay un store de
 * Blob conectado, el histórico vive ahí. Los stores nuevos exponen
 * BLOB_STORE_ID (autenticación vía OIDC automática de Vercel); los clásicos,
 * BLOB_READ_WRITE_TOKEN. En desarrollo local se usa el archivo en data/.
 */
function useBlob(): boolean {
  return Boolean(
    process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID
  );
}

/**
 * Serializa los read-modify-write para evitar pisar el archivo. En Vercel el
 * lock solo cubre cada instancia; una carrera entre instancias es inocua
 * porque el merge solo agrega eventos y lo que pierda una escritura lo
 * repone la siguiente consulta a las fuentes.
 */
let queue: Promise<unknown> = Promise.resolve();
function withLock<T>(fn: () => Promise<T>): Promise<T> {
  const run = queue.then(fn, fn);
  queue = run.catch(() => {});
  return run;
}

async function readDisk(): Promise<string | null> {
  try {
    return await fs.readFile(STORE_FILE, "utf-8");
  } catch {
    return null; // No existe todavía.
  }
}

async function readBlob(): Promise<string | null> {
  try {
    const result = await get(BLOB_KEY, { access: "private" });
    if (!result?.stream) return null; // No existe todavía.
    return await new Response(result.stream).text();
  } catch {
    return null;
  }
}

async function loadStore(): Promise<Quake[]> {
  try {
    // Si el Blob está vacío y el snapshot de data/ viajó con el deploy, se
    // usa como semilla. Ojo: data/ está en .gitignore, así que normalmente
    // la semilla se sube una vez con `npm run seed-blob`.
    const raw = useBlob()
      ? (await readBlob()) ?? (await readDisk())
      : await readDisk();
    if (!raw) return [];
    const data: StoreFile = JSON.parse(raw);
    return (data.quakes ?? []).filter((q) => q.time >= START_MS);
  } catch {
    return [];
  }
}

async function saveStore(quakes: Quake[]): Promise<void> {
  const body: StoreFile = { updated: Date.now(), quakes };
  const json = JSON.stringify(body);

  if (useBlob()) {
    await put(BLOB_KEY, json, {
      access: "private",
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: "application/json",
    });
    return;
  }

  await fs.mkdir(DATA_DIR, { recursive: true });
  const tmp = `${STORE_FILE}.${process.pid}.tmp`;
  await fs.writeFile(tmp, json, "utf-8");
  await fs.rename(tmp, STORE_FILE); // Escritura atómica.
}

/**
 * Fusiona los eventos recién obtenidos con los ya guardados:
 * 1. Por id exacto, la versión fresca reemplaza a la almacenada (magnitudes
 *    revisadas, etc.).
 * 2. Se vuelve a deduplicar la unión entre fuentes.
 * Los eventos viejos de FUNVISIS persisten aunque ya no estén en su tabla.
 */
function mergeStored(stored: Quake[], fresh: Quake[]): Quake[] {
  const byId = new Map<string, Quake>();
  for (const q of stored) byId.set(q.id, q);
  for (const q of fresh) byId.set(q.id, q); // fresh gana
  return dedupe([...byId.values()]).sort((a, b) => b.time - a.time);
}

/**
 * Punto de entrada que usan la página y la API: obtiene en vivo, acumula en
 * disco y devuelve el histórico completo combinado.
 */
export async function getQuakes(): Promise<FetchResult> {
  let live: FetchResult;
  try {
    live = await fetchAllQuakes();
  } catch {
    live = { quakes: [], sources: [] };
  }

  return withLock(async () => {
    const stored = await loadStore();
    const merged = mergeStored(stored, live.quakes);
    // Solo persistir si conseguimos algo en vivo (evita borrar el histórico
    // si todas las fuentes fallan en un momento dado). Si la escritura falla
    // (p. ej. Blob sin configurar en Vercel), igual respondemos con los datos.
    if (live.quakes.length > 0) {
      try {
        await saveStore(merged);
      } catch (err) {
        console.error("No se pudo persistir el histórico:", err);
      }
    }

    // Las fuentes "activas" reflejan conectividad en vivo; si una falla pero
    // ya tenemos su histórico, igual seguimos mostrando esos eventos.
    const storedSources = merged.map((q) => q.source);
    const sources = [
      ...new Set<QuakeSource>([...live.sources, ...storedSources]),
    ];

    return { quakes: merged, sources };
  });
}
