import { NextResponse } from "next/server";
import { getQuakes } from "@/lib/store";
import type { QuakeApiResponse } from "@/lib/types";

// Datos en vivo: render dinámico (las fuentes se consultan en cada petición y
// el resultado se acumula en el almacén de disco).
export const dynamic = "force-dynamic";
// FUNVISIS reintenta hasta 3 veces con timeout de 18 s: dar margen en Vercel.
export const maxDuration = 60;

export async function GET() {
  try {
    const { quakes, sources } = await getQuakes();
    const body: QuakeApiResponse = {
      generated: Date.now(),
      count: quakes.length,
      sources,
      quakes,
    };
    return NextResponse.json(body, {
      headers: {
        "Cache-Control": "s-maxage=60, stale-while-revalidate=120",
      },
    });
  } catch (err) {
    console.error("Error al obtener sismos:", err);
    return NextResponse.json(
      { error: "No se pudieron obtener los sismos" },
      { status: 502 }
    );
  }
}
