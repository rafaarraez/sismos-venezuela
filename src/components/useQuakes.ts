"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Quake, QuakeApiResponse, QuakeSource } from "@/lib/types";

const POLL_MS = 60_000;

interface State {
  quakes: Quake[];
  sources: QuakeSource[];
  generated: number;
  loading: boolean;
  error: string | null;
}

export function useQuakes(initial: {
  quakes: Quake[];
  sources: QuakeSource[];
  generated: number;
}) {
  const [state, setState] = useState<State>({
    ...initial,
    loading: false,
    error: null,
  });
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const refresh = useCallback(async () => {
    setState((s) => ({ ...s, loading: true }));
    try {
      const res = await fetch("/api/sismos", { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: QuakeApiResponse = await res.json();
      setState({
        quakes: data.quakes,
        sources: data.sources,
        generated: data.generated,
        loading: false,
        error: null,
      });
    } catch (err) {
      setState((s) => ({
        ...s,
        loading: false,
        error: err instanceof Error ? err.message : "Error desconocido",
      }));
    }
  }, []);

  useEffect(() => {
    // Refresco inmediato al montar: los datos del render del servidor pueden
    // venir de caché (ISR) y estar desactualizados.
    refresh();
    timer.current = setInterval(refresh, POLL_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible") refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      if (timer.current) clearInterval(timer.current);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [refresh]);

  return { ...state, refresh };
}
