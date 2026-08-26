"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import {
  Trophy, Users, TrendingUp, CalendarCheck, Clock, ArrowRight,
  MessageCircle, Star, Sparkles, Filter, CheckCircle2, ChevronRight, Award,
} from "lucide-react";
import { useApp } from "@/lib/app-context";
import { NegocioId, Usuario } from "@/lib/types";
import { NEGOCIOS, getNegocio } from "@/lib/mock/negocios";
import { CLIENTES_INDIVIDUALES, CLIENTES_CORPORATIVOS, clientesIndividualesPorNegocio, corporativosPorNegocio } from "@/lib/mock/clientes";
import { RESERVAS, reservasPorNegocio } from "@/lib/mock/reservas";
import { PEDIDOS, pedidosPorNegocio } from "@/lib/mock/pedidos";
import { HOSPEDAJES } from "@/lib/mock/hospedaje";
import { useClientesCreados, useClientesCorporativosCreados, useReservasCreadas, usePedidosCreados } from "@/lib/store";
import { Card, CardHeader } from "@/components/ui/Card";
import { StatTile } from "@/components/ui/StatTile";
import { Badge } from "@/components/ui/Badge";
import { BASE_DATE } from "@/lib/mock/seed";

export type PeriodoFiltro = "semana" | "mes" | "anio" | "todo";

interface AsesorEstadistica {
  usuario: Usuario;
  negocioNombre: string;
  negocioColor: string;
  ventasTotales: number;
  reservasTotales: number;
  reservasAtendidas: number;
  pedidosEntregados: number;
  tasaConversion: number;
  clientesNaturales: number;
  clientesCorporativos: number;
  totalClientes: number;
  ticketPromedio: number;
  ultimoCliente: {
    id: string;
    nombre: string;
    tipo: "Natural" | "Corporativo";
    fechaRegistro: string;
    celular: string;
    negocioId: NegocioId;
  } | null;
}

function tiempoRelativoOFecha(fechaISO: string): string {
  try {
    const fecha = new Date(fechaISO);
    const ahora = new Date();
    const diffMs = ahora.getTime() - fecha.getTime();
    const diffMin = Math.floor(diffMs / (1000 * 60));
    const diffHoras = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDias = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMin >= 0 && diffMin < 1) return "Hace un momento";
    if (diffMin >= 1 && diffMin < 60) return `Hace ${diffMin} min`;
    if (diffHoras >= 0 && diffHoras < 24 && fecha.getDate() === ahora.getDate()) {
      return `Hoy, ${fecha.toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" })}`;
    }
    if (diffDias === 1 || (diffHoras < 48 && fecha.getDate() === ahora.getDate() - 1)) {
      return `Ayer, ${fecha.toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" })}`;
    }
    if (diffDias >= 0 && diffDias < 7) return `Hace ${diffDias} días`;
    return fecha.toLocaleDateString("es-PE", { day: "2-digit", month: "short" });
  } catch {
    return fechaISO;
  }
}

export function EstadisticasVendedores({
  negocioIdFijo,
  mostrarFiltroNegocio = false,
}: {
  negocioIdFijo?: NegocioId;
  mostrarFiltroNegocio?: boolean;
}) {
  const { usuarios, negocios, negocio } = useApp();
  const sedeActiva = negocioIdFijo ?? negocio.id;
  const [filtroSede, setFiltroSede] = useState<string>(sedeActiva === "todas" ? "todos" : sedeActiva);
  const [filtroPeriodo, setFiltroPeriodo] = useState<PeriodoFiltro>("mes");
  const [ordenPor, setOrdenPor] = useState<"ventas" | "clientes" | "conversion">("ventas");

  useEffect(() => {
    const s = negocioIdFijo ?? negocio.id;
    setFiltroSede(s === "todas" ? "todos" : s);
  }, [negocioIdFijo, negocio.id]);

  const { items: clientesCreados } = useClientesCreados();
  const { items: corpCreados } = useClientesCorporativosCreados();
  const { items: reservasCreadas } = useReservasCreadas();
  const { items: pedidosCreados } = usePedidosCreados();

  // Filtrado de asesores (cuentas de rol 'ventas' o administrativas con actividad comercial)
  const equipoComercial = useMemo(() => {
    return usuarios.filter((u) => u.rolTipo === "ventas" || u.id === "betsy");
  }, [usuarios]);

  // Consolidación de datos combinando mock y almacenamiento local
  const todosClientesInd = useMemo(() => [...CLIENTES_INDIVIDUALES, ...clientesCreados], [clientesCreados]);
  const todosClientesCorp = useMemo(() => [...CLIENTES_CORPORATIVOS, ...corpCreados], [corpCreados]);
  const todasReservas = useMemo(() => [...RESERVAS, ...reservasCreadas], [reservasCreadas]);
  const todosPedidos = useMemo(() => [...PEDIDOS, ...pedidosCreados], [pedidosCreados]);

  // Cálculo de estadísticas por cada asesor
  const estadisticas: AsesorEstadistica[] = useMemo(() => {
    return equipoComercial
      .filter((u) => filtroSede === "todos" || u.negocioId === filtroSede)
      .map((u) => {
        const neg = getNegocio(u.negocioId) ?? NEGOCIOS[0];

        // 1. Clientes registrados por este asesor
        const matchVendedor = (reg?: string) => {
          if (!reg) return false;
          const r = reg.toLowerCase();
          const n = u.nombre.toLowerCase();
          if (r === n) return true;
          if (u.id === "betsy" && r === "betsy") return true;
          if (u.id === "melisa" && r === "melisa") return true;
          if (u.id === "carla" && r.includes("carla")) return true;
          if (u.id === "valeria" && r.includes("valeria")) return true;
          return false;
        };

        const clientesInd = todosClientesInd.filter((c) => matchVendedor(c.registradoPor));
        const clientesCorp = todosClientesCorp.filter((c) => matchVendedor(c.registradoPor));

        const todosMisClientes = [
          ...clientesInd.map((c) => ({
            id: c.id,
            nombre: `${c.nombres} ${c.apellidos}`.trim(),
            tipo: "Natural" as const,
            fechaRegistro: c.fechaRegistro,
            celular: c.celular,
            negocioId: c.negocioId,
          })),
          ...clientesCorp.map((c) => ({
            id: c.id,
            nombre: c.razonSocial,
            tipo: "Corporativo" as const,
            fechaRegistro: c.fechaRegistro,
            celular: c.celular,
            negocioId: c.negocioId,
          })),
        ].sort((a, b) => new Date(b.fechaRegistro).getTime() - new Date(a.fechaRegistro).getTime());

        const ultimoCliente = todosMisClientes[0] ?? null;

        // 2. Reservas gestionadas por este asesor
        const misReservas = todasReservas.filter((r) => matchVendedor(r.registradoPor));

        const reservasAtendidas = misReservas.filter((r) => r.estado === "atendida");
        const montoReservas = reservasAtendidas.reduce((sum, r) => sum + (r.monto ?? 0), 0);

        // 3. Pedidos delivery gestionados
        const misPedidos = todosPedidos.filter((p) => matchVendedor(p.registradoPor));
        const pedidosEntregados = misPedidos.filter((p) => p.estado === "entregado");
        const montoPedidos = pedidosEntregados.reduce((sum, p) => sum + (p.monto ?? 0), 0);

        // 4. Hospedajes atendidos (Hotel Umaru)
        const montoHospedaje = u.negocioId === "umaru" ? HOSPEDAJES.slice(0, 18).reduce((sum, h) => sum + h.tarifaNoche, 0) : 0;

        const ventasTotales = montoReservas + montoPedidos + montoHospedaje;
        const totalTransaccionesConVenta = reservasAtendidas.length + pedidosEntregados.length + (u.negocioId === "umaru" ? 18 : 0);
        const ticketPromedio = totalTransaccionesConVenta > 0 ? Math.round(ventasTotales / totalTransaccionesConVenta) : 0;

        const tasaConversion = misReservas.length > 0 ? Math.round((reservasAtendidas.length / misReservas.length) * 100) : 100;

        return {
          usuario: u,
          negocioNombre: neg.nombre,
          negocioColor: neg.colorAcento,
          ventasTotales,
          reservasTotales: misReservas.length,
          reservasAtendidas: reservasAtendidas.length,
          pedidosEntregados: pedidosEntregados.length,
          tasaConversion,
          clientesNaturales: clientesInd.length,
          clientesCorporativos: clientesCorp.length,
          totalClientes: todosMisClientes.length,
          ticketPromedio,
          ultimoCliente,
        };
      });
  }, [equipoComercial, filtroSede, todosClientesInd, todosClientesCorp, todasReservas, todosPedidos]);

  // Ordenamiento interactivo
  const estadisticasOrdenadas = useMemo(() => {
    return [...estadisticas].sort((a, b) => {
      if (ordenPor === "ventas") return b.ventasTotales - a.ventasTotales;
      if (ordenPor === "clientes") return b.totalClientes - a.totalClientes;
      if (ordenPor === "conversion") return b.tasaConversion - a.tasaConversion;
      return 0;
    });
  }, [estadisticas, ordenPor]);

  // Destacados (Top Vendedor y Top Captador)
  const topVendedor = useMemo(() => {
    if (estadisticas.length === 0) return null;
    return [...estadisticas].sort((a, b) => b.ventasTotales - a.ventasTotales)[0];
  }, [estadisticas]);

  const topCaptador = useMemo(() => {
    if (estadisticas.length === 0) return null;
    return [...estadisticas].sort((a, b) => b.totalClientes - a.totalClientes)[0];
  }, [estadisticas]);

  const totalVentasGrupo = useMemo(() => {
    return estadisticas.reduce((sum, e) => sum + e.ventasTotales, 0);
  }, [estadisticas]);

  const totalClientesCaptados = useMemo(() => {
    return estadisticas.reduce((sum, e) => sum + e.totalClientes, 0);
  }, [estadisticas]);

  const maxVenta = Math.max(...estadisticas.map((e) => e.ventasTotales), 1);

  return (
    <div className="space-y-5">
      {/* Controles de Filtro y Cabecera de Estadísticas */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-sm font-bold text-[var(--color-gris)] flex items-center gap-2">
            <Trophy size={16} className="text-[var(--color-naranja)]" />
            Rendimiento del Equipo Comercial
          </h2>
          <p className="text-xs text-[var(--color-gris-medio)] mt-0.5">
            Métricas de ventas, captación de clientes y última actividad por asesor
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap no-imprimir">
          {/* Filtro por Sede */}
          {mostrarFiltroNegocio && (
            <div className="flex bg-[var(--color-crema)] rounded-xl p-1 text-xs">
              <button
                onClick={() => setFiltroSede("todos")}
                className={`px-3 py-1 rounded-lg font-semibold transition-colors ${
                  filtroSede === "todos" ? "bg-white text-[var(--color-terracota)] shadow-sm" : "text-[var(--color-gris-medio)]"
                }`}
              >
                Todas las sucursales
              </button>
              {negocios.filter((n) => n.id !== "todas").map((n) => (
                <button
                  key={n.id}
                  onClick={() => setFiltroSede(n.id)}
                  className={`px-3 py-1 rounded-lg font-semibold transition-colors ${
                    filtroSede === n.id ? "bg-white text-[var(--color-terracota)] shadow-sm" : "text-[var(--color-gris-medio)]"
                  }`}
                >
                  {n.nombre.replace("Restaurante ", "").replace("Hotel ", "")}
                </button>
              ))}
            </div>
          )}

          {/* Selector de Criterio de Orden */}
          <div className="flex bg-[var(--color-crema)] rounded-xl p-1 text-xs">
            <button
              onClick={() => setOrdenPor("ventas")}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                ordenPor === "ventas" ? "bg-white text-[var(--color-terracota)] shadow-sm" : "text-[var(--color-gris-medio)]"
              }`}
            >
              Por Ventas (S/)
            </button>
            <button
              onClick={() => setOrdenPor("clientes")}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                ordenPor === "clientes" ? "bg-white text-[var(--color-terracota)] shadow-sm" : "text-[var(--color-gris-medio)]"
              }`}
            >
              Por Clientes
            </button>
          </div>
        </div>
      </div>

      {/* Tarjetas de Resumen y Destacados */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatTile
          label="Top Vendedora"
          value={topVendedor ? topVendedor.usuario.nombre : "—"}
          icon={<Trophy size={18} />}
          tono="terracota"
          trend={topVendedor ? `S/ ${topVendedor.ventasTotales.toLocaleString("es-PE")} en ventas` : undefined}
          trendUp
        />
        <StatTile
          label="Mayor Captadora"
          value={topCaptador ? topCaptador.usuario.nombre : "—"}
          icon={<Star size={18} />}
          tono="verde"
          trend={topCaptador ? `${topCaptador.totalClientes} clientes captados` : undefined}
          trendUp
        />
        <StatTile
          label="Ventas totales equipo"
          value={`S/ ${totalVentasGrupo.toLocaleString("es-PE")}`}
          icon={<TrendingUp size={18} />}
          tono="naranja"
          trend={`${estadisticas.length} asesores activos`}
        />
        <StatTile
          label="Total clientes captados"
          value={totalClientesCaptados}
          icon={<Users size={18} />}
          tono="azul"
          trend="Cartera unificada del grupo"
        />
      </div>

      {/* Tabla / Ranking Detallado de Asesores */}
      <Card padding="p-0">
        <div className="px-5 py-4 border-b border-[var(--color-gris-claro)]/40 flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 className="font-bold text-sm text-[var(--color-gris)]">
              Ranking y Desempeño Individual de Asesores
            </h3>
            <p className="text-xs text-[var(--color-gris-medio)] mt-0.5">
              Haz clic en cualquier cliente para inspeccionar su ficha en detalle
            </p>
          </div>
          <Badge tono="gris">
            {estadisticasOrdenadas.length} asesores en evaluación
          </Badge>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[var(--color-crema)]/60 text-[var(--color-gris-medio)] uppercase font-bold text-[10px] tracking-wider border-b border-[var(--color-gris-claro)]/30">
              <tr>
                <th className="py-3 px-4">Pos / Asesor(a)</th>
                <th className="py-3 px-4">Sede Asignada</th>
                <th className="py-3 px-4 text-right">Ventas Generadas</th>
                <th className="py-3 px-4 text-center">Participación</th>
                <th className="py-3 px-4 text-center">Clientes Captados</th>
                <th className="py-3 px-4">Último Registro de Cliente</th>
                <th className="py-3 px-4 text-center">Conversión</th>
                <th className="py-3 px-4 text-right">Ticket Prom.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-gris-claro)]/20 font-medium text-[var(--color-gris)]">
              {estadisticasOrdenadas.map((e, idx) => {
                const porcentajeParticipacion = totalVentasGrupo > 0 ? Math.round((e.ventasTotales / totalVentasGrupo) * 100) : 0;
                const esPrimeroVentas = topVendedor?.usuario.id === e.usuario.id;
                const esPrimeroClientes = topCaptador?.usuario.id === e.usuario.id;

                return (
                  <tr key={e.usuario.id} className="hover:bg-[var(--color-crema)]/30 transition-colors">
                    {/* Posición y Asesor */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                          idx === 0
                            ? "bg-amber-100 text-amber-800 border border-amber-300"
                            : idx === 1
                            ? "bg-slate-100 text-slate-700 border border-slate-300"
                            : "bg-orange-50 text-orange-700 border border-orange-200"
                        }`}>
                          {idx + 1}
                        </span>

                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-[var(--color-terracota)] text-white font-bold flex items-center justify-center text-xs shrink-0">
                            {e.usuario.iniciales}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5 font-bold text-[13px] text-[var(--color-gris)]">
                              <span>{e.usuario.nombre}</span>
                              {esPrimeroVentas && (
                                <span title="Top en Ventas" className="text-amber-500">🏆</span>
                              )}
                              {esPrimeroClientes && !esPrimeroVentas && (
                                <span title="Mayor Captadora de Clientes" className="text-emerald-500">🌟</span>
                              )}
                            </div>
                            <span className="text-[11px] text-[var(--color-gris-medio)]">
                              {e.usuario.cargo.split("—")[0].trim()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Sede */}
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1.5 font-medium text-xs">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: e.negocioColor }} />
                        <span>{e.negocioNombre}</span>
                      </span>
                    </td>

                    {/* Ventas Generadas */}
                    <td className="py-3.5 px-4 text-right">
                      <span className="font-bold text-sm text-[var(--color-verde)]">
                        S/ {e.ventasTotales.toLocaleString("es-PE")}
                      </span>
                      <p className="text-[10px] text-[var(--color-gris-medio)]">
                        {e.reservasAtendidas} reservas + {e.pedidosEntregados} pedidos
                      </p>
                    </td>

                    {/* Barra de Participación */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="w-24 mx-auto">
                        <div className="flex items-center justify-between text-[10px] text-[var(--color-gris-medio)] mb-1 font-semibold">
                          <span>{porcentajeParticipacion}%</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-[var(--color-crema-oscuro)] overflow-hidden">
                          <div
                            className="h-full rounded-full bg-[var(--color-terracota)] transition-all"
                            style={{ width: `${Math.min(100, Math.max(5, (e.ventasTotales / maxVenta) * 100))}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Clientes Captados */}
                    <td className="py-3.5 px-4 text-center">
                      <span className="font-bold text-sm text-[var(--color-terracota)]">
                        {e.totalClientes}
                      </span>
                      <p className="text-[10px] text-[var(--color-gris-medio)]">
                        {e.clientesNaturales} nat. / {e.clientesCorporativos} corp.
                      </p>
                    </td>

                    {/* Cuándo fue el Último Registro de Cliente */}
                    <td className="py-3.5 px-4">
                      {e.ultimoCliente ? (
                        <div className="space-y-0.5">
                          <Link
                            href={`/clientes/${e.ultimoCliente.id}`}
                            className="font-bold text-xs text-[var(--color-gris)] hover:text-[var(--color-terracota)] hover:underline truncate block max-w-[180px]"
                          >
                            {e.ultimoCliente.nombre}
                          </Link>
                          <div className="flex items-center gap-1.5 text-[11px] text-[var(--color-terracota)] font-medium">
                            <Clock size={11} className="shrink-0" />
                            <span>{tiempoRelativoOFecha(e.ultimoCliente.fechaRegistro)}</span>
                          </div>
                        </div>
                      ) : (
                        <span className="text-[11px] text-[var(--color-gris-medio)] italic">
                          Sin registros aún
                        </span>
                      )}
                    </td>

                    {/* Tasa de Conversión */}
                    <td className="py-3.5 px-4 text-center">
                      <Badge tono={e.tasaConversion >= 80 ? "verde" : e.tasaConversion >= 60 ? "naranja" : "rojo"}>
                        {e.tasaConversion}% éxito
                      </Badge>
                    </td>

                    {/* Ticket Promedio */}
                    <td className="py-3.5 px-4 text-right">
                      <span className="font-bold text-xs text-[var(--color-gris)]">
                        S/ {e.ticketPromedio}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
