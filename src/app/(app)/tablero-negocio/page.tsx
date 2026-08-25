"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Users, CalendarCheck, TrendingUp, Package, BedDouble, Store } from "lucide-react";
import { useApp } from "@/lib/app-context";
import { accesoA } from "@/lib/permissions";
import { Topbar } from "@/components/layout/Topbar";
import { Card, CardHeader } from "@/components/ui/Card";
import { StatTile } from "@/components/ui/StatTile";
import { EmptyState } from "@/components/ui/EmptyState";
import { PeriodoSelector } from "@/components/dashboard/PeriodoSelector";
import { ExportarPDFBoton } from "@/components/ui/ExportarPDFBoton";
import dynamic from "next/dynamic";
const BarChartMensual = dynamic(() => import("@/components/charts/BarChartMensual").then((m) => m.BarChartMensual), { ssr: false, loading: () => <div className="h-[220px]" /> });
import { resumenPeriodo, serieParaPeriodo, resumenCumpleanosMes, resumenNegocio, Periodo, PERIODOS } from "@/lib/metrics";

export default function TableroNegocioPage() {
  const { usuario, negocio } = useApp();
  const router = useRouter();
  const [periodo, setPeriodo] = useState<Periodo>("semana");

  const sinAcceso = usuario ? accesoA(usuario.rolTipo, "tableroNegocio") === "no" : false;

  useEffect(() => {
    if (sinAcceso) router.replace("/dashboard");
  }, [sinAcceso, router]);

  if (!usuario || sinAcceso) return null;

  if (!negocio.operando) {
    return (
      <>
        <Topbar titulo="Tablero del negocio" descripcion={negocio.nombre} />
        <main className="flex-1 p-8">
          <Card>
            <EmptyState
              icon={<Store size={22} />}
              title="Este negocio aún no opera"
              description="Mamina Restobar no tiene fecha de apertura definida todavía — en cuanto abra, este tablero se activa solo."
            />
          </Card>
        </main>
      </>
    );
  }

  const resumen = resumenPeriodo(negocio.id, periodo);
  const serie = serieParaPeriodo(negocio.id, periodo);
  const cumpleanosMes = resumenCumpleanosMes(negocio.id);
  const general = resumenNegocio(negocio.id);
  const periodoLabel = PERIODOS.find((p) => p.value === periodo)!.label;
  const esHotel = negocio.tipo === "hotel";

  return (
    <>
      <Topbar titulo="Tablero del negocio" descripcion={`Vista de Dirección · ${negocio.nombre}`} />
      <main className="flex-1 p-8 animate-fade-in space-y-6" id="reporte">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <PeriodoSelector periodo={periodo} onChange={setPeriodo} />
          <ExportarPDFBoton />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatTile
            label={`Clientes nuevos (${periodoLabel.toLowerCase()})`} value={resumen.clientesNuevos} icon={<Users size={18} />}
            tono="terracota" trend={formatearCambio(resumen.clientesNuevosCambio)} trendUp={(resumen.clientesNuevosCambio ?? 0) >= 0}
          />
          <StatTile
            label={`Reservas (${periodoLabel.toLowerCase()})`} value={resumen.reservas} icon={<CalendarCheck size={18} />}
            tono="naranja" trend={formatearCambio(resumen.reservasCambio)} trendUp={(resumen.reservasCambio ?? 0) >= 0}
          />
          {esHotel ? (
            <StatTile label="Ticket promedio" value={`S/ ${general.ticketPromedio}`} icon={<BedDouble size={18} />} tono="azul" />
          ) : (
            <StatTile
              label={`Delivery (${periodoLabel.toLowerCase()})`} value={resumen.pedidos} icon={<Package size={18} />}
              tono="azul" trend={formatearCambio(resumen.pedidosCambio)} trendUp={(resumen.pedidosCambio ?? 0) >= 0}
            />
          )}
          <StatTile
            label={`Ingresos (${periodoLabel.toLowerCase()})`} value={`S/ ${resumen.ingresos.toLocaleString("es-PE")}`} icon={<TrendingUp size={18} />}
            tono="verde" trend={formatearCambio(resumen.ingresosCambio)} trendUp={(resumen.ingresosCambio ?? 0) >= 0}
          />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
          <Card className="xl:col-span-2 romper-pagina">
            <CardHeader
              title={`Reservas y delivery — ${periodo === "anio" ? "por mes" : "por día"}`}
              subtitle={`${negocio.nombre} · vista ${periodoLabel.toLowerCase()}`}
            />
            <BarChartMensual data={serie} />
          </Card>
          <Card className="romper-pagina">
            <CardHeader title="Cumpleaños de este mes" subtitle="El detalle día a día lo lleva Ventas" />
            <dl className="space-y-3 text-sm">
              <Fila etiqueta="Saludos enviados" valor={cumpleanosMes.enviados} />
              <Fila etiqueta="Personas que reservaron" valor={cumpleanosMes.personasQueReservaron} />
              <Fila etiqueta="Monto generado" valor={`S/ ${cumpleanosMes.montoTotal.toLocaleString("es-PE")}`} />
            </dl>
          </Card>
        </div>
      </main>
    </>
  );
}

function formatearCambio(valor: number | null): string | undefined {
  if (valor === null) return undefined;
  return `${valor >= 0 ? "+" : ""}${valor}% vs. periodo anterior`;
}

function Fila({ etiqueta, valor }: { etiqueta: string; valor: string | number }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-[var(--color-gris-medio)]">{etiqueta}</dt>
      <dd className="font-semibold text-[var(--color-gris)]">{valor}</dd>
    </div>
  );
}
