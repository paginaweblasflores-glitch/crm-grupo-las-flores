"use client";

import { useMemo, useState } from "react";
import { Users, TrendingUp, Building2, Percent } from "lucide-react";
import { NEGOCIOS } from "@/lib/mock/negocios";
import {
  resumenCrecimientoGrupo, resumenPeriodo, serieParaPeriodo, PERIODOS, Periodo,
} from "@/lib/metrics";
import { Card, CardHeader } from "@/components/ui/Card";
import { StatTile } from "@/components/ui/StatTile";
import { Badge } from "@/components/ui/Badge";
import { BarChartMensual } from "@/components/charts/BarChartMensual";
import { ExportarPDFBoton } from "@/components/ui/ExportarPDFBoton";

function sumarSeries(series: { mes: string; reservas: number; pedidos: number }[][]) {
  const base = series[0].map((p) => ({ ...p }));
  for (let i = 1; i < series.length; i++) {
    series[i].forEach((p, idx) => {
      base[idx].reservas += p.reservas;
      base[idx].pedidos += p.pedidos;
    });
  }
  return base;
}

// Panel de Dirección (socios/directorio en Lima): solo crecimiento del
// grupo, nada por módulo. Siguiendo la práctica de dashboards ejecutivos —
// pocas métricas, enfocadas en tendencia — no reservas, no delivery, no
// tablas fila por fila.
export function PanelEjecutivo() {
  const [periodo, setPeriodo] = useState<Periodo>("semana");
  const negociosOperando = NEGOCIOS.filter((n) => n.operando);

  const resumen = resumenCrecimientoGrupo(periodo);
  const resumenesPeriodo = useMemo(
    () => negociosOperando.map((n) => ({ negocio: n, resumen: resumenPeriodo(n.id, periodo) })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [periodo]
  );
  const serieCombinada = useMemo(
    () => sumarSeries(negociosOperando.map((n) => serieParaPeriodo(n.id, periodo))),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [periodo]
  );
  const periodoLabel = PERIODOS.find((p) => p.value === periodo)!.label;

  return (
    <div className="space-y-6" id="reporte">
      <div className="bg-[var(--color-terracota-oscuro)] rounded-2xl p-6 text-white flex items-start justify-between flex-wrap gap-4">
        <div>
          <p className="text-sm text-white/70 mb-1">Crecimiento del grupo</p>
          <p className="text-xs text-white/50 max-w-2xl">
            Un solo panel con los tres negocios juntos — para ver hacia dónde va el negocio, no el detalle
            operativo del día a día.
          </p>
        </div>
        <div className="flex items-center gap-3 no-imprimir">
          <div className="flex bg-white/10 rounded-xl p-1">
            {PERIODOS.map((p) => (
              <button
                key={p.value}
                onClick={() => setPeriodo(p.value)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  periodo === p.value ? "bg-white text-[var(--color-terracota-oscuro)]" : "text-white/80 hover:text-white"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          <ExportarPDFBoton />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatTile
          label="Clientes totales"
          value={resumen.clientesTotales}
          icon={<Users size={18} />}
          tono="terracota"
          trend={`+${resumen.clientesNuevos} en el periodo`}
          trendUp
        />
        <StatTile
          label={`Ingresos consolidados (${periodoLabel.toLowerCase()})`}
          value={`S/ ${resumen.ingresos.toLocaleString("es-PE")}`}
          icon={<TrendingUp size={18} />}
          tono="verde"
          trend={formatearCambio(resumen.ingresosCambio)}
          trendUp={(resumen.ingresosCambio ?? 0) >= 0}
        />
        <StatTile
          label="Crecimiento de clientes"
          value={resumen.clientesNuevosCambio === null ? "—" : `${resumen.clientesNuevosCambio >= 0 ? "+" : ""}${resumen.clientesNuevosCambio}%`}
          icon={<Percent size={18} />}
          tono="naranja"
          trend={`vs. periodo anterior`}
          trendUp={(resumen.clientesNuevosCambio ?? 0) >= 0}
        />
        <StatTile
          label="Negocios activos"
          value={`${resumen.negociosActivos} de 3`}
          icon={<Building2 size={18} />}
          tono="azul"
        />
      </div>

      <Card>
        <CardHeader
          title={`Actividad del grupo — ${periodo === "anio" ? "por mes" : "por día"}`}
          subtitle={`Reservas y delivery combinados de los negocios activos · vista ${periodoLabel.toLowerCase()}`}
        />
        <BarChartMensual data={serieCombinada} />
      </Card>

      <Card>
        <CardHeader
          title="Comparativo por negocio"
          subtitle={`Quién está creciendo más · vista ${periodoLabel.toLowerCase()}`}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {resumenesPeriodo.map(({ negocio, resumen: r }) => (
            <div key={negocio.id} className="rounded-xl border border-[var(--color-gris-claro)]/40 p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="flex items-center gap-2 font-semibold text-[var(--color-gris)]">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: negocio.colorAcento }} />
                  {negocio.nombre}
                </span>
                <Badge tono="gris">{negocio.tipo === "hotel" ? "Hotel" : "Restaurante"}</Badge>
              </div>
              <dl className="grid grid-cols-2 gap-y-2.5 text-sm">
                <dt className="text-[var(--color-gris-medio)]">Clientes nuevos</dt>
                <dd className="text-right font-semibold text-[var(--color-gris)]">
                  {r.clientesNuevos} <Cambio valor={r.clientesNuevosCambio} />
                </dd>
                <dt className="text-[var(--color-gris-medio)]">Ingresos</dt>
                <dd className="text-right font-semibold text-[var(--color-gris)]">
                  S/ {r.ingresos.toLocaleString("es-PE")} <Cambio valor={r.ingresosCambio} />
                </dd>
              </dl>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function formatearCambio(valor: number | null): string | undefined {
  if (valor === null) return undefined;
  return `${valor >= 0 ? "+" : ""}${valor}% vs. periodo anterior`;
}

function Cambio({ valor }: { valor: number | null }) {
  if (valor === null) return null;
  const positivo = valor >= 0;
  return (
    <span className={`text-[10px] font-bold ${positivo ? "text-[var(--color-verde)]" : "text-[var(--color-rojo)]"}`}>
      {positivo ? "↑" : "↓"}{Math.abs(valor)}%
    </span>
  );
}
