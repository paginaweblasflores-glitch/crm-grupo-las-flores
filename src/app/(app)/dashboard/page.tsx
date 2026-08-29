"use client";

import dynamic from "next/dynamic";
import { useApp } from "@/lib/app-context";
import { accesoA } from "@/lib/permissions";
import { Topbar } from "@/components/layout/Topbar";
import { ExportarPDFBoton } from "@/components/ui/ExportarPDFBoton";
import { BASE_DATE } from "@/lib/mock/seed";

// Cada rol solo ve uno de los tres — cargarlos perezosamente evita que los
// otros (con sus gráficos de recharts) se descarguen y parseen sin usarse.
const DashboardNegocio = dynamic(() => import("@/components/dashboard/DashboardNegocio").then((m) => m.DashboardNegocio), { ssr: false });
const PanelGerencial = dynamic(() => import("@/components/dashboard/PanelGerencial").then((m) => m.PanelGerencial), { ssr: false });
const PanelEjecutivo = dynamic(() => import("@/components/dashboard/PanelEjecutivo").then((m) => m.PanelEjecutivo), { ssr: false });

const FECHA_HOY = BASE_DATE.toLocaleDateString("es-PE", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

export default function DashboardPage() {
  const { usuario, negocio } = useApp();
  if (!usuario) return null;

  const esResumen = accesoA(usuario.rolTipo, "dashboard") === "resumen";
  const esGerencial = usuario.rolTipo === "gerencial";

  const descripcion = esResumen
    ? "Panel de métricas de crecimiento del grupo"
    : esGerencial
      ? FECHA_HOY
      : `Tablero de ${negocio.nombre}`;

  // Solo Gerente General guarda nombreReal — el saludo usa su primer nombre
  // real; el resto de cuentas se saluda por el nombre completo del cargo
  // ("Ventas Uno"), que ya no es un nombre de pila para recortar.
  const primerNombre = usuario.nombreReal ? usuario.nombreReal.split(" ")[0] : usuario.nombre;

  return (
    <>
      <Topbar
        titulo={`Bienvenido, ${primerNombre}`}
        descripcion={descripcion}
        accion={esGerencial || esResumen ? <ExportarPDFBoton etiqueta="Exportar PDF" /> : undefined}
      />
      <main className="flex-1 p-8 animate-fade-in">
        {esResumen ? <PanelEjecutivo /> : esGerencial ? <PanelGerencial /> : <DashboardNegocio negocioId={negocio.id} operando={negocio.operando} />}
      </main>
    </>
  );
}
