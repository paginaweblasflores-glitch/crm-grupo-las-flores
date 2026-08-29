"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

// Modal genérico y liviano — overlay + tarjeta centrada, sin dependencias.
// Cierra con click en el fondo, la X, o Escape.
export function Modal({
  titulo, subtitulo, onCerrar, children,
}: {
  titulo: string;
  subtitulo?: string;
  onCerrar: () => void;
  children: React.ReactNode;
}) {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCerrar();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onCerrar]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onCerrar}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-[var(--color-gris-claro)]/40 flex items-start justify-between gap-3 shrink-0">
          <div>
            <h3 className="font-bold text-sm text-[var(--color-gris)]">{titulo}</h3>
            {subtitulo && <p className="text-xs text-[var(--color-gris-medio)] mt-0.5">{subtitulo}</p>}
          </div>
          <button
            onClick={onCerrar}
            className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-[var(--color-gris-medio)] hover:bg-[var(--color-crema)] transition-colors"
            aria-label="Cerrar"
          >
            <X size={16} />
          </button>
        </div>
        <div className="overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
