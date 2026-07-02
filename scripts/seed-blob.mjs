/**
 * Sube el histórico local (data/sismos-store.json) al store de Vercel Blob,
 * fusionando por id con lo que ya exista allá (no pisa eventos nuevos).
 *
 * Uso:  BLOB_READ_WRITE_TOKEN=vercel_blob_rw_... node scripts/seed-blob.mjs
 */
import { head, put } from "@vercel/blob";
import { readFile } from "node:fs/promises";

const BLOB_KEY = "sismos-store.json";
const token = process.env.BLOB_READ_WRITE_TOKEN;
if (!token) {
  console.error(
    "Falta BLOB_READ_WRITE_TOKEN (cópialo de Vercel → Storage → Blob → Settings)."
  );
  process.exit(1);
}

const local = JSON.parse(
  await readFile(new URL("../data/sismos-store.json", import.meta.url), "utf-8")
);

let remote = { quakes: [] };
try {
  const { url } = await head(BLOB_KEY, { token });
  const res = await fetch(`${url}?ts=${Date.now()}`, { cache: "no-store" });
  if (res.ok) remote = await res.json();
  console.log(`Blob existente: ${remote.quakes.length} sismos.`);
} catch {
  console.log("El Blob no existe todavía; se crea desde cero.");
}

// Los remotos ganan: pueden traer revisiones más recientes de las fuentes.
const byId = new Map();
for (const q of local.quakes ?? []) byId.set(q.id, q);
for (const q of remote.quakes ?? []) byId.set(q.id, q);
const quakes = [...byId.values()].sort((a, b) => b.time - a.time);

const { url } = await put(
  BLOB_KEY,
  JSON.stringify({ updated: Date.now(), quakes }),
  {
    access: "public",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json",
    token,
  }
);

console.log(
  `Listo: ${quakes.length} sismos (${local.quakes.length} locales + ${remote.quakes.length} remotos, fusionados por id).`
);
console.log(`URL: ${url}`);
