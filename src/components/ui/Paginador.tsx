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

// Mismo set de opciones en toda la app (Clientes, Próximos cumpleaños, y lo
// que se agregue después) — igual que el "Filas por página" de Google
// Analytics/Search Console. 500 como tope: de ahí para arriba ya está
// "Exportar a Excel" para ver todo de una.
export const OPCIONES_POR_PAGINA = [5, 10, 25, 50, 100, 250, 500];

export function Paginador({
  pagina, totalPaginas, onCambiar,
  total, porPagina, onCambiarPorPagina, opciones = OPCIONES_POR_PAGINA,
}: {
  pagina: number;
  totalPaginas: number;
  onCambiar: (pagina: number) => void;
  // Total de filas y tamaño de página — quien llama sigue haciendo el
  // slice() de su propia lista con `porPagina` (acá no se conoce la lista,
  // solo los números), pero el texto "Mostrando X–Y de Z" y el selector de
  // tamaño viven acá, en un solo lugar, para no repetirlos en cada página.
  total: number;
  porPagina: number;
  onCambiarPorPagina: (porPagina: number) => void;
  opciones?: number[];
}) {
  if (total === 0) return null;

  const inicio = (pagina - 1) * porPagina + 1;
  const fin = Math.min(pagina * porPagina, total);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 pt-3 pb-1 px-1">
      <label className="flex items-center gap-2 text-xs text-[var(--color-gris-medio)]">
        Filas por página
        <select
          value={porPagina}
          onChange={(e) => onCambiarPorPagina(Number(e.target.value))}
          className="border border-[var(--color-gris-claro)]/60 rounded-lg pl-2 pr-1 py-1 text-xs font-semibold text-[var(--color-gris)] bg-white focus:outline-none focus:ring-1 focus:ring-[var(--color-terracota)]"
        >
          {opciones.map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
      </label>

      <div className="flex items-center gap-4">
        <span className="text-xs text-[var(--color-gris-medio)] whitespace-nowrap">
          {inicio}–{fin} de {total}
        </span>

        {totalPaginas > 1 && (
          <nav className="flex items-center gap-1" aria-label="Paginación">
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
        )}
      </div>
    </div>
  );
}
