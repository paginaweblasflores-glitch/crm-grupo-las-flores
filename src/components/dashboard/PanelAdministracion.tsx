"use client";

import { useState } from "react";
import { PERIODOS, Periodo, rangoDelPeriodo } from "@/lib/metrics";
import { EstadisticasVendedores } from "@/components/dashboard/EstadisticasVendedores";
import { Card } from "@/components/ui/Card";

// Panel de Administración — alcance angosto a propósito, es lo único que
// este rol ve en todo el sistema (ver permissions.ts): supervisar al
// equipo de Ventas de los 3 negocios. Reutiliza el mismo ranking de
// asesores que ya usa Panel Gerencial (quién registró más, hace cuánto,
// clic para ver todos los clientes de cada uno y su ficha completa) — acá
// va fijo en "todas las sucursales" (negocioIdFijo="todas"), sin selector
// de sede: Administración siempre ve a los 3 equipos juntos, nunca uno
// solo — no necesita cambiar de negocio para eso, a diferencia de
// Gerencial que sí opera cada sede por separado.
export function PanelAdministracion() {
  const [periodo, setPeriodo] = useState<Periodo>("semana");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-sm font-semibold text-[var(--color-gris)]">Supervisión del Equipo Comercial</h2>
          <p className="text-xs text-[var(--color-gris-medio)] mt-0.5">Los 3 negocios del grupo · {rangoDelPeriodo(periodo)}</p>
        </div>
        <div className="flex bg-[var(--color-crema)] rounded-xl p-1 no-imprimir">
          {PERIODOS.map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriodo(p.value)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                periodo === p.value ? "bg-white text-[var(--color-terracota)] shadow-sm" : "text-[var(--color-gris-medio)] hover:text-[var(--color-gris)]"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Un solo día de ranking es demasiado ruidoso para decidir nada —
          mismo criterio que ya usa Panel Gerencial para este mismo bloque. */}
      {periodo === "dia" ? (
        <Card>
          <p className="text-sm text-[var(--color-gris-medio)] py-6 text-center">
            La vista Diaria es muy poca muestra para un ranking confiable — elige Semanal, Mensual o Anual.
          </p>
        </Card>
      ) : (
        <EstadisticasVendedores periodo={periodo} negocioIdFijo="todas" />
      )}
    </div>
  );
}
