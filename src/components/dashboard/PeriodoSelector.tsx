"use client";

import { PERIODOS, Periodo } from "@/lib/metrics";

export function PeriodoSelector({
  periodo, onChange, variante = "claro",
}: {
  periodo: Periodo; onChange: (p: Periodo) => void; variante?: "claro" | "oscuro";
}) {
  const contenedor = variante === "oscuro" ? "bg-white/10" : "bg-[var(--color-crema)]";
  return (
    <div className={`flex ${contenedor} rounded-xl p-1 no-imprimir`}>
      {PERIODOS.map((p) => {
        const activo = periodo === p.value;
        const activoClase = variante === "oscuro"
          ? "bg-white text-[var(--color-terracota-oscuro)]"
          : "bg-white shadow-sm text-[var(--color-terracota)]";
        const inactivoClase = variante === "oscuro"
          ? "text-white/80 hover:text-white"
          : "text-[var(--color-gris-medio)] hover:text-[var(--color-gris)]";
        return (
          <button
            key={p.value}
            onClick={() => onChange(p.value)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${activo ? activoClase : inactivoClase}`}
          >
            {p.label}
          </button>
        );
      })}
    </div>
  );
}
