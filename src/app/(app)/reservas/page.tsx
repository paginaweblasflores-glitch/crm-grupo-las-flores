"use client";

import { useMemo, useState } from "react";
import { Download, CalendarCheck, CheckCircle2, XCircle, ShieldCheck } from "lucide-react";
import { useApp } from "@/lib/app-context";
import { accesoA, puedeAutorizar } from "@/lib/permissions";
import { useAutorizaciones } from "@/lib/store";
import { Topbar } from "@/components/layout/Topbar";
import { Card, CardHeader } from "@/components/ui/Card";
import { StatTile } from "@/components/ui/StatTile";
import { SearchInput } from "@/components/ui/SearchInput";
import { Badge, type Tono } from "@/components/ui/Badge";
import { Table, Thead, Th, Tr, Td } from "@/components/ui/Table";
import { EmptyState } from "@/components/ui/EmptyState";
import { reservasPorNegocio } from "@/lib/mock/reservas";
import { reservasSemana, tasaConversionReservas, resumenPeriodo, reservasEstadoPorPeriodo, serieReservasPorPeriodo, distribucionEstadoReservas, Periodo, PERIODOS } from "@/lib/metrics";
import { exportarCSV } from "@/lib/export-csv";
import { EstadoReserva } from "@/lib/types";
import { PeriodoSelector } from "@/components/dashboard/PeriodoSelector";
import { ExportarPDFBoton } from "@/components/ui/ExportarPDFBoton";
import dynamic from "next/dynamic";
const BarChartSerie = dynamic(() => import("@/components/charts/BarChartSerie").then((m) => m.BarChartSerie), { ssr: false, loading: () => <div className="h-[220px]" /> });
const DonutChart = dynamic(() => import("@/components/charts/DonutChart").then((m) => m.DonutChart), { ssr: false, loading: () => <div className="h-[220px]" /> });

const ESTADO_TONO: Record<EstadoReserva, Tono> = {
  confirmada: "azul",
  atendida: "verde",
  cancelada: "rojo",
  "no-llego": "gris",
};
const ESTADO_LABEL: Record<EstadoReserva, string> = {
  confirmada: "Confirmada",
  atendida: "Atendida",
  cancelada: "Cancelada",
  "no-llego": "No llegó",
};

export default function ReservasPage() {
  const { usuario, negocio } = useApp();
  const [busqueda, setBusqueda] = useState("");
  const [filtro, setFiltro] = useState<EstadoReserva | "todas">("todas");
  const [periodo, setPeriodo] = useState<Periodo>("semana");
  const { autorizadas, autorizar, listo: listoAutorizaciones } = useAutorizaciones();
  const todas = reservasPorNegocio(negocio.id);
  const filtradas = useMemo(() => {
    let items = todas;
    if (filtro !== "todas") items = items.filter((r) => r.estado === filtro);
    const q = busqueda.trim().toLowerCase();
    if (q) items = items.filter((r) => r.clienteNombre.toLowerCase().includes(q));
    return items;
  }, [todas, filtro, busqueda]);

  if (!usuario) return null;
  const nivel = accesoA(usuario.rolTipo, "reservas");

  if (!negocio.operando) {
    return (
      <>
        <Topbar titulo="Reservas" descripcion={negocio.nombre} />
        <main className="flex-1 p-8">
          <Card><EmptyState icon={<CalendarCheck size={22} />} title="Este negocio aún no opera" description="Mamina Restobar no tiene reservas todavía — no hay fecha de apertura definida." /></Card>
        </main>
      </>
    );
  }

  const semana = reservasSemana(negocio.id);
  const conversion = tasaConversionReservas(negocio.id);

  if (nivel === "resumen") {
    const resumen = resumenPeriodo(negocio.id, periodo);
    const estado = reservasEstadoPorPeriodo(negocio.id, periodo);
    const serie = serieReservasPorPeriodo(negocio.id, periodo);
    const distribucion = distribucionEstadoReservas(negocio.id);
    const periodoLabel = PERIODOS.find((p) => p.value === periodo)!.label;
    return (
      <>
        <Topbar titulo="Reservas" descripcion={`Resumen ejecutivo · ${negocio.nombre}`} />
        <main className="flex-1 p-8 animate-fade-in space-y-6" id="reporte">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <PeriodoSelector periodo={periodo} onChange={setPeriodo} />
            <ExportarPDFBoton />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatTile
              label={`Reservas (${periodoLabel.toLowerCase()})`} value={resumen.reservas} icon={<CalendarCheck size={18} />}
              tono="terracota" trend={formatearCambio(resumen.reservasCambio)} trendUp={(resumen.reservasCambio ?? 0) >= 0}
            />
            <StatTile
              label={`Confirmadas / atendidas (${periodoLabel.toLowerCase()})`} value={estado.confirmadas} icon={<CheckCircle2 size={18} />}
              tono="verde" trend={formatearCambio(estado.confirmadasCambio)} trendUp={(estado.confirmadasCambio ?? 0) >= 0}
            />
            <StatTile label={`Tasa de conversión (${periodoLabel.toLowerCase()})`} value={`${estado.conversion}%`} icon={<XCircle size={18} />} tono="naranja" />
          </div>
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
            <Card className="xl:col-span-2 romper-pagina">
              <CardHeader title={`Reservas — ${periodo === "anio" ? "por mes" : "por día"}`} subtitle={`Vista ${periodoLabel.toLowerCase()}`} />
              <BarChartSerie data={serie} series={[{ key: "reservas", nombre: "Reservas", color: "#5C7C8C" }]} />
            </Card>
            <Card className="romper-pagina">
              <CardHeader title="Estado de las reservas" subtitle="Total histórico" />
              <DonutChart data={distribucion} />
            </Card>
          </div>
          <Card>
            <CardHeader title="Vista de Dirección" subtitle="Resumen agregado — el detalle fila por fila lo maneja Ventas y Administración" />
          </Card>
        </main>
      </>
    );
  }

  function exportar() {
    exportarCSV(
      `reservas-${negocio.id}`,
      ["Cliente", "Fecha", "Hora", "Personas", "Tipo", "Canal", "Estado", "Monto"],
      filtradas.map((r) => [r.clienteNombre, r.fecha, r.hora, r.personas, r.tipo, r.canal, r.estado, r.monto ?? ""])
    );
  }

  return (
    <>
      <Topbar titulo="Reservas" descripcion={`${negocio.nombre} · simulado, pendiente de conexión real a la web`} />
      <main className="flex-1 p-8 animate-fade-in space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatTile label="Reservas esta semana" value={semana.total} icon={<CalendarCheck size={18} />} tono="terracota" />
          <StatTile label="Confirmadas / atendidas" value={semana.confirmadas} icon={<CheckCircle2 size={18} />} tono="verde" />
          <StatTile label="Tasa de conversión" value={`${conversion}%`} icon={<XCircle size={18} />} tono="naranja" />
        </div>

        <div className="flex flex-wrap items-center gap-3 justify-between">
          <div className="flex gap-1.5 flex-wrap">
            {(["todas", "confirmada", "atendida", "cancelada", "no-llego"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFiltro(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  filtro === f ? "bg-[var(--color-terracota)] text-white" : "bg-white border border-[var(--color-gris-claro)]/50 text-[var(--color-gris-medio)]"
                }`}
              >
                {f === "todas" ? "Todas" : ESTADO_LABEL[f]}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <SearchInput value={busqueda} onChange={setBusqueda} placeholder="Buscar cliente…" />
            <button onClick={exportar} className="flex items-center gap-2 bg-[var(--color-verde)] text-white text-sm font-semibold rounded-xl px-4 py-2.5 hover:opacity-90 transition-opacity whitespace-nowrap">
              <Download size={15} /> Exportar
            </button>
          </div>
        </div>

        <Card padding="p-0 pt-5">
          <Table>
            <Thead>
              <Th>Cliente</Th><Th>Fecha</Th><Th>Hora</Th><Th>Personas</Th><Th>Tipo</Th><Th>Canal</Th><Th>Estado</Th><Th>Monto</Th><Th>Autorización</Th>
            </Thead>
            <tbody>
              {filtradas.map((r) => {
                const necesitaAutorizacion = r.requiereAutorizacion && r.estado !== "cancelada" && r.estado !== "no-llego";
                const autorizada = autorizadas.has(r.id);
                return (
                  <Tr key={r.id}>
                    <Td className="font-medium">{r.clienteNombre}</Td>
                    <Td>{new Date(r.fecha).toLocaleDateString("es-PE")}</Td>
                    <Td>{r.hora}</Td>
                    <Td>{r.personas}</Td>
                    <Td className="capitalize">{r.tipo}</Td>
                    <Td className="capitalize">{r.canal}</Td>
                    <Td><Badge tono={ESTADO_TONO[r.estado]}>{ESTADO_LABEL[r.estado]}</Badge></Td>
                    <Td>{r.monto ? `S/ ${r.monto}` : "—"}</Td>
                    <Td>
                      {!necesitaAutorizacion ? (
                        <span className="text-[var(--color-gris-medio)] text-xs">—</span>
                      ) : autorizada ? (
                        <Badge tono="verde"><ShieldCheck size={11} /> Autorizada</Badge>
                      ) : puedeAutorizar(usuario.rolTipo) ? (
                        <button
                          onClick={() => listoAutorizaciones && autorizar(r.id)}
                          className="text-xs font-semibold bg-[var(--color-terracota)] text-white rounded-lg px-2.5 py-1 hover:opacity-90 transition-opacity"
                        >
                          Autorizar
                        </button>
                      ) : (
                        <Badge tono="naranja">Pendiente de Administración</Badge>
                      )}
                    </Td>
                  </Tr>
                );
              })}
            </tbody>
          </Table>
          {filtradas.length === 0 && <p className="text-center text-sm text-[var(--color-gris-medio)] py-10">Sin resultados.</p>}
        </Card>
      </main>
    </>
  );
}

function formatearCambio(valor: number | null): string | undefined {
  if (valor === null) return undefined;
  return `${valor >= 0 ? "+" : ""}${valor}% vs. periodo anterior`;
}
