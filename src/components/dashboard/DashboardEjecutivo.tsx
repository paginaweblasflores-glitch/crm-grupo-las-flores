"use client";

import { useMemo, useState } from "react";
import { Users, CalendarCheck, TrendingUp, Package } from "lucide-react";
import { NEGOCIOS } from "@/lib/mock/negocios";
import { resumenNegocio, resumenPeriodo, serieParaPeriodo, PERIODOS, Periodo, resumenCumpleanosMes } from "@/lib/metrics";
import { Card, CardHeader } from "@/components/ui/Card";
import { StatTile } from "@/components/ui/StatTile";
import { Badge } from "@/components/ui/Badge";
import { BarChartMensual } from "@/components/charts/BarChartMensual";

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

export function DashboardEjecutivo() {
  const [periodo, setPeriodo] = useState<Periodo>("semana");
  const negociosOperando = NEGOCIOS.filter((n) => n.operando);

  const resumenesPeriodo = useMemo(
    () => negociosOperando.map((n) => ({ negocio: n, resumen: resumenPeriodo(n.id, periodo) })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [periodo]
  );
  const resumenesGenerales = negociosOperando.map((n) => ({ negocio: n, resumen: resumenNegocio(n.id) }));
  const cumpleanosGrupo = negociosOperando.reduce(
    (acc, n) => {
      const r = resumenCumpleanosMes(n.id);
      return { enviados: acc.enviados + r.enviados, personas: acc.personas + r.personasQueReservaron, monto: acc.monto + r.montoTotal };
    },
    { enviados: 0, personas: 0, monto: 0 }
  );

  const totalClientes = resumenesPeriodo.reduce((a, r) => a + r.resumen.clientesNuevos, 0);
  const totalReservas = resumenesPeriodo.reduce((a, r) => a + r.resumen.reservas, 0);
  const totalPedidos = resumenesPeriodo.reduce((a, r) => a + r.resumen.pedidos, 0);
  const totalIngresos = resumenesPeriodo.reduce((a, r) => a + r.resumen.ingresos, 0);

  const cambioPromedio = (campo: "clientesNuevosCambio" | "reservasCambio" | "pedidosCambio" | "ingresosCambio") => {
    const valores = resumenesPeriodo.map((r) => r.resumen[campo]).filter((v): v is number => v !== null);
    if (valores.length === 0) return null;
    return Math.round(valores.reduce((a, b) => a + b, 0) / valores.length);
  };

  const serieCombinada = sumarSeries(negociosOperando.map((n) => serieParaPeriodo(n.id, periodo)));
  const periodoLabel = PERIODOS.find((p) => p.value === periodo)!.label;

  return (
    <div className="space-y-6">
      <div className="bg-[var(--color-terracota-oscuro)] rounded-2xl p-6 text-white flex items-start justify-between flex-wrap gap-4">
        <div>
          <p className="text-sm text-white/70 mb-1">Resumen de los tres negocios del grupo</p>
          <p className="text-xs text-white/50 max-w-2xl">
            Números agregados, no la tabla de reservas fila por fila. Cambia el periodo del reporte según
            lo que necesites revisar.
          </p>
        </div>
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
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatTile
          label={`Clientes nuevos (${periodoLabel.toLowerCase()})`}
          value={totalClientes}
          icon={<Users size={18} />}
          tono="terracota"
          trend={formatearCambio(cambioPromedio("clientesNuevosCambio"))}
          trendUp={(cambioPromedio("clientesNuevosCambio") ?? 0) >= 0}
        />
        <StatTile
          label={`Reservas (${periodoLabel.toLowerCase()})`}
          value={totalReservas}
          icon={<CalendarCheck size={18} />}
          tono="naranja"
          trend={formatearCambio(cambioPromedio("reservasCambio"))}
          trendUp={(cambioPromedio("reservasCambio") ?? 0) >= 0}
        />
        <StatTile
          label={`Delivery (${periodoLabel.toLowerCase()})`}
          value={totalPedidos}
          icon={<Package size={18} />}
          tono="azul"
          trend={formatearCambio(cambioPromedio("pedidosCambio"))}
          trendUp={(cambioPromedio("pedidosCambio") ?? 0) >= 0}
        />
        <StatTile
          label={`Ingresos (${periodoLabel.toLowerCase()})`}
          value={`S/ ${totalIngresos.toLocaleString("es-PE")}`}
          icon={<TrendingUp size={18} />}
          tono="verde"
          trend={formatearCambio(cambioPromedio("ingresosCambio"))}
          trendUp={(cambioPromedio("ingresosCambio") ?? 0) >= 0}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <Card className="xl:col-span-2">
          <CardHeader
            title={`Reservas y delivery — ${periodo === "anio" ? "por mes" : "por día"}`}
            subtitle={`Grupo completo · vista ${periodoLabel.toLowerCase()}. La comparación (↑/↓) es contra el periodo anterior equivalente.`}
          />
          <BarChartMensual data={serieCombinada} />
        </Card>

        <Card>
          <CardHeader title="Cumpleaños de este mes" subtitle="Grupo completo — el detalle lo lleva Ventas" />
          <dl className="space-y-3 text-sm">
            <Fila etiqueta="Saludos enviados" valor={cumpleanosGrupo.enviados} />
            <Fila etiqueta="Personas que reservaron" valor={cumpleanosGrupo.personas} />
            <Fila etiqueta="Monto generado" valor={`S/ ${cumpleanosGrupo.monto.toLocaleString("es-PE")}`} />
          </dl>
        </Card>
      </div>

      <Card>
        <CardHeader
          title="Comparativo por negocio"
          subtitle={`Mamina Restobar no aparece: todavía no opera · vista ${periodoLabel.toLowerCase()}`}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {resumenesPeriodo.map(({ negocio, resumen }) => {
            const general = resumenesGenerales.find((r) => r.negocio.id === negocio.id)!.resumen;
            return (
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
                    {resumen.clientesNuevos} <Cambio valor={resumen.clientesNuevosCambio} />
                  </dd>
                  <dt className="text-[var(--color-gris-medio)]">Reservas</dt>
                  <dd className="text-right font-semibold text-[var(--color-gris)]">
                    {resumen.reservas} <Cambio valor={resumen.reservasCambio} />
                  </dd>
                  <dt className="text-[var(--color-gris-medio)]">Ingresos</dt>
                  <dd className="text-right font-semibold text-[var(--color-gris)]">
                    S/ {resumen.ingresos.toLocaleString("es-PE")} <Cambio valor={resumen.ingresosCambio} />
                  </dd>
                  <dt className="text-[var(--color-gris-medio)]">Ticket promedio</dt>
                  <dd className="text-right font-semibold text-[var(--color-gris)]">S/ {general.ticketPromedio}</dd>
                </dl>
              </div>
            );
          })}
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

function Fila({ etiqueta, valor }: { etiqueta: string; valor: string | number }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-[var(--color-gris-medio)]">{etiqueta}</dt>
      <dd className="font-semibold text-[var(--color-gris)]">{valor}</dd>
    </div>
  );
}
