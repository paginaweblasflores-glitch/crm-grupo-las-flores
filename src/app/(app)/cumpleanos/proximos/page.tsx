"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Gift, MessageCircle } from "lucide-react";
import { useApp } from "@/lib/app-context";
import { useData } from "@/lib/data-context";
import { Topbar } from "@/components/layout/Topbar";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Paginador } from "@/components/ui/Paginador";
import { pendientesDeSaludarDe } from "@/lib/seguimiento-helpers";

// Lista completa de "Próximos cumpleaños" (hoy o en los próximos 10 días,
// sin saludar todavía) — separada de la página principal de Cumpleaños
// porque con miles de clientes reales esta lista puede tener decenas o
// cientos de pendientes; mostrarlos todos en la misma página empujaba
// "Seguimiento" muy abajo. Acá vive la lista completa, paginada; la página
// principal solo muestra un adelanto con un link para venir acá.
const POR_PAGINA = 24;

export default function ProximosCumpleanosPage() {
  const { usuario, negocio } = useApp();
  const router = useRouter();
  const { clientesIndividuales, seguimientos: seguimientosReales, listo: datosListos } = useData();

  const fueraDeAlcance = negocio.id === "todas";
  useEffect(() => {
    if (fueraDeAlcance) router.replace("/dashboard");
  }, [fueraDeAlcance, router]);

  if (!usuario || fueraDeAlcance || !datosListos) return null;

  if (!negocio.operando) {
    return (
      <>
        <Topbar titulo="Próximos cumpleaños" descripcion={negocio.nombre} />
        <main className="flex-1 p-8">
          <Card><EmptyState icon={<Gift size={22} />} title="Este negocio aún no opera" description="Mamina Restobar todavía no tiene clientes registrados." /></Card>
        </main>
      </>
    );
  }

  return (
    <ProximosContenido
      clientesIndividuales={clientesIndividuales}
      seguimientosReales={seguimientosReales}
      negocioId={negocio.id}
      negocioNombre={negocio.nombre}
    />
  );
}

function ProximosContenido({
  clientesIndividuales, seguimientosReales, negocioId, negocioNombre,
}: {
  clientesIndividuales: Parameters<typeof pendientesDeSaludarDe>[0];
  seguimientosReales: Parameters<typeof pendientesDeSaludarDe>[1];
  negocioId: Parameters<typeof pendientesDeSaludarDe>[2];
  negocioNombre: string;
}) {
  const pendientes = pendientesDeSaludarDe(clientesIndividuales, seguimientosReales, negocioId);

  const [pagina, setPagina] = useState(1);
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    setPagina(1);
  }, [negocioId]);
  /* eslint-enable react-hooks/set-state-in-effect */
  const totalPaginas = Math.max(1, Math.ceil(pendientes.length / POR_PAGINA));
  const paginaSegura = Math.min(pagina, totalPaginas);
  const inicio = (paginaSegura - 1) * POR_PAGINA;
  const pendientesPagina = pendientes.slice(inicio, inicio + POR_PAGINA);

  return (
    <>
      <Topbar titulo="Próximos cumpleaños" descripcion={`${negocioNombre} · hoy o en los próximos 10 días, sin saludar todavía`} />
      <main className="flex-1 p-8 animate-fade-in space-y-5">
        <Link
          href="/cumpleanos"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--color-terracota)] hover:underline"
        >
          <ArrowLeft size={13} /> Volver a Cumpleaños
        </Link>

        <Card>
          <CardHeader title={`${pendientes.length} pendientes`} subtitle="Abre el chat para saludar sin salir del sistema — mismo lugar donde queda registrada la conversación" />
          {pendientes.length === 0 ? (
            <p className="text-sm text-[var(--color-gris-medio)] py-6 text-center">
              Ya se les mandó el saludo a todos los que cumplen años en los próximos 10 días.
            </p>
          ) : (
            <>
              <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
                {pendientesPagina.map(({ cliente, diffDias }) => (
                  <div key={cliente.id} className="rounded-xl border border-[var(--color-gris-claro)]/40 p-4">
                    <div className="flex items-start justify-between mb-2">
                      <p className="font-medium text-sm text-[var(--color-gris)]">{cliente.nombres} {cliente.apellidos}</p>
                      <Badge tono={diffDias === 0 ? "terracota" : "gris"}>{diffDias === 0 ? "Hoy" : `En ${diffDias} días`}</Badge>
                    </div>
                    <p className="text-xs text-[var(--color-gris-medio)] mb-3">{cliente.celular}</p>
                    <Link
                      href={`/mensajeria?cliente=${cliente.id}`}
                      className="flex items-center justify-center gap-1.5 text-xs font-semibold bg-[var(--color-verde)] text-white rounded-lg py-2 hover:opacity-90 transition-opacity"
                    >
                      <MessageCircle size={13} /> Abrir chat
                    </Link>
                  </div>
                ))}
              </div>
              <p className="text-center text-xs text-[var(--color-gris-medio)] pt-4">
                Mostrando {inicio + 1}–{Math.min(inicio + POR_PAGINA, pendientes.length)} de {pendientes.length}
              </p>
              <Paginador pagina={paginaSegura} totalPaginas={totalPaginas} onCambiar={setPagina} />
            </>
          )}
        </Card>
      </main>
    </>
  );
}
