import { Users, Building2, Gift, MessageCircle } from "lucide-react";
import { NegocioId } from "@/lib/types";
import { Card, CardHeader } from "@/components/ui/Card";
import { StatTile } from "@/components/ui/StatTile";
import { RingProgress } from "@/components/ui/RingProgress";
import { BarChartSerie } from "@/components/charts/BarChartSerie";
import { ActividadFeed } from "@/components/dashboard/ActividadFeed";
import { EmptyState } from "@/components/ui/EmptyState";
import { clientesNuevos, actividadReciente, resumenCumpleanosMes, serieMensualMetrica } from "@/lib/metrics";
import { proximosCumpleanos } from "@/lib/mock/seguimiento";
import { BASE_DATE } from "@/lib/mock/seed";
import { clientesIndividualesPorNegocio, corporativosPorNegocio } from "@/lib/mock/clientes";

export function DashboardNegocio({ negocioId, operando }: { negocioId: NegocioId; operando: boolean }) {
  if (!operando) {
    return (
      <Card>
        <EmptyState
          icon={<Gift size={22} />}
          title="Este negocio aún no opera"
          description="Mamina Restobar todavía no tiene fecha de apertura definida. En cuanto abra, se activa dentro de este mismo CRM — sin rediseñar nada."
        />
      </Card>
    );
  }

  const nuevos = clientesNuevos(negocioId, 30);
  const cumples = proximosCumpleanos(negocioId, BASE_DATE, 10);
  const totalClientes = clientesIndividualesPorNegocio(negocioId).length + corporativosPorNegocio(negocioId).length;
  const totalCorporativos = corporativosPorNegocio(negocioId).length;
  const cumpleMes = resumenCumpleanosMes(negocioId);
  const conversionSaludos = cumpleMes.totalDelMes > 0
    ? Math.round((cumpleMes.personasQueReservaron / cumpleMes.totalDelMes) * 100)
    : 0;
  const serieClientes = serieMensualMetrica(negocioId, "clientes", 6);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatTile label="Clientes totales" value={totalClientes} icon={<Users size={18} />} trend={`+${nuevos} en 30 días`} trendUp tono="terracota" />
        <StatTile label="Clientes corporativos" value={totalCorporativos} icon={<Building2 size={18} />} tono="azul" trend={`de ${totalClientes} clientes`} />
        <StatTile label="Cumpleaños (próx. 10 días)" value={cumples.length} icon={<Gift size={18} />} tono="verde" />
        <StatTile label="Saludos de cumpleaños (mes)" value={cumpleMes.enviados} icon={<MessageCircle size={18} />} tono="naranja" trend={`de ${cumpleMes.totalDelMes} programados`} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <Card className="xl:col-span-2">
          <CardHeader title="Clientes nuevos — últimos 6 meses" subtitle="Datos simulados, con la misma forma que tendría la web real" />
          <BarChartSerie data={serieClientes} xKey="mes" series={[{ key: "valor", nombre: "Clientes nuevos", color: "#8C3A25" }]} />
        </Card>

        <Card>
          <CardHeader title="Cumpleaños que terminan en visita" subtitle="Saludos enviados vs. clientes que reservaron" />
          <div className="flex items-center justify-center py-2">
            <RingProgress value={conversionSaludos} sublabel="conversión" />
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <Card>
          <CardHeader title="Actividad reciente" subtitle="Últimos clientes registrados y hospedajes" />
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
