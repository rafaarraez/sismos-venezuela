import { Dashboard } from "@/components/Dashboard";
import { getQuakes } from "@/lib/store";
import type { Quake, QuakeSource } from "@/lib/types";

export const dynamic = "force-dynamic";
// FUNVISIS reintenta hasta 3 veces con timeout de 18 s: dar margen en Vercel.
export const maxDuration = 60;

export default async function Home() {
  let quakes: Quake[] = [];
  let sources: QuakeSource[] = [];
  try {
    const result = await getQuakes();
    quakes = result.quakes;
    sources = result.sources;
  } catch {
    // El cliente reintentará vía /api/sismos.
  }

  return (
    <main className="flex-1">
      <Dashboard
        initialQuakes={quakes}
        initialSources={sources}
        initialGenerated={Date.now()}
      />
    </main>
  );
}
