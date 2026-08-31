"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Phone, Mail, MapPin, Cake, IdCard, User, CheckCircle2, XCircle, Building2, Briefcase } from "lucide-react";
import { Topbar } from "@/components/layout/Topbar";
import { Card } from "@/components/ui/Card";
import { buscarClienteIndividual } from "@/lib/mock/clientes";
import { ORIGEN_LABEL } from "@/lib/metrics";
import { procedenciaDe } from "@/lib/formato";
import { EmptyState } from "@/components/ui/EmptyState";
import { useData } from "@/lib/data-context";
import { Usuario } from "@/lib/types";

export default function ClienteDetallePage(props: PageProps<"/clientes/[id]">) {
  const { id } = use(props.params);
  const router = useRouter();
  const { clientesIndividuales, clientesCorporativos, usuarios } = useData();
  const individual = buscarClienteIndividual(clientesIndividuales, id);
  // Los clientes corporativos no tenían ficha propia — el enlace desde el
  // ranking de asesores (o cualquier otro lado) apuntaba a esta misma ruta
  // para los dos tipos, así que si era una empresa, esta página nunca la
  // encontraba. Se busca acá también, como respaldo.
  const corporativo = !individual ? clientesCorporativos.find((c) => c.id === id) : undefined;

  if (!individual && !corporativo) {
    return (
      <>
        <Topbar titulo="Cliente no encontrado" />
        <main className="flex-1 p-8">
          <EmptyState title="No encontramos este cliente" description="Puede que el enlace esté roto o el registro haya sido eliminado." />
        </main>
      </>
    );
  }

  const vendedor = (c: { registradoPor?: string }) =>
    c.registradoPor ? usuarios.find((u) => u.id === c.registradoPor) : undefined;

  return individual ? (
    <FichaIndividual cliente={individual} vendedor={vendedor(individual)} onVolver={() => router.back()} />
  ) : (
    <FichaCorporativa cliente={corporativo!} vendedor={vendedor(corporativo!)} onVolver={() => router.back()} />
  );
}

function BotonVolver({ onVolver }: { onVolver: () => void }) {
  return (
    <button
      onClick={onVolver}
      className="flex items-center gap-1.5 text-sm text-[var(--color-gris-medio)] hover:text-[var(--color-terracota)] transition-colors"
    >
      <ArrowLeft size={15} /> Volver a clientes
    </button>
  );
}

function FichaIndividual({
  cliente, vendedor, onVolver,
}: {
  cliente: NonNullable<ReturnType<typeof buscarClienteIndividual>>;
  vendedor?: Usuario;
  onVolver: () => void;
}) {
  const edad = new Date().getFullYear() - new Date(cliente.fechaNacimiento).getFullYear();
  const procedencia = procedenciaDe(cliente);

  return (
    <>
      <Topbar titulo={`${cliente.nombres} ${cliente.apellidos}`} descripcion="Ficha del cliente" />
      <main className="flex-1 p-8 animate-fade-in space-y-6">
        <BotonVolver onVolver={onVolver} />

        <Card className="max-w-md mx-auto">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-12 h-12 rounded-full bg-[var(--color-terracota)] text-white flex items-center justify-center font-bold shrink-0">
              {cliente.nombres[0]}{cliente.apellidos[0]}
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-[var(--color-gris)] truncate">{cliente.nombres} {cliente.apellidos}</p>
              {cliente.genero && <p className="text-xs text-[var(--color-gris-medio)]">{cliente.genero}</p>}
            </div>
          </div>

          <dl className="space-y-3 text-sm">
            <div className="flex items-center gap-2.5 text-[var(--color-gris)]">
              <Phone size={15} className="text-[var(--color-gris-medio)] shrink-0" /> {cliente.celular}
            </div>
            {cliente.email && (
              <div className="flex items-center gap-2.5 text-[var(--color-gris)]">
                <Mail size={15} className="text-[var(--color-gris-medio)] shrink-0" /> {cliente.email}
              </div>
            )}
            {cliente.numeroDocumento && (
              <div className="flex items-center gap-2.5 text-[var(--color-gris)]">
                <IdCard size={15} className="text-[var(--color-gris-medio)] shrink-0" />
                {cliente.tipoDocumento ?? "Documento"} {cliente.numeroDocumento}
              </div>
            )}
            <div className="flex items-center gap-2.5 text-[var(--color-gris)]">
              <MapPin size={15} className="text-[var(--color-gris-medio)] shrink-0" /> {procedencia}
            </div>
            <div className="flex items-center gap-2.5 text-[var(--color-gris)]">
              <Cake size={15} className="text-[var(--color-gris-medio)] shrink-0" />
              {new Date(cliente.fechaNacimiento).toLocaleDateString("es-PE", { day: "2-digit", month: "long" })} · {edad} años
            </div>
            {vendedor && (
              <div className="flex items-center gap-2.5 text-[var(--color-gris)]">
                <User size={15} className="text-[var(--color-gris-medio)] shrink-0" /> Registrado por {vendedor.nombreReal ?? vendedor.nombre}
              </div>
            )}
            <div className="flex items-center gap-2.5 text-[var(--color-gris)]">
              {cliente.aceptaComunicaciones ? (
                <CheckCircle2 size={15} className="text-[var(--color-verde)] shrink-0" />
              ) : (
                <XCircle size={15} className="text-[var(--color-gris-medio)] shrink-0" />
              )}
              {cliente.aceptaComunicaciones ? "Acepta promociones y saludos por WhatsApp" : "No acepta promociones ni saludos por WhatsApp"}
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

function FichaCorporativa({
  cliente, vendedor, onVolver,
}: {
  cliente: { id: string; razonSocial: string; ruc: string; direccion: string; celular: string; fechaAniversario: string; nombreRepresentante: string; cargoRepresentante: string; departamento: string; provincia: string; distrito: string; fechaRegistro: string; aceptaComunicaciones?: boolean };
  vendedor?: Usuario;
  onVolver: () => void;
}) {
  const procedencia = procedenciaDe(cliente);

  return (
    <>
      <Topbar titulo={cliente.razonSocial} descripcion="Ficha del cliente corporativo" />
      <main className="flex-1 p-8 animate-fade-in space-y-6">
        <BotonVolver onVolver={onVolver} />

        <Card className="max-w-md mx-auto">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-12 h-12 rounded-full bg-[var(--color-azul)] text-white flex items-center justify-center shrink-0">
              <Building2 size={20} />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-[var(--color-gris)] truncate">{cliente.razonSocial}</p>
              <p className="text-xs text-[var(--color-gris-medio)]">RUC {cliente.ruc}</p>
            </div>
          </div>

          <dl className="space-y-3 text-sm">
            <div className="flex items-center gap-2.5 text-[var(--color-gris)]">
              <Phone size={15} className="text-[var(--color-gris-medio)] shrink-0" /> {cliente.celular}
            </div>
            <div className="flex items-center gap-2.5 text-[var(--color-gris)]">
              <User size={15} className="text-[var(--color-gris-medio)] shrink-0" /> {cliente.nombreRepresentante}
            </div>
            <div className="flex items-center gap-2.5 text-[var(--color-gris)]">
              <Briefcase size={15} className="text-[var(--color-gris-medio)] shrink-0" /> {cliente.cargoRepresentante}
            </div>
            <div className="flex items-center gap-2.5 text-[var(--color-gris)]">
              <MapPin size={15} className="text-[var(--color-gris-medio)] shrink-0" /> {cliente.direccion}
            </div>
            <div className="flex items-center gap-2.5 text-[var(--color-gris)]">
              <MapPin size={15} className="text-[var(--color-gris-medio)] shrink-0" /> {procedencia}
            </div>
            {cliente.fechaAniversario && (
              <div className="flex items-center gap-2.5 text-[var(--color-gris)]">
                <Cake size={15} className="text-[var(--color-gris-medio)] shrink-0" />
                Aniversario: {new Date(cliente.fechaAniversario).toLocaleDateString("es-PE", { day: "2-digit", month: "long" })}
              </div>
            )}
            {vendedor && (
              <div className="flex items-center gap-2.5 text-[var(--color-gris)]">
                <User size={15} className="text-[var(--color-gris-medio)] shrink-0" /> Registrado por {vendedor.nombreReal ?? vendedor.nombre}
              </div>
            )}
            <div className="flex items-center gap-2.5 text-[var(--color-gris)]">
              {cliente.aceptaComunicaciones ? (
                <CheckCircle2 size={15} className="text-[var(--color-verde)] shrink-0" />
              ) : (
                <XCircle size={15} className="text-[var(--color-gris-medio)] shrink-0" />
              )}
              {cliente.aceptaComunicaciones ? "Acepta promociones y saludos por WhatsApp" : "No acepta promociones ni saludos por WhatsApp"}
            </div>
          </dl>

          <div className="mt-5 pt-4 border-t border-[var(--color-gris-claro)]/30 text-xs text-[var(--color-gris-medio)] space-y-1.5">
            <p>Registrado: {new Date(cliente.fechaRegistro).toLocaleDateString("es-PE")}</p>
          </div>
        </Card>
      </main>
    </>
  );
}
