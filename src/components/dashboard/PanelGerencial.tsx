"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Users, Gift, PartyPopper, Building2, AlertTriangle, ArrowRight, MapPin,
  Wallet, Bike, CalendarCheck, Receipt, TrendingUp, TrendingDown, CalendarDays, CalendarX2,
} from "lucide-react";
import { useApp } from "@/lib/app-context";
import { NEGOCIOS } from "@/lib/mock/negocios";
import { clientesIndividualesPorNegocio, corporativosPorNegocio } from "@/lib/mock/clientes";
import { proximosCumpleanos } from "@/lib/mock/seguimiento";
import { reservasPorNegocio } from "@/lib/mock/reservas";
import { BASE_DATE } from "@/lib/mock/seed";
import { proximaFecha, festividadAlcanzaNegocio } from "@/lib/mock/festividades";
import {
  clientesPorNegocioTotales, resumenPeriodo, pedidosPorPeriodo, resumenHospedajePeriodo, ingresosTotalesPeriodo, ticketPromedioPeriodo,
  serieParaPeriodo, serieHospedajePorPeriodo, PERIODOS, Periodo,
  mejorYPeorMesMetrica, actividadPorDiaSemanaMetrica, mejorYPeorDiaSemanaMetrica, distribucionOrigen,
  METRICAS_ESTADISTICA, MetricaEstadistica,
} from "@/lib/metrics";
import { distribucionFrecuencia, clientesQueVolvieronEsteMes } from "@/lib/frecuencia";
import { useFestividades, useAutorizaciones } from "@/lib/store";
import { Card, CardHeader } from "@/components/ui/Card";
import { StatTile } from "@/components/ui/StatTile";
import { Badge } from "@/components/ui/Badge";
import { BarChartMensual } from "@/components/charts/BarChartMensual";
import { BarChartSerie } from "@/components/charts/BarChartSerie";
import { DonutChart } from "@/components/charts/DonutChart";

const TIPO_LABEL: Record<string, string> = { religioso: "Religioso", civico: "Cívico", comercial: "Comercial" };
const MESES_CORTO = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Set", "Oct", "Nov", "Dic"];

// Panel de Mijael (Gerencial). Orden pensado como CRM, no como reporte de
// punto de venta: primero lo accionable (autorizaciones), después el pulso
// financiero del periodo, después quiénes son sus clientes, después el
// comparativo del grupo, después la relación con el cliente (de dónde
// vienen, qué tan seguido vuelven — el corazón de un CRM), y al final los
// patrones de más largo plazo (12 meses). Todo lo de acá es del negocio
// activo (el que se elige en el Topbar) — cada negocio tiene sus propios
// datos, igual que en Clientes/Reservas/etc. Solo "Clientes por tienda" es
// deliberadamente el único cuadro que compara los 3 a la vez.
export function PanelGerencial() {
  const { negocio } = useApp();
  const [periodo, setPeriodo] = useState<Periodo>("semana");
  const [metrica, setMetrica] = useState<MetricaEstadistica>("ingresos");
  const [vistaGrafico, setVistaGrafico] = useState<"semana" | "anual">("semana");
  const { festividades, listo: listoFestividades } = useFestividades();
  const { autorizadas, listo: listoAutorizaciones } = useAutorizaciones();

  const resumen = resumenPeriodo(negocio.id, periodo);
  const ingresosTotales = ingresosTotalesPeriodo(negocio.id, periodo);
  const delivery = pedidosPorPeriodo(negocio.id, periodo);
  const hospedaje = negocio.id === "umaru" ? resumenHospedajePeriodo(periodo) : null;
  const segundaTarjeta = hospedaje
    ? { label: "Ingresos hospedaje", valor: hospedaje.ingreso, cambio: hospedaje.ingresoCambio, icon: <Building2 size={18} /> }
    : { label: "Ingresos delivery", valor: delivery.monto, cambio: delivery.montoCambio, icon: <Bike size={18} /> };
  const ticket = ticketPromedioPeriodo(negocio.id, periodo);
  // Umaru no tiene delivery — mostrar esa serie siempre en cero sería
  // engañoso, así que se reemplaza por hospedaje (lo que sí opera ahí).
  const serieBase = serieParaPeriodo(negocio.id, periodo);
  const serieHospedaje = negocio.id === "umaru" ? serieHospedajePorPeriodo(periodo) : null;
  const serie = serieHospedaje
    ? serieBase.map((p, i) => ({ mes: p.mes, reservas: p.reservas, pedidos: serieHospedaje[i]?.estadias ?? 0 }))
    : serieBase;
  const nombreSegundaSerie = negocio.id === "umaru" ? "Hospedaje" : "Delivery";
  const periodoLabel = PERIODOS.find((p) => p.value === periodo)!.label;

  const porTienda = clientesPorNegocioTotales();
  const clientesDelNegocio = clientesIndividualesPorNegocio(negocio.id).length + corporativosPorNegocio(negocio.id).length;
  const corporativosDelNegocio = corporativosPorNegocio(negocio.id).length;
  const cumpleanosDelNegocio = proximosCumpleanos(negocio.id, BASE_DATE, 30).length;

  const festividadesDelNegocio = festividades.filter((f) => festividadAlcanzaNegocio(f, negocio.id));
  const proximasFestividades = listoFestividades
    ? festividadesDelNegocio
        .map((f) => ({ f, ...proximaFecha(f.mesDia, BASE_DATE) }))
        .sort((a, b) => a.diffDias - b.diffDias)
        .slice(0, 3)
    : [];

  const pendientesAutorizacion = listoAutorizaciones
    ? reservasPorNegocio(negocio.id).filter(
        (r) => r.requiereAutorizacion && r.estado !== "cancelada" && r.estado !== "no-llego" && !autorizadas.has(r.id)
      ).length
    : 0;

  // "Mejor/peor mes y día" quedan fijos a Ingresos siempre — no hay filtro
  // para esto. Es el criterio estándar en cualquier POS/restaurante para
  // definir "mejor día de ventas" (por dinero, no por cantidad de
  // reservas/pedidos), y evita que el mismo rótulo ("mejor mes") signifique
  // algo distinto según qué pestaña esté abierta, lo que le resta confianza
  // al dato — feedback directo de Mijael, confirmado investigando prácticas
  // de dashboards y de reportes POS de restaurantes.
  const { mejor: mejorMes, peor: peorMes } = mejorYPeorMesMetrica(negocio.id, "ingresos");
  const { mejor: mejorDia, peor: peorDia } = mejorYPeorDiaSemanaMetrica(negocio.id, "ingresos");

  // El selector de métrica (Ingresos/Reservas/Delivery/Clientes nuevos) solo
  // controla la vista "Patrón por día" del gráfico de abajo — ahí sí tiene
  // sentido explorar por distintos ángulos, es un desglose de apoyo, no el
  // dato principal. Delivery solo existe en Las Flores y Hospedaje solo en
  // Umaru, mismo criterio que oculta esos módulos del menú lateral.
  const metricasDisponibles = METRICAS_ESTADISTICA.filter((m) => {
    if (m.value === "delivery") return negocio.id === "las-flores";
    if (m.value === "hospedaje") return negocio.id === "umaru";
    return true;
  });
  const metricaActiva = metricasDisponibles.find((m) => m.value === metrica) ?? metricasDisponibles[0];
  const porDiaSemana = actividadPorDiaSemanaMetrica(negocio.id, metricaActiva.value);
  const volvieron = clientesQueVolvieronEsteMes(negocio.id);
  const origenClientes = distribucionOrigen(negocio.id);
  const frecuencia = distribucionFrecuencia(negocio.id);

  return (
    <div className="space-y-6" id="reporte">
      {pendientesAutorizacion > 0 && (
        <Link
          href="/reservas"
          className="flex items-center justify-between gap-3 bg-[var(--color-naranja-claro)]/40 border border-[var(--color-naranja)]/30 rounded-2xl px-5 py-3.5 hover:bg-[var(--color-naranja-claro)]/60 transition-colors"
        >
          <span className="flex items-center gap-2.5 text-sm font-medium text-[var(--color-gris)]">
            <AlertTriangle size={16} className="text-[var(--color-naranja)]" />
            {pendientesAutorizacion} reserva{pendientesAutorizacion !== 1 ? "s" : ""} esperando tu autorización
          </span>
          <ArrowRight size={16} className="text-[var(--color-gris-medio)]" />
        </Link>
      )}

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-sm font-semibold text-[var(--color-gris)]">Pulso financiero del periodo</h2>
          <p className="text-xs text-[var(--color-gris-medio)] mt-0.5">{negocio.nombre} · vista {periodoLabel.toLowerCase()}, comparado con el periodo anterior</p>
        </div>
        <div className="flex bg-[var(--color-crema)] rounded-xl p-1 no-imprimir">
          {PERIODOS.map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriodo(p.value)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                periodo === p.value ? "bg-white text-[var(--color-terracota)] shadow-sm" : "text-[var(--color-gris-medio)] hover:text-[var(--color-gris)]"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatTile
          label="Ingresos totales"
          value={`S/ ${ingresosTotales.total.toLocaleString("es-PE")}`}
          icon={<Wallet size={18} />}
          tono="verde"
          trend={cambioTexto(ingresosTotales.cambio)}
          trendUp={(ingresosTotales.cambio ?? 0) >= 0}
        />
        <StatTile
          label={segundaTarjeta.label}
          value={`S/ ${segundaTarjeta.valor.toLocaleString("es-PE")}`}
          icon={segundaTarjeta.icon}
          tono="naranja"
          trend={cambioTexto(segundaTarjeta.cambio)}
          trendUp={(segundaTarjeta.cambio ?? 0) >= 0}
        />
        <StatTile
          label="Reservas del periodo"
          value={resumen.reservas}
          icon={<CalendarCheck size={18} />}
          tono="terracota"
          trend={cambioTexto(resumen.reservasCambio)}
          trendUp={(resumen.reservasCambio ?? 0) >= 0}
        />
        <StatTile label="Ticket promedio" value={`S/ ${ticket}`} icon={<Receipt size={18} />} tono="azul" trend={`vista ${periodoLabel.toLowerCase()}`} />
      </div>

      <div>
        <h2 className="text-sm font-semibold text-[var(--color-gris)]">Tu base de clientes</h2>
        <p className="text-xs text-[var(--color-gris-medio)] mt-0.5">{negocio.nombre}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatTile label="Clientes totales" value={clientesDelNegocio} icon={<Users size={18} />} tono="terracota" trend={negocio.nombre} />
        <StatTile label="Clientes corporativos" value={corporativosDelNegocio} icon={<Building2 size={18} />} tono="azul" trend={`de ${clientesDelNegocio} clientes`} />
        <StatTile label="Próximos cumpleaños" value={cumpleanosDelNegocio} icon={<Gift size={18} />} tono="verde" trend="en los próximos 30 días" />
        <StatTile label="Días festivos" value={festividadesDelNegocio.length} icon={<PartyPopper size={18} />} tono="naranja" trend="aplican a este negocio" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card>
          <CardHeader title="Clientes por tienda" subtitle="A diferencia de las demás tarjetas de este panel, aquí siempre se ven los 3 negocios juntos" />
          <div className="space-y-4">
            {porTienda.map(({ negocio: n, clientes, porcentaje }) => (
              <div key={n.id}>
                <div className="flex items-center justify-between text-sm mb-1.5">
                  <span className="font-medium text-[var(--color-gris)] flex items-center gap-1.5">
                    {n.nombre}
                    {n.id === negocio.id && (
                      <Badge tono="terracota"><MapPin size={10} /> Activo</Badge>
                    )}
                  </span>
                  <span className="text-[var(--color-gris-medio)]">{clientes} clientes · {porcentaje}%</span>
                </div>
                <div className="h-2 rounded-full bg-[var(--color-crema-oscuro)] overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${porcentaje}%`, backgroundColor: n.colorAcento }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader
            title="Próximas festividades"
            action={
              <Link href="/dias-festivos" className="flex items-center gap-1 text-xs font-semibold text-[var(--color-terracota)] hover:underline">
                Ver todas <ArrowRight size={12} />
              </Link>
            }
          />
          <div className="space-y-2.5">
            {proximasFestividades.length === 0 && (
              <p className="text-sm text-[var(--color-gris-medio)] py-4 text-center">Sin festividades registradas.</p>
            )}
            {proximasFestividades.map(({ f, fecha, diffDias }) => (
              <div key={f.id} className="flex items-center gap-3 rounded-xl border border-[var(--color-gris-claro)]/30 p-3">
                <div className="w-12 h-12 rounded-lg bg-[var(--color-crema)] flex flex-col items-center justify-center shrink-0">
                  <span className="text-[9px] font-bold uppercase text-[var(--color-terracota)]">{MESES_CORTO[fecha.getMonth()]}</span>
                  <span className="text-sm font-bold text-[var(--color-gris)] leading-none">{fecha.getDate()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--color-gris)] truncate">{f.nombre}</p>
                  <p className="text-xs text-[var(--color-gris-medio)]">
                    {TIPO_LABEL[f.tipo]} · {f.alcance === "todas" ? "Todas" : f.alcance.map((id) => NEGOCIOS.find((n) => n.id === id)?.nombre ?? id).join(", ")}
                  </p>
                </div>
                <Badge tono={diffDias <= 7 ? "naranja" : "gris"}>{diffDias === 0 ? "Hoy" : `En ${diffDias} días`}</Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-[var(--color-gris)]">Relación con el cliente</h2>
        <p className="text-xs text-[var(--color-gris-medio)] mt-0.5">{negocio.nombre} · de dónde vienen y qué tan seguido vuelven</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card>
          <CardHeader title="De dónde vienen los clientes" subtitle={negocio.nombre} />
          <DonutChart data={origenClientes} />
        </Card>
        <Card>
          <CardHeader
            title="Qué tan seguido vuelven"
            subtitle={negocio.nombre}
            action={<Badge tono="azul">{volvieron} volvieron este mes</Badge>}
          />
          <DonutChart data={frecuencia} />
        </Card>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-[var(--color-gris)]">Mejores y peores momentos</h2>
        <p className="text-xs text-[var(--color-gris-medio)] mt-0.5">{negocio.nombre} · por ingresos, últimos 12 meses</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatTile
          label="Mejor mes"
          value={mejorMes ? mejorMes.etiqueta : "—"}
          icon={<TrendingUp size={18} />}
          tono="verde"
          trend={mejorMes ? `S/ ${mejorMes.valor.toLocaleString("es-PE")}` : "sin datos todavía"}
          trendUp
        />
        <StatTile
          label="Mes más flojo"
          value={peorMes ? peorMes.etiqueta : "—"}
          icon={<TrendingDown size={18} />}
          tono="naranja"
          trend={peorMes ? `S/ ${peorMes.valor.toLocaleString("es-PE")}` : "sin datos todavía"}
          trendUp={false}
        />
        <StatTile
          label="Mejor día de la semana"
          value={mejorDia ? mejorDia.dia : "—"}
          icon={<CalendarDays size={18} />}
          tono="terracota"
          trend={mejorDia ? `S/ ${mejorDia.valor.toLocaleString("es-PE")} en 12 meses` : "sin datos todavía"}
          trendUp
        />
        <StatTile
          label="Día más flojo"
          value={peorDia ? peorDia.dia : "—"}
          icon={<CalendarX2 size={18} />}
          tono="azul"
          trend={peorDia ? `S/ ${peorDia.valor.toLocaleString("es-PE")} en 12 meses` : "sin datos todavía"}
          trendUp={false}
        />
      </div>

      <Card>
        <CardHeader
          title={vistaGrafico === "semana" ? `Reservas y ${nombreSegundaSerie.toLowerCase()}` : `${metricaActiva.label} por día de la semana`}
          subtitle={
            vistaGrafico === "semana"
              ? `Vista ${periodoLabel.toLowerCase()} · ${negocio.nombre}`
              : "Últimos 12 meses — incluye los días flojos, no solo los buenos"
          }
        />
        <div className="flex items-center justify-between flex-wrap gap-2 mb-4 no-imprimir">
          <div className="flex bg-[var(--color-crema)] rounded-xl p-1">
            <button
              onClick={() => setVistaGrafico("semana")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                vistaGrafico === "semana" ? "bg-white text-[var(--color-terracota)] shadow-sm" : "text-[var(--color-gris-medio)] hover:text-[var(--color-gris)]"
              }`}
            >
              Esta semana
            </button>
            <button
              onClick={() => setVistaGrafico("anual")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                vistaGrafico === "anual" ? "bg-white text-[var(--color-terracota)] shadow-sm" : "text-[var(--color-gris-medio)] hover:text-[var(--color-gris)]"
              }`}
            >
              Patrón por día (12 meses)
            </button>
          </div>
          {vistaGrafico === "anual" && (
            <div className="flex bg-[var(--color-crema)] rounded-xl p-1 flex-wrap">
              {metricasDisponibles.map((m) => (
                <button
                  key={m.value}
                  onClick={() => setMetrica(m.value)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    metricaActiva.value === m.value ? "bg-white text-[var(--color-terracota)] shadow-sm" : "text-[var(--color-gris-medio)] hover:text-[var(--color-gris)]"
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          )}
        </div>
        {vistaGrafico === "semana" ? (
          <BarChartMensual data={serie} nombreSegunda={nombreSegundaSerie} />
        ) : (
          <BarChartSerie data={porDiaSemana} xKey="dia" series={[{ key: "valor", nombre: metricaActiva.label, color: "#8C3A25" }]} />
        )}
      </Card>
    </div>
  );
}

function cambioTexto(valor: number | null): string | undefined {
  if (valor === null) return undefined;
  return `${valor >= 0 ? "+" : ""}${valor}% vs. periodo anterior`;
}
