"use client";

import { FileDown } from "lucide-react";

// Genera un PDF real con el diálogo de impresión del navegador — el CSS de
// impresión (globals.css) oculta el sidebar y los controles, y deja solo el
// reporte. No hace falta ninguna librería ni backend para esto.
export function ExportarPDFBoton({ etiqueta = "Exportar reporte (PDF)" }: { etiqueta?: string }) {
  return (
    <button
      onClick={() => window.print()}
      className="no-imprimir flex items-center gap-1.5 bg-white border border-[var(--color-gris-claro)]/50 text-[var(--color-gris)] text-xs font-semibold rounded-lg px-3.5 py-2 hover:border-[var(--color-terracota)]/40 transition-colors"
    >
      <FileDown size={14} /> {etiqueta}
    </button>
  );
}
