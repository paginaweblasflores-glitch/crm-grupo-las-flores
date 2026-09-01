"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

// Números de página a mostrar: siempre primera, última, la actual y una a
// cada lado — el resto se resume con "…". Con 84 páginas (8000+ clientes a
// 100 por página) esto evita tener que renderizar/mirar 84 botones seguidos.
function numerosAMostrar(pagina: number, total: number): (number | "...")[] {
  const paginas = new Set<number>([1, total, pagina, pagina - 1, pagina + 1]);
  const ordenadas = [...paginas].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const resultado: (number | "...")[] = [];
  ordenadas.forEach((p, i) => {
    if (i > 0 && p - ordenadas[i - 1] > 1) resultado.push("...");
    resultado.push(p);
  });
  return resultado;
}

export function Paginador({
  pagina, totalPaginas, onCambiar,
}: {
  pagina: number;
  totalPaginas: number;
  onCambiar: (pagina: number) => void;
}) {
  if (totalPaginas <= 1) return null;

  return (
    <nav className="flex items-center justify-center gap-1 py-4" aria-label="Paginación">
      <button
        onClick={() => onCambiar(pagina - 1)}
        disabled={pagina === 1}
        className="w-8 h-8 flex items-center justify-center rounded-lg text-[var(--color-gris-medio)] hover:bg-[var(--color-crema)] disabled:opacity-30 disabled:hover:bg-transparent"
        title="Página anterior"
      >
        <ChevronLeft size={16} />
      </button>

      {numerosAMostrar(pagina, totalPaginas).map((p, i) =>
        p === "..." ? (
          <span key={`puntos-${i}`} className="w-8 h-8 flex items-center justify-center text-xs text-[var(--color-gris-medio)]">
            …
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onCambiar(p)}
            className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-semibold transition-colors ${
              p === pagina
                ? "bg-[var(--color-terracota)] text-white"
                : "text-[var(--color-gris-medio)] hover:bg-[var(--color-crema)]"
            }`}
          >
            {p}
          </button>
        )
      )}

      <button
        onClick={() => onCambiar(pagina + 1)}
        disabled={pagina === totalPaginas}
        className="w-8 h-8 flex items-center justify-center rounded-lg text-[var(--color-gris-medio)] hover:bg-[var(--color-crema)] disabled:opacity-30 disabled:hover:bg-transparent"
        title="Página siguiente"
      >
        <ChevronRight size={16} />
      </button>
    </nav>
  );
}
