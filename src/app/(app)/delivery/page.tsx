"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Download, DollarSign, Package } from "lucide-react";
import { useApp } from "@/lib/app-context";
import { accesoA } from "@/lib/permissions";
import { Topbar } from "@/components/layout/Topbar";
import { Card, CardHeader } from "@/components/ui/Card";
import { StatTile } from "@/components/ui/StatTile";
import { SearchInput } from "@/components/ui/SearchInput";
import { Badge, type Tono } from "@/components/ui/Badge";
import { Table, Thead, Th, Tr, Td } from "@/components/ui/Table";
import { PeriodoSelector } from "@/components/dashboard/PeriodoSelector";
import { ExportarPDFBoton } from "@/components/ui/ExportarPDFBoton";
import dynamic from "next/dynamic";
const BarChartSerie = dynamic(() => import("@/components/charts/BarChartSerie").then((m) => m.BarChartSerie), { ssr: false, loading: () => <div className="h-[220px]" /> });
const DonutChart = dynamic(() => import("@/components/charts/DonutChart").then((m) => m.DonutChart), { ssr: false, loading: () => <div className="h-[220px]" /> });
import { PEDIDOS } from "@/lib/mock/pedidos";
import { pedidosPorPeriodo, seriePedidosPorPeriodo, distribucionEstadoPedidos, Periodo, PERIODOS } from "@/lib/metrics";
import { exportarCSV } from "@/lib/export-csv";
import { EstadoPedido } from "@/lib/types";

const ESTADO_TONO: Record<EstadoPedido, Tono> = {
  "en-preparacion": "naranja",
  "en-camino": "azul",
  entregado: "verde",
  cancelado: "rojo",
};
const ESTADO_LABEL: Record<EstadoPedido, string> = {
  "en-preparacion": "En preparación",
  "en-camino": "En camino",
  entregado: "Entregado",
  cancelado: "Cancelado",
};

export default function DeliveryPage() {
  const { usuario, negocio } = useApp();
  const router = useRouter();
  const [busqueda, setBusqueda] = useState("");
  const [periodo, setPeriodo] = useState<Periodo>("semana");
  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return PEDIDOS;
    return PEDIDOS.filter((p) => p.clienteNombre.toLowerCase().includes(q));
  }, [busqueda]);

  const fueraDeAlcance = negocio.id !== "las-flores";

  useEffect(() => {
    if (fueraDeAlcance) router.replace("/dashboard");
  }, [fueraDeAlcance, router]);

  if (!usuario || fueraDeAlcance) return null;
  const nivel = accesoA(usuario.rolTipo, "delivery");
  const periodoLabel = PERIODOS.find((p) => p.value === periodo)!.label;

  if (nivel === "resumen") {
    const resumen = pedidosPorPeriodo("las-flores", periodo);
    const serie = seriePedidosPorPeriodo("las-flores", periodo);
    const distribucion = distribucionEstadoPedidos("las-flores");
    return (
      <>
        <Topbar titulo="Delivery" descripcion="Resumen ejecutivo · Restaurante Las Flores" />
        <main className="flex-1 p-8 animate-fade-in space-y-6" id="reporte">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <PeriodoSelector periodo={periodo} onChange={setPeriodo} />
            <ExportarPDFBoton />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <StatTile
              label={`Pedidos (${periodoLabel.toLowerCase()})`} value={resumen.total} icon={<Package size={18} />}
              tono="terracota" trend={formatearCambio(resumen.totalCambio)} trendUp={(resumen.totalCambio ?? 0) >= 0}
            />
            <StatTile
              label={`Monto vendido (${periodoLabel.toLowerCase()})`} value={`S/ ${resumen.monto.toLocaleString("es-PE")}`} icon={<DollarSign size={18} />}
              tono="verde" trend={formatearCambio(resumen.montoCambio)} trendUp={(resumen.montoCambio ?? 0) >= 0}
            />
          </div>
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
            <Card className="xl:col-span-2 romper-pagina">
              <CardHeader title={`Pedidos — ${periodo === "anio" ? "por mes" : "por día"}`} subtitle={`Vista ${periodoLabel.toLowerCase()}`} />
              <BarChartSerie data={serie} series={[{ key: "pedidos", nombre: "Pedidos", color: "#E08A3E" }]} />
            </Card>
            <Card className="romper-pagina">
              <CardHeader title="Estado de los pedidos" subtitle="Total histórico" />
              <DonutChart data={distribucion} />
            </Card>
          </div>
        </main>
      </>
    );
  }

  function exportar() {
    exportarCSV(
      "delivery-las-flores",
      ["Cliente", "Fecha", "Productos", "Monto", "Canal", "Estado"],
      filtrados.map((p) => [p.clienteNombre, p.fecha, p.productos.join(" · "), p.monto, p.canal, p.estado])
    );
  }

  const semana = pedidosPorPeriodo("las-flores", "semana");

  return (
    <>
      <Topbar titulo="Delivery" descripcion="Restaurante Las Flores · simulado, pendiente de conexión real a la web" />
      <main className="flex-1 p-8 animate-fade-in space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <StatTile label="Pedidos esta semana" value={semana.total} icon={<Package size={18} />} tono="terracota" />
          <StatTile label="Monto vendido (semana)" value={`S/ ${semana.monto}`} icon={<DollarSign size={18} />} tono="verde" />
        </div>

        <div className="flex items-center gap-3 justify-end">
          <SearchInput value={busqueda} onChange={setBusqueda} placeholder="Buscar cliente…" />
          <button onClick={exportar} className="flex items-center gap-2 bg-[var(--color-verde)] text-white text-sm font-semibold rounded-xl px-4 py-2.5 hover:opacity-90 transition-opacity whitespace-nowrap">
            <Download size={15} /> Exportar
          </button>
        </div>

        <Card padding="p-0 pt-5">
          <Table>
            <Thead>
              <Th>Cliente</Th><Th>Fecha</Th><Th>Productos</Th><Th>Monto</Th><Th>Canal</Th><Th>Estado</Th>
            </Thead>
            <tbody>
              {filtrados.map((p) => (
                <Tr key={p.id}>
                  <Td className="font-medium">{p.clienteNombre}</Td>
                  <Td>{new Date(p.fecha).toLocaleDateString("es-PE")}</Td>
                  <Td className="max-w-xs truncate">{p.productos.join(", ")}</Td>
                  <Td>S/ {p.monto}</Td>
                  <Td className="capitalize">{p.canal}</Td>
                  <Td><Badge tono={ESTADO_TONO[p.estado]}>{ESTADO_LABEL[p.estado]}</Badge></Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        </Card>
      </main>
    </>
  );
}

function formatearCambio(valor: number | null): string | undefined {
  if (valor === null) return undefined;
  return `${valor >= 0 ? "+" : ""}${valor}% vs. periodo anterior`;
}
