"use client";

import { useState } from "react";
import { Users, Building2, Gift, UserPlus } from "lucide-react";
import { NegocioId } from "@/lib/types";
import { Card, CardHeader } from "@/components/ui/Card";
import { StatTile } from "@/components/ui/StatTile";
import { RingProgress } from "@/components/ui/RingProgress";
import { BarChartSerie } from "@/components/charts/BarChartSerie";
import { ActividadFeed } from "@/components/dashboard/ActividadFeed";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  actividadReciente, resumenCumpleanosPeriodo, clientesPorTipoPeriodo, serieClientesPorPeriodo,
  PERIODOS, Periodo, rangoDelPeriodo, etiquetaPeriodoAnterior,
} from "@/lib/metrics";
import { proximosCumpleanos } from "@/lib/mock/seguimiento";
import { BASE_DATE } from "@/lib/mock/seed";
import { clientesIndividualesPorNegocio, corporativosPorNegocio } from "@/lib/mock/clientes";
import { getNegocio } from "@/lib/mock/negocios";

function cambioTexto(valor: number | null, periodo: Periodo): string | undefined {
  // `valor` ya viene en null para Diario (una muestra de 1 día es
  // demasiado chica para que un % signifique algo real) — mismo criterio
  // que ya usa Panel Gerencial.
  if (valor === null) return undefined;
  return `${valor >= 0 ? "+" : ""}${valor}% vs. ${etiquetaPeriodoAnterior(periodo)}`;
}

// Panel Principal de Ventas — mismo filtro de periodo (Diario/Semanal/
// Mensual/Anual) y las mismas tarjetas de "Crecimiento" que ya usan
// Dirección y Gerencial, para que sea la misma calidad y coherencia en
// todo el sistema. Se queda con el alcance que le toca a Ventas: sin
// ranking del equipo completo ni comparativo entre negocios — eso sigue
// siendo exclusivo de Gerencial.
export function DashboardNegocio({ negocioId, operando }: { negocioId: NegocioId; operando: boolean }) {
  const [periodo, setPeriodo] = useState<Periodo>("semana");

  if (!operando) {
    return (
      <Card>
        <EmptyState
          icon={<Gift size={22} />}
          title="Este negocio aún no opera"
          description="Mamina Restobar todavía no tiene fecha de apertura definida. En cuanto abra, se activa dentro de este mismo CRM — sin rediseñar nada."
        />
      </Card>
    );
  }

  const negocioNombre = getNegocio(negocioId)?.nombre ?? negocioId;
  const clientesPeriodo = clientesPorTipoPeriodo(negocioId, periodo);
  const totalClientes = clientesIndividualesPorNegocio(negocioId).length + corporativosPorNegocio(negocioId).length;
  const totalCorporativos = corporativosPorNegocio(negocioId).length;
  const cumpleanos = resumenCumpleanosPeriodo(negocioId, periodo);
  const conversionSaludos = cumpleanos.enviados > 0 ? Math.round((cumpleanos.convertidos / cumpleanos.enviados) * 100) : 0;
  const serieClientes = serieClientesPorPeriodo(negocioId, periodo);
  const cumples = proximosCumpleanos(negocioId, BASE_DATE, 10);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-sm font-semibold text-[var(--color-gris)]">Crecimiento</h2>
          <p className="text-xs text-[var(--color-gris-medio)] mt-0.5">{negocioNombre} · {rangoDelPeriodo(periodo)}</p>
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

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatTile
          label="Clientes nuevos"
          value={clientesPeriodo.individuales}
          icon={<UserPlus size={18} />}
          tono="terracota"
          trend={cambioTexto(clientesPeriodo.individualesCambio, periodo)}
          trendUp={(clientesPeriodo.individualesCambio ?? 0) >= 0}
        />
        <StatTile
          label="Clientes corporativos nuevos"
          value={clientesPeriodo.corporativos}
          icon={<Building2 size={18} />}
          tono="azul"
          trend={cambioTexto(clientesPeriodo.corporativosCambio, periodo)}
          trendUp={(clientesPeriodo.corporativosCambio ?? 0) >= 0}
        />
        <StatTile label="Clientes totales" value={totalClientes} icon={<Users size={18} />} tono="naranja" trend={negocioNombre} />
        <StatTile label="Clientes corporativos" value={totalCorporativos} icon={<Building2 size={18} />} tono="azul" trend={`de ${totalClientes} clientes`} />
      </div>

      {/* Un solo día no da para graficar una tendencia — mismo criterio que
          ya usa Panel Gerencial. */}
      {periodo !== "dia" && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
          <Card className="xl:col-span-2">
            <CardHeader title="Clientes nuevos — tendencia" subtitle={`${rangoDelPeriodo(periodo)} · ${negocioNombre}`} />
            <BarChartSerie
              data={serieClientes}
              xKey="mes"
              series={[{ key: "clientes", nombre: "Clientes nuevos", color: "#8C3A25" }]}
              todasLasEtiquetas={periodo === "mes"}
            />
          </Card>

          <Card>
            <CardHeader title="Cumpleaños que terminan en visita" subtitle={`${cumpleanos.convertidos} de ${cumpleanos.enviados} saludos enviados`} />
            <div className="flex items-center justify-center py-2">
              <RingProgress value={conversionSaludos} sublabel="conversión" />
            </div>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <Card>
          <CardHeader title="Actividad reciente" subtitle="Últimos clientes registrados" />
          <ActividadFeed items={actividadReciente(negocioId, 7)} />
        </Card>

        <Card>
          <CardHeader title="Próximos cumpleaños" subtitle={`${cumples.length} en los próximos 10 días`} />
          {cumples.length === 0 ? (
            <p className="text-sm text-[var(--color-gris-medio)] py-6 text-center">Nadie cumple años en los próximos 10 días.</p>
          ) : (
            <ul className="space-y-1">
              {cumples.slice(0, 6).map(({ cliente, diffDias }) => (
                <li key={cliente.id} className="flex items-center justify-between py-2.5 border-b border-[var(--color-gris-claro)]/20 last:border-0">
                  <span className="text-sm font-medium text-[var(--color-gris)]">{cliente.nombres} {cliente.apellidos}</span>
                  <span className="text-xs text-[var(--color-gris-medio)]">
                    {diffDias === 0 ? "Hoy" : diffDias === 1 ? "Mañana" : `En ${diffDias} días`}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
