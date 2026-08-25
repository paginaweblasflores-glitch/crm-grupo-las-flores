"use client";

import dynamic from "next/dynamic";
import { useApp } from "@/lib/app-context";
import { accesoA } from "@/lib/permissions";
import { Topbar } from "@/components/layout/Topbar";

// Cada rol solo ve uno de los dos — cargarlos perezosamente evita que el otro
// (con sus gráficos de recharts) se descargue y parsee sin usarse.
const DashboardNegocio = dynamic(() => import("@/components/dashboard/DashboardNegocio").then((m) => m.DashboardNegocio), { ssr: false });
const DashboardEjecutivo = dynamic(() => import("@/components/dashboard/DashboardEjecutivo").then((m) => m.DashboardEjecutivo), { ssr: false });

export default function DashboardPage() {
  const { usuario, negocio } = useApp();
  if (!usuario) return null;

  const esResumen = accesoA(usuario.rolTipo, "dashboard") === "resumen";

  return (
    <>
      <Topbar
        titulo={`Hola, ${usuario.nombre.split(" ")[0]}`}
        descripcion={esResumen ? "Vista ejecutiva de los tres negocios" : `Tablero de ${negocio.nombre}`}
      />
      <main className="flex-1 p-8 animate-fade-in">
        {esResumen ? <DashboardEjecutivo /> : <DashboardNegocio negocioId={negocio.id} operando={negocio.operando} />}
      </main>
    </>
  );
}
