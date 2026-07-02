import { regionOf, quakeEnergy } from "./stats";
import type { Quake } from "./types";

const TZ = "America/Caracas";
const veFmt = new Intl.DateTimeFormat("es-VE", {
  timeZone: TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
});

function depthClass(d: number): string {
  if (d < 70) return "Superficial";
  if (d < 300) return "Intermedia";
  return "Profunda";
}

/** Convierte un sismo en una fila plana para exportar. */
function toRow(q: Quake) {
  return {
    "Fecha y hora (Venezuela)": veFmt.format(q.time).replace(",", ""),
    "Fecha y hora (UTC)": new Date(q.time).toISOString(),
    Magnitud: q.mag ?? "",
    "Tipo magnitud": q.magType ?? "",
    "Profundidad (km)": q.depth,
    "Clasif. profundidad": depthClass(q.depth),
    Latitud: q.lat,
    Longitud: q.lon,
    Ubicación: q.place,
    Zona: regionOf(q.place),
    "Energía (J)": Math.round(quakeEnergy(q.mag)),
    "Reportes 'lo sentí'": q.felt ?? "",
    Fuente: q.source,
  };
}

function timestamp(): string {
  return new Date().toISOString().slice(0, 16).replace(/[:T]/g, "-");
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function exportCSV(quakes: Quake[]) {
  const rows = quakes.map(toRow);
  if (rows.length === 0) return;
  const headers = Object.keys(rows[0]);
  const escape = (v: unknown) => {
    const s = String(v ?? "");
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [
    headers.join(","),
    ...rows.map((r) => headers.map((h) => escape((r as Record<string, unknown>)[h])).join(",")),
  ].join("\n");
  // BOM para que Excel respete los acentos.
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  triggerDownload(blob, `sismos-venezuela-${timestamp()}.csv`);
}

export async function exportXLSX(quakes: Quake[]) {
  const rows = quakes.map(toRow);
  if (rows.length === 0) return;
  const XLSX = await import("xlsx");
  const ws = XLSX.utils.json_to_sheet(rows);
  // Ancho de columnas aproximado.
  ws["!cols"] = [
    { wch: 22 }, { wch: 22 }, { wch: 9 }, { wch: 12 }, { wch: 15 },
    { wch: 18 }, { wch: 11 }, { wch: 11 }, { wch: 38 }, { wch: 22 },
    { wch: 16 }, { wch: 16 }, { wch: 10 },
  ];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Sismos");
  XLSX.writeFile(wb, `sismos-venezuela-${timestamp()}.xlsx`);
}
