"use client";

import { useState } from "react";
import { FileDown, Loader2 } from "lucide-react";
import { exportarDashboardPDF } from "@/lib/exportar-pdf";
import { NegocioId } from "@/lib/types";

// Genera un PDF real (encabezado con logo/marca, cuerpo del panel, pie con
// numeración) — ver exportar-pdf.ts. objetivoId es el id del contenedor que
// se captura como cuerpo del reporte.
export function ExportarPDFBoton({
  etiqueta = "Exportar PDF",
  objetivoId,
  negocioId,
  titulo,
  subtitulo,
  generadoPor,
}: {
  etiqueta?: string;
  objetivoId: string;
  negocioId: NegocioId;
  titulo: string;
  subtitulo?: string;
  generadoPor: string;
}) {
  const [generando, setGenerando] = useState(false);

  async function onClick() {
    if (generando) return;
    setGenerando(true);
    try {
      await exportarDashboardPDF({ elementoId: objetivoId, negocioId, titulo, subtitulo, generadoPor });
    } catch (e) {
      console.error("Error al exportar PDF:", e);
    } finally {
      setGenerando(false);
    }
  }

  return (
    <button
      onClick={onClick}
      disabled={generando}
      className="no-imprimir flex items-center gap-1.5 bg-white border border-[var(--color-gris-claro)]/50 text-[var(--color-gris)] text-xs font-semibold rounded-lg px-3.5 py-2 hover:border-[var(--color-terracota)]/40 transition-colors disabled:opacity-60 disabled:cursor-wait"
    >
      {generando ? <Loader2 size={14} className="animate-spin" /> : <FileDown size={14} />}
      {generando ? "Generando…" : etiqueta}
    </button>
  );
}
