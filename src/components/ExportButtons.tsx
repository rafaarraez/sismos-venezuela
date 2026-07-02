"use client";

import { useState } from "react";
import { Download, FileSpreadsheet, FileText } from "lucide-react";
import { exportCSV, exportXLSX } from "@/lib/export";
import type { Quake } from "@/lib/types";

export function ExportButtons({ quakes }: { quakes: Quake[] }) {
  const [busy, setBusy] = useState(false);
  const disabled = quakes.length === 0 || busy;

  const handleXLSX = async () => {
    setBusy(true);
    try {
      await exportXLSX(quakes);
    } finally {
      setBusy(false);
    }
  };

  const base =
    "flex items-center gap-1.5 rounded-lg border border-border bg-bg-soft/70 px-2.5 py-1.5 text-xs font-medium transition hover:border-border-strong disabled:opacity-50 disabled:cursor-not-allowed";

  return (
    <div className="flex items-center gap-2">
      <span className="hidden items-center gap-1 text-xs text-muted sm:flex">
        <Download size={13} /> Exportar {quakes.length}:
      </span>
      <button onClick={() => exportCSV(quakes)} disabled={disabled} className={base}>
        <FileText size={14} className="text-emerald-400" />
        CSV
      </button>
      <button onClick={handleXLSX} disabled={disabled} className={base}>
        <FileSpreadsheet size={14} className="text-green-500" />
        Excel
      </button>
    </div>
  );
}
