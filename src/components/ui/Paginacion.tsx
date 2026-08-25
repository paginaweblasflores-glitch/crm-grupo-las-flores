"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

// Paginación simple para tablas largas — evita pintar cientos de filas de una
// sola vez. Sin base de datos real todavía es solo una mejora de render, pero
// queda lista para paginar de verdad (con `limit`/`offset`) cuando se conecte
// Supabase.
export function Paginacion({
  pagina, totalPaginas, onCambiar, totalItems, porPagina,
}: {
  pagina: number; totalPaginas: number; onCambiar: (p: number) => void;
  totalItems: number; porPagina: number;
}) {
  if (totalPaginas <= 1) return null;

  const inicio = (pagina - 1) * porPagina + 1;
  const fin = Math.min(pagina * porPagina, totalItems);

  return (
    <div className="flex items-center justify-between px-5 py-3 border-t border-[var(--color-gris-claro)]/30 no-imprimir">
      <p className="text-xs text-[var(--color-gris-medio)]">
        {inicio}–{fin} de {totalItems}
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onCambiar(Math.max(1, pagina - 1))}
          disabled={pagina === 1}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--color-gris-medio)] hover:bg-[var(--color-crema)] disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
        >
          <ChevronLeft size={15} />
        </button>
        <span className="text-xs font-medium text-[var(--color-gris)] px-2">
          {pagina} / {totalPaginas}
        </span>
        <button
          onClick={() => onCambiar(Math.min(totalPaginas, pagina + 1))}
          disabled={pagina === totalPaginas}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--color-gris-medio)] hover:bg-[var(--color-crema)] disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
        >
          <ChevronRight size={15} />
        </button>
      </div>
    </div>
  );
}

// Corta un array a la página actual. `dependencias` extra (busqueda, tab...)
// deberían resetear la página a 1 en el componente que la usa.
export function paginar<T>(items: T[], pagina: number, porPagina: number): T[] {
  const inicio = (pagina - 1) * porPagina;
  return items.slice(inicio, inicio + porPagina);
}
