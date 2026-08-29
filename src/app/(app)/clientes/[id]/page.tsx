"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Phone, MapPin, Cake } from "lucide-react";
import { Topbar } from "@/components/layout/Topbar";
import { Card } from "@/components/ui/Card";
import { buscarClienteIndividual } from "@/lib/mock/clientes";
import { ORIGEN_LABEL } from "@/lib/metrics";
import { EmptyState } from "@/components/ui/EmptyState";
import { useClientesCreados } from "@/lib/store";

export default function ClienteDetallePage(props: PageProps<"/clientes/[id]">) {
  const { id } = use(props.params);
  const router = useRouter();
  const { items: creados } = useClientesCreados();
  const cliente = buscarClienteIndividual(id) ?? creados.find((c) => c.id === id);

  if (!cliente) {
    return (
      <>
        <Topbar titulo="Cliente no encontrado" />
        <main className="flex-1 p-8">
          <EmptyState title="No encontramos este cliente" description="Puede que el enlace esté roto o el registro haya sido eliminado." />
        </main>
      </>
    );
  }

  const edad = new Date().getFullYear() - new Date(cliente.fechaNacimiento).getFullYear();

  return (
    <>
      <Topbar titulo={`${cliente.nombres} ${cliente.apellidos}`} descripcion="Ficha 360° del cliente" />
      <main className="flex-1 p-8 animate-fade-in space-y-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm text-[var(--color-gris-medio)] hover:text-[var(--color-terracota)] transition-colors"
        >
          <ArrowLeft size={15} /> Volver a clientes
        </button>

        <Card className="max-w-md mx-auto">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-12 h-12 rounded-full bg-[var(--color-terracota)] text-white flex items-center justify-center font-bold">
              {cliente.nombres[0]}{cliente.apellidos[0]}
            </div>
            <p className="font-semibold text-[var(--color-gris)]">{cliente.nombres} {cliente.apellidos}</p>
          </div>
          <dl className="space-y-3 text-sm">
            <div className="flex items-center gap-2.5 text-[var(--color-gris)]">
              <Phone size={15} className="text-[var(--color-gris-medio)]" /> {cliente.celular}
            </div>
            <div className="flex items-center gap-2.5 text-[var(--color-gris)]">
              <MapPin size={15} className="text-[var(--color-gris-medio)]" /> {cliente.distrito}, {cliente.provincia}
            </div>
            <div className="flex items-center gap-2.5 text-[var(--color-gris)]">
              <Cake size={15} className="text-[var(--color-gris-medio)]" />
              {new Date(cliente.fechaNacimiento).toLocaleDateString("es-PE", { day: "2-digit", month: "long" })} · {edad} años
            </div>
          </dl>
          <div className="mt-5 pt-4 border-t border-[var(--color-gris-claro)]/30 text-xs text-[var(--color-gris-medio)] space-y-1.5">
            <p>Registrado: {new Date(cliente.fechaRegistro).toLocaleDateString("es-PE")}</p>
            <p>Origen: {ORIGEN_LABEL[cliente.origen] ?? cliente.origen}</p>
          </div>
        </Card>
      </main>
    </>
  );
}
