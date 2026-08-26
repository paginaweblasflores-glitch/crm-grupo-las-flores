"use client";

import { useState } from "react";
import { Lock, Trophy, Users, CalendarCheck, Building2, Bike } from "lucide-react";
import { useApp } from "@/lib/app-context";
import { accesoA } from "@/lib/permissions";
import { Topbar } from "@/components/layout/Topbar";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { StatTile } from "@/components/ui/StatTile";
import { EmptyState } from "@/components/ui/EmptyState";
import { NegocioId } from "@/lib/types";
import { clientesIndividualesPorNegocio, corporativosPorNegocio } from "@/lib/mock/clientes";
import { reservasPorNegocio } from "@/lib/mock/reservas";
import { pedidosPorNegocio } from "@/lib/mock/pedidos";
import {
  useClientesCreados, useClientesCorporativosCreados, useReservasCreadas, usePedidosCreados,
} from "@/lib/store";

export default function EquipoPage() {
  const { usuario, usuarios, negocios } = useApp();
  const { items: clientesCreados } = useClientesCreados();
  const { items: corpCreados } = useClientesCorporativosCreados();
  const { items: reservasCreadas } = useReservasCreadas();
  const { items: pedidosCreados } = usePedidosCreados();

  if (!usuario) return null;
  const nivel = accesoA(usuario.rolTipo, "equipo");

  if (nivel === "no") {
    return (
      <>
        <Topbar titulo="Mi Equipo" descripcion="Grupo Las Flores" />
        <main className="flex-1 p-8">
          <Card>
            <EmptyState
              icon={<Lock size={22} />}
              title="Este módulo no está disponible para tu rol"
              description="Solo Gerencial ve el detalle de actividad de su equipo."
            />
          </Card>
        </main>
      </>
    );
  }

  return (
    <EquipoContenido
      usuarios={usuarios}
      negocios={negocios}
      clientesCreados={clientesCreados}
      corpCreados={corpCreados}
      reservasCreadas={reservasCreadas}
      pedidosCreados={pedidosCreados}
    />
  );
}

interface RegistrablePor {
  negocioId: NegocioId;
  registradoPor?: string;
}

function EquipoContenido({
  usuarios, negocios, clientesCreados, corpCreados, reservasCreadas, pedidosCreados,
}: {
  usuarios: { id: string; nombre: string; cargo: string; usuario: string; rolTipo: string; negocioId: NegocioId; creadoPor?: string; iniciales: string }[];
  negocios: { id: NegocioId; nombre: string; operando: boolean }[];
  clientesCreados: RegistrablePor[];
  corpCreados: RegistrablePor[];
  reservasCreadas: RegistrablePor[];
  pedidosCreados: RegistrablePor[];
}) {
  const [filtroNegocio, setFiltroNegocio] = useState<NegocioId>(negocios[0].id);

  const equipo = usuarios.filter((u) => u.rolTipo === "ventas" && u.negocioId === filtroNegocio);
  const tieneDelivery = filtroNegocio === "las-flores";

  const individualesDelNegocio: RegistrablePor[] = [...clientesIndividualesPorNegocio(filtroNegocio), ...clientesCreados.filter((c) => c.negocioId === filtroNegocio)];
  const corporativosDelNegocio: RegistrablePor[] = [...corporativosPorNegocio(filtroNegocio), ...corpCreados.filter((c) => c.negocioId === filtroNegocio)];
  const reservasDelNegocio: RegistrablePor[] = [...reservasPorNegocio(filtroNegocio), ...reservasCreadas.filter((r) => r.negocioId === filtroNegocio)];
  const pedidosDelNegocio: RegistrablePor[] = [...pedidosPorNegocio(filtroNegocio), ...pedidosCreados.filter((p) => p.negocioId === filtroNegocio)];

  const actividad = equipo.map((u) => {
    const individuales = individualesDelNegocio.filter((c) => c.registradoPor === u.nombre).length;
    const corporativos = corporativosDelNegocio.filter((c) => c.registradoPor === u.nombre).length;
    const reservas = reservasDelNegocio.filter((r) => r.registradoPor === u.nombre).length;
    const pedidos = pedidosDelNegocio.filter((p) => p.registradoPor === u.nombre).length;
    return { usuario: u, individuales, corporativos, reservas, pedidos, total: individuales + corporativos + reservas + pedidos };
  }).sort((a, b) => b.total - a.total);

  const maxTotal = Math.max(0, ...actividad.map((a) => a.total));
  const totalEquipo = actividad.reduce((acc, a) => acc + a.total, 0);
  const totalClientesEquipo = actividad.reduce((acc, a) => acc + a.individuales + a.corporativos, 0);
  const totalGestionesEquipo = actividad.reduce((acc, a) => acc + a.reservas + a.pedidos, 0);

  return (
    <>
      <Topbar titulo="Mi Equipo" descripcion="Grupo Las Flores · detalle y comparación de actividad, negocio por negocio" />
      <main className="flex-1 p-8 animate-fade-in space-y-6">
        <div className="flex gap-1.5 flex-wrap">
          {negocios.map((n) => (
            <button
              key={n.id}
              onClick={() => setFiltroNegocio(n.id)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                filtroNegocio === n.id ? "bg-[var(--color-terracota)] text-white" : "bg-[var(--color-crema)] text-[var(--color-gris-medio)]"
              }`}
            >
              {n.nombre}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatTile label="Personas en el equipo" value={equipo.length} icon={<Users size={18} />} tono="terracota" />
          <StatTile label="Clientes registrados" value={totalClientesEquipo} icon={<Building2 size={18} />} tono="verde" trend="individuales + corporativos, este equipo" trendUp />
          <StatTile label="Reservas y pedidos gestionados" value={totalGestionesEquipo} icon={<CalendarCheck size={18} />} tono="naranja" />
        </div>

        {equipo.length === 0 ? (
          <Card>
            <p className="text-sm text-[var(--color-gris-medio)] py-8 text-center">
              Todavía no hay cuentas de Ventas para este negocio. Créalas desde el módulo Usuarios.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <Card>
              <CardHeader title="Comparativo del equipo" subtitle="Participación de cada persona en la actividad total registrada" />
              <div className="space-y-4">
                {actividad.map(({ usuario: u, total }) => {
                  const porcentaje = totalEquipo > 0 ? Math.round((total / totalEquipo) * 100) : 0;
                  const esMasActivo = maxTotal > 0 && total === maxTotal;
                  return (
                    <div key={u.id}>
                      <div className="flex items-center justify-between text-sm mb-1.5">
                        <span className="font-medium text-[var(--color-gris)] flex items-center gap-1.5">
                          {u.nombre}
                          {esMasActivo && <Trophy size={13} className="text-[var(--color-naranja)]" />}
                        </span>
                        <span className="text-[var(--color-gris-medio)]">{total} en total · {porcentaje}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-[var(--color-crema-oscuro)] overflow-hidden">
                        <div className="h-full rounded-full bg-[var(--color-terracota)] transition-all" style={{ width: `${porcentaje}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            <Card padding="p-0 pt-5">
              <div className="px-5">
                <CardHeader title="Detalle por persona" subtitle="Todo lo que cada cuenta ha gestionado en este negocio" />
              </div>
              <div className="divide-y divide-[var(--color-gris-claro)]/20">
                {actividad.map(({ usuario: u, individuales, corporativos, reservas, pedidos, total }) => (
                  <div key={u.id} className="px-5 py-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-9 h-9 rounded-full bg-[var(--color-terracota)] text-white flex items-center justify-center text-xs font-bold shrink-0">
                        {u.iniciales}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[var(--color-gris)] flex items-center gap-1.5">
                          {u.nombre}
                          {maxTotal > 0 && total === maxTotal && <Trophy size={13} className="text-[var(--color-naranja)]" />}
                        </p>
                        <p className="text-xs text-[var(--color-gris-medio)]">{u.cargo} · usuario: {u.usuario}</p>
                      </div>
                      {!u.creadoPor && <Badge tono="gris">Cuenta base</Badge>}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      <Badge tono="azul">{individuales} clientes naturales</Badge>
                      <Badge tono="verde">{corporativos} corporativos</Badge>
                      <Badge tono="naranja">{reservas} reservas</Badge>
                      {tieneDelivery && <Badge tono="gris"><Bike size={11} /> {pedidos} pedidos</Badge>}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}
      </main>
    </>
  );
}
