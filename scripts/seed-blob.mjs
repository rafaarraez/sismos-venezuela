/**
 * Sube el histórico local (data/sismos-store.json) al store de Vercel Blob,
 * fusionando por id con lo que ya exista allá (no pisa eventos nuevos).
 *
 * Uso (store nuevo, auth OIDC):
 *   vercel env pull .env.seed --environment=production
 *   node --env-file=.env.seed scripts/seed-blob.mjs
 * Uso (store clásico con token):
 *   BLOB_READ_WRITE_TOKEN=vercel_blob_rw_... node scripts/seed-blob.mjs
 */
import { get, put } from "@vercel/blob";
import { readFile } from "node:fs/promises";

const BLOB_KEY = "sismos-store.json";
// Con BLOB_STORE_ID + VERCEL_OIDC_TOKEN en el entorno, el SDK se autentica
// solo; el token explícito es el mecanismo clásico.
const token = process.env.BLOB_READ_WRITE_TOKEN || undefined;
if (!token && !(process.env.BLOB_STORE_ID && process.env.VERCEL_OIDC_TOKEN)) {
  console.error(
    "Faltan credenciales: BLOB_READ_WRITE_TOKEN, o BLOB_STORE_ID + " +
      "VERCEL_OIDC_TOKEN (bájalas con `vercel env pull .env.seed " +
      "--environment=production`)."
  );
  process.exit(1);
}

const local = JSON.parse(
  await readFile(new URL("../data/sismos-store.json", import.meta.url), "utf-8")
);

let remote = { quakes: [] };
try {
  const result = await get(BLOB_KEY, { access: "private", token });
  if (result?.stream) {
    remote = JSON.parse(await new Response(result.stream).text());
    console.log(`Blob existente: ${remote.quakes.length} sismos.`);
  } else {
    console.log("El Blob no existe todavía; se crea desde cero.");
  }
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
    access: "private",
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
