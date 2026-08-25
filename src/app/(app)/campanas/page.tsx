"use client";

import { Lock, Megaphone, Send, Percent } from "lucide-react";
import { useApp } from "@/lib/app-context";
import { accesoA } from "@/lib/permissions";
import { Topbar } from "@/components/layout/Topbar";
import { Card, CardHeader } from "@/components/ui/Card";
import { StatTile } from "@/components/ui/StatTile";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge } from "@/components/ui/Badge";
import { campanasPorNegocio } from "@/lib/mock/campanas";
import { ExportarPDFBoton } from "@/components/ui/ExportarPDFBoton";
import dynamic from "next/dynamic";
const BarChartSerie = dynamic(() => import("@/components/charts/BarChartSerie").then((m) => m.BarChartSerie), { ssr: false, loading: () => <div className="h-[220px]" /> });
const DonutChart = dynamic(() => import("@/components/charts/DonutChart").then((m) => m.DonutChart), { ssr: false, loading: () => <div className="h-[220px]" /> });

export default function CampanasPage() {
  const { usuario, negocio } = useApp();
  if (!usuario) return null;
  const nivel = accesoA(usuario.rolTipo, "campanas");

  if (nivel === "no") {
    return (
      <>
        <Topbar titulo="Campañas" descripcion={negocio.nombre} />
        <main className="flex-1 p-8">
          <Card>
            <EmptyState
              icon={<Lock size={22} />}
              title="Este módulo no está disponible para Ventas"
              description="Cumpleaños y Campañas las administra el rol de Administración, según el Plan de CRM."
            />
          </Card>
        </main>
      </>
    );
  }

  if (!negocio.operando) {
    return (
      <>
        <Topbar titulo="Campañas" descripcion={negocio.nombre} />
        <main className="flex-1 p-8">
          <Card><EmptyState icon={<Megaphone size={22} />} title="Este negocio aún no opera" description="Mamina Restobar no tiene campañas todavía." /></Card>
        </main>
      </>
    );
  }

  const campanas = campanasPorNegocio(negocio.id);
  const totalEnviados = campanas.reduce((a, c) => a + c.enviados, 0);
  const totalClientes = campanas.reduce((a, c) => a + c.totalClientes, 0);
  const alcancePromedio = totalClientes ? Math.round((totalEnviados / totalClientes) * 100) : 0;
  const serie = campanas.map((c) => ({ mes: c.mes, enviados: c.enviados, total: c.totalClientes }));
  const porCanal: Record<string, number> = {};
  campanas.forEach((c) => { porCanal[c.canal] = (porCanal[c.canal] ?? 0) + 1; });
  const CANAL_LABEL: Record<string, string> = { whatsapp: "WhatsApp", instagram: "Instagram", facebook: "Facebook" };
  const distribucionCanal = Object.entries(porCanal).map(([canal, valor]) => ({ nombre: CANAL_LABEL[canal] ?? canal, valor }));

  return (
    <>
      <Topbar titulo="Campañas" descripcion={`${negocio.nombre} · promociones y catálogos mensuales`} />
      <main className="flex-1 p-8 animate-fade-in space-y-6" id="reporte">
        {nivel === "resumen" && (
          <>
            <div className="flex items-center justify-end">
              <ExportarPDFBoton />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <StatTile label="Campañas del año" value={campanas.length} icon={<Megaphone size={18} />} tono="terracota" />
              <StatTile label="Total de envíos" value={totalEnviados} icon={<Send size={18} />} tono="azul" />
              <StatTile label="Alcance promedio" value={`${alcancePromedio}%`} icon={<Percent size={18} />} tono="verde" />
            </div>
          </>
        )}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
          <Card className="xl:col-span-2 romper-pagina">
            <CardHeader title="Control mensual" subtitle={nivel === "resumen" ? "Vista de Dirección" : "Igual que la hoja de catálogos del modelo de referencia, aplicado a promociones propias"} />
            <BarChartSerie
              data={serie}
              series={[{ key: "enviados", nombre: "Enviados", color: "#8C3A25" }, { key: "total", nombre: "Base de clientes", color: "#B8AFA6" }]}
            />
          </Card>
          <Card className="romper-pagina">
            <CardHeader title="Canal más usado" subtitle="Campañas por canal" />
            <DonutChart data={distribucionCanal} />
          </Card>
        </div>
        <Card>
          <div className="space-y-3">
            {campanas.map((c) => {
              const pct = Math.round((c.enviados / c.totalClientes) * 100);
              return (
                <div key={c.id} className="flex items-center gap-4 py-2">
                  <div className="w-28 shrink-0">
                    <p className="text-sm font-medium text-[var(--color-gris)]">{c.mes}</p>
                    <Badge tono="gris">{c.canal}</Badge>
                  </div>
                  <div className="flex-1">
                    <div className="h-2.5 rounded-full bg-[var(--color-crema-oscuro)] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[var(--color-terracota)] transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                  <div className="w-28 shrink-0 text-right text-xs text-[var(--color-gris-medio)]">
                    {c.enviados}/{c.totalClientes} enviados
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </main>
    </>
  );
}
