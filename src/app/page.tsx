import { Dashboard } from "@/components/Dashboard";
import { getQuakes } from "@/lib/store";
import type { Quake, QuakeSource } from "@/lib/types";

export const dynamic = "force-dynamic";
// FUNVISIS reintenta hasta 3 veces con timeout de 18 s: dar margen en Vercel.
export const maxDuration = 60;

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  let quakes: Quake[] = [];
  let sources: QuakeSource[] = [];
  try {
    const result = await getQuakes();
    quakes = result.quakes;
    sources = result.sources;
  } catch {
    // El cliente reintentará vía /api/sismos.
  }

  // Query string de la URL: permite compartir enlaces con filtros aplicados.
  const sp = await searchParams;
  const initialQuery = new URLSearchParams(
    Object.entries(sp).flatMap(([k, v]) =>
      v == null ? [] : Array.isArray(v) ? v.map((x) => [k, x]) : [[k, v]]
    ) as [string, string][]
  ).toString();

  return (
    <main className="flex-1">
      <Dashboard
        initialQuakes={quakes}
        initialSources={sources}
        initialGenerated={Date.now()}
        initialQuery={initialQuery}
      />
    </main>
  );
}
