"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Phone, MapPin, Cake, TrendingUp, CalendarCheck } from "lucide-react";
import { Topbar } from "@/components/layout/Topbar";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { StatTile } from "@/components/ui/StatTile";
import { buscarClienteIndividual } from "@/lib/mock/clientes";
import { reservasDeCliente } from "@/lib/mock/reservas";
import { pedidosDeCliente } from "@/lib/mock/pedidos";
import { hospedajesDeCliente } from "@/lib/mock/hospedaje";
import { resumenDeCliente, ETIQUETA_CLASIFICACION, COLOR_CLASIFICACION } from "@/lib/frecuencia";
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

  const resumen = resumenDeCliente(cliente);
  const reservas = reservasDeCliente(cliente.id);
  const pedidos = pedidosDeCliente(cliente.id);
  const hospedajes = hospedajesDeCliente(cliente.id);

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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <Card className="lg:col-span-1 h-fit">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-12 h-12 rounded-full bg-[var(--color-terracota)] text-white flex items-center justify-center font-bold">
                {cliente.nombres[0]}{cliente.apellidos[0]}
              </div>
              <div>
                <p className="font-semibold text-[var(--color-gris)]">{cliente.nombres} {cliente.apellidos}</p>
                <Badge tono={COLOR_CLASIFICACION[resumen.clasificacion]}>{ETIQUETA_CLASIFICACION[resumen.clasificacion]}</Badge>
              </div>
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
              <p className="capitalize">Origen: {cliente.origen.replace("-", " ")}</p>
            </div>
          </Card>

          <div className="lg:col-span-2 space-y-5">
            <div className="grid grid-cols-3 gap-4">
              <StatTile label="Visitas totales" value={resumen.totalVisitas} icon={<CalendarCheck size={17} />} tono="terracota" />
              <StatTile label="Gasto total" value={`S/ ${resumen.gastoTotal}`} icon={<TrendingUp size={17} />} tono="verde" />
              <StatTile
                label="Última visita"
                value={resumen.ultimaVisita ? new Date(resumen.ultimaVisita).toLocaleDateString("es-PE", { day: "2-digit", month: "short" }) : "—"}
                icon={<Cake size={17} />}
                tono="azul"
              />
            </div>

            <Card>
              <CardHeader title="Historial" subtitle="Reservas, delivery y hospedaje de este cliente" />
              {reservas.length + pedidos.length + hospedajes.length === 0 ? (
                <p className="text-sm text-[var(--color-gris-medio)] py-6 text-center">Todavía no registra actividad.</p>
              ) : (
                <ul className="space-y-1">
                  {[
                    ...reservas.map((r) => ({ key: r.id, fecha: r.fecha, texto: `Reserva · ${r.personas} personas`, extra: r.estado })),
                    ...pedidos.map((p) => ({ key: p.id, fecha: p.fecha, texto: `Delivery · ${p.productos.join(", ")}`, extra: `S/ ${p.monto}` })),
                    ...hospedajes.map((h) => ({ key: h.id, fecha: h.checkIn, texto: `Hospedaje · Hab. ${h.habitacion}`, extra: `S/ ${h.tarifaNoche}/noche` })),
                  ]
                    .sort((a, b) => (a.fecha < b.fecha ? 1 : -1))
                    .map((item) => (
                      <li key={item.key} className="flex items-center justify-between py-2.5 border-b border-[var(--color-gris-claro)]/20 last:border-0 text-sm">
                        <span className="text-[var(--color-gris)]">{item.texto}</span>
                        <span className="flex items-center gap-3 text-[var(--color-gris-medio)]">
                          <span className="text-xs">{item.extra}</span>
                          <span className="text-xs">{new Date(item.fecha).toLocaleDateString("es-PE")}</span>
                        </span>
                      </li>
                    ))}
                </ul>
              )}
            </Card>
          </div>
        </div>
      </main>
    </>
  );
}
