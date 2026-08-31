"use client";

import dynamic from "next/dynamic";
import { useApp } from "@/lib/app-context";
import { accesoA } from "@/lib/permissions";
import { Topbar } from "@/components/layout/Topbar";
import { ExportarPDFBoton } from "@/components/ui/ExportarPDFBoton";
import { BASE_DATE } from "@/lib/mock/seed";

// Cada rol solo ve uno de los cuatro — cargarlos perezosamente evita que los
// otros (con sus gráficos de recharts) se descarguen y parseen sin usarse.
const DashboardNegocio = dynamic(() => import("@/components/dashboard/DashboardNegocio").then((m) => m.DashboardNegocio), { ssr: false });
const PanelGerencial = dynamic(() => import("@/components/dashboard/PanelGerencial").then((m) => m.PanelGerencial), { ssr: false });
const PanelEjecutivo = dynamic(() => import("@/components/dashboard/PanelEjecutivo").then((m) => m.PanelEjecutivo), { ssr: false });
const PanelAdministracion = dynamic(() => import("@/components/dashboard/PanelAdministracion").then((m) => m.PanelAdministracion), { ssr: false });

const FECHA_HOY = BASE_DATE.toLocaleDateString("es-PE", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

export default function DashboardPage() {
  const { usuario, negocio } = useApp();
  if (!usuario) return null;

  const esResumen = accesoA(usuario.rolTipo, "dashboard") === "resumen";
  const esGerencial = usuario.rolTipo === "gerencial";
  const esAdministracion = usuario.rolTipo === "administracion";

  const descripcion = esResumen
    ? "Panel de métricas de crecimiento del grupo"
    : esAdministracion
      ? "Supervisión del equipo comercial · los 3 negocios"
      : esGerencial
        ? FECHA_HOY
        : `Tablero de ${negocio.nombre}`;

  // Solo Gerente General guarda nombreReal — el saludo usa su primer nombre
  // real; el resto de cuentas se saluda por el nombre completo del cargo
  // ("Ventas Uno"), que ya no es un nombre de pila para recortar.
  const primerNombre = usuario.nombreReal ? usuario.nombreReal.split(" ")[0] : usuario.nombre;
  const nombreCompleto = usuario.nombreReal ?? usuario.nombre;

  // Dirección siempre reporta consolidado, sin importar qué negocio traiga
  // guardado su cuenta internamente (ver app-context: negocioInicial usa el
  // negocioId de la cuenta incluso para roles "todos") — el PDF debe usar
  // la marca del consorcio, no la de un negocio puntual.
  const negocioIdReporte = esResumen ? "todas" : negocio.id;
  const tituloReporte = esResumen ? "Reporte ejecutivo" : esGerencial ? "Reporte gerencial" : "Reporte de panel";

  return (
    <>
      <Topbar
        titulo={`Bienvenido, ${primerNombre}`}
        descripcion={descripcion}
        accion={
          esGerencial || esResumen ? (
            <ExportarPDFBoton
              etiqueta="Exportar PDF"
              objetivoId="contenido-dashboard"
              negocioId={negocioIdReporte}
              titulo={tituloReporte}
              subtitulo={descripcion}
              generadoPor={nombreCompleto}
            />
          ) : undefined
        }
      />
      <main id="contenido-dashboard" className="flex-1 p-8 animate-fade-in">
        {esResumen ? (
          <PanelEjecutivo />
        ) : esAdministracion ? (
          <PanelAdministracion />
        ) : esGerencial ? (
          <PanelGerencial />
        ) : (
          <DashboardNegocio negocioId={negocio.id} operando={negocio.operando} />
        )}
      </main>
    </>
  );
}
