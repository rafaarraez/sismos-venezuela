/** Fecha de inicio del tracking: 24 de junio de 2026. */
export const START_DATE = "2026-06-24";

/** Caja geográfica que cubre Venezuela (incluye zonas costa afuera). */
export const VENEZUELA_BBOX = {
  minLat: 0.5,
  maxLat: 13,
  minLon: -74,
  maxLon: -59,
};

export interface MagStep {
  min: number;
  label: string;
  color: string;
  desc: string;
}

/** Escala de magnitud Richter con color, etiqueta y descripción. */
export const MAGNITUDE_SCALE: MagStep[] = [
  { min: 0, label: "Micro", color: "#22c55e", desc: "Generalmente no se siente" },
  { min: 3, label: "Menor", color: "#84cc16", desc: "Se siente levemente" },
  { min: 4, label: "Ligero", color: "#eab308", desc: "Perceptible, daños mínimos" },
  { min: 5, label: "Moderado", color: "#f97316", desc: "Daños a edificaciones débiles" },
  { min: 6, label: "Fuerte", color: "#ef4444", desc: "Daños en zonas pobladas" },
  { min: 7, label: "Mayor", color: "#b91c1c", desc: "Daños graves y extensos" },
  { min: 8, label: "Grande", color: "#7f1d1d", desc: "Destrucción severa" },
];

export function magnitudeInfo(mag: number | null) {
  if (mag == null) return { label: "N/D", color: "#64748b", desc: "Sin magnitud reportada" };
  let info = MAGNITUDE_SCALE[0];
  for (const step of MAGNITUDE_SCALE) {
    if (mag >= step.min) info = step;
  }
  return info;
}

export function magnitudeColor(mag: number | null) {
  return magnitudeInfo(mag).color;
}
