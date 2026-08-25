import { Users, CalendarCheck, Bike, Gift } from "lucide-react";
import { NegocioId } from "@/lib/types";
import { Card, CardHeader } from "@/components/ui/Card";
import { StatTile } from "@/components/ui/StatTile";
import { RingProgress } from "@/components/ui/RingProgress";
import { BarChartMensual } from "@/components/charts/BarChartMensual";
import { ActividadFeed } from "@/components/dashboard/ActividadFeed";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  clientesNuevos, reservasSemana, pedidosSemana, serieMensual, actividadReciente,
  tasaConversionReservas, ticketPromedio,
} from "@/lib/metrics";
import { proximosCumpleanos } from "@/lib/mock/seguimiento";
import { BASE_DATE } from "@/lib/mock/seed";
import { clientesIndividualesPorNegocio, corporativosPorNegocio } from "@/lib/mock/clientes";

export function DashboardNegocio({ negocioId, operando }: { negocioId: NegocioId; operando: boolean }) {
  if (!operando) {
    return (
      <Card>
        <EmptyState
          icon={<CalendarCheck size={22} />}
          title="Este negocio aún no opera"
          description="Mamina Restobar todavía no tiene fecha de apertura definida. En cuanto abra, se activa dentro de este mismo CRM — sin rediseñar nada."
        />
      </Card>
    );
  }

  const nuevos = clientesNuevos(negocioId, 30);
  const reservas = reservasSemana(negocioId);
  const pedidos = pedidosSemana(negocioId);
  const cumples = proximosCumpleanos(negocioId, BASE_DATE, 10);
  const totalClientes = clientesIndividualesPorNegocio(negocioId).length + corporativosPorNegocio(negocioId).length;
  const conversion = tasaConversionReservas(negocioId);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatTile label="Clientes totales" value={totalClientes} icon={<Users size={18} />} trend={`+${nuevos} en 30 días`} trendUp tono="terracota" />
        <StatTile label="Reservas esta semana" value={reservas.total} icon={<CalendarCheck size={18} />} tono="naranja" />
        {negocioId === "las-flores" ? (
          <StatTile label="Pedidos delivery (semana)" value={pedidos.total} icon={<Bike size={18} />} tono="azul" />
        ) : (
          <StatTile label="Ticket promedio" value={`S/ ${ticketPromedio(negocioId)}`} icon={<Bike size={18} />} tono="azul" />
        )}
        <StatTile label="Cumpleaños (próx. 10 días)" value={cumples.length} icon={<Gift size={18} />} tono="verde" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <Card className="xl:col-span-2">
          <CardHeader title="Reservas y delivery — últimos 6 meses" subtitle="Datos simulados, con la misma forma que tendría la web real" />
          <BarChartMensual data={serieMensual(negocioId)} />
        </Card>

        <Card>
          <CardHeader title="Conversión de reservas" subtitle="Atendidas vs. canceladas / no llegó" />
          <div className="flex items-center justify-center py-2">
            <RingProgress value={conversion} sublabel="conversión" />
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <Card>
          <CardHeader title="Actividad reciente" subtitle="Reservas, delivery y hospedaje registrados" />
          <ActividadFeed items={actividadReciente(negocioId, 7)} />
        </Card>

        <Card>
          <CardHeader title="Próximos cumpleaños" subtitle="En los próximos 10 días" />
          {cumples.length === 0 ? (
            <p className="text-sm text-[var(--color-gris-medio)] py-6 text-center">Nadie cumple años en los próximos 10 días.</p>
          ) : (
            <ul className="space-y-1">
              {cumples.slice(0, 6).map(({ cliente, diffDias }) => (
                <li key={cliente.id} className="flex items-center justify-between py-2.5 border-b border-[var(--color-gris-claro)]/20 last:border-0">
                  <span className="text-sm font-medium text-[var(--color-gris)]">{cliente.nombres} {cliente.apellidos}</span>
                  <span className="text-xs text-[var(--color-gris-medio)]">
                    {diffDias === 0 ? "Hoy" : diffDias === 1 ? "Mañana" : `En ${diffDias} días`}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
