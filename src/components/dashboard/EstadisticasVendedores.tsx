"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Trophy } from "lucide-react";
import { useApp } from "@/lib/app-context";
import { useData } from "@/lib/data-context";
import { NegocioId, Usuario } from "@/lib/types";
import { NEGOCIOS, getNegocio } from "@/lib/mock/negocios";
import { BASE_DATE } from "@/lib/mock/seed";
import { rangoPeriodo, rangoDelPeriodo, Periodo } from "@/lib/metrics";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { BarChartSerie } from "@/components/charts/BarChartSerie";
import { procedenciaDe } from "@/lib/formato";

interface ClienteRegistrado {
  id: string;
  nombre: string;
  tipo: "Natural" | "Corporativo";
  fechaRegistro: string;
  creadoEn?: string;
  celular: string;
  negocioId: NegocioId;
  departamento: string;
  provincia: string;
  distrito: string;
}

const MESES_LABEL = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Set", "Oct", "Nov", "Dic"];

// Colores del gráfico Anual "por negocio" — a pedido, distintos de los
// colorAcento de marca que usa el resto del sistema (esos son para
// identificar cada sede en tarjetas/badges; acá se pidieron específicos
// para que las 3 barras se distingan bien una de otra en un mismo gráfico).
const COLOR_ANUAL_POR_NEGOCIO: Record<string, string> = {
  "las-flores": "#3E6B4F", // verde
  umaru: "#8B5E34",        // marrón
  mamina: "#2C2420",       // oscuro
};

interface AsesorEstadistica {
  usuario: Usuario;
  negocioNombre: string;
  negocioColor: string;
  clientesNaturales: number;
  clientesCorporativos: number;
  totalClientes: number;
  todosMisClientes: ClienteRegistrado[];
  ultimoCliente: ClienteRegistrado | null;
}

export function EstadisticasVendedores({
  negocioIdFijo,
  periodo,
}: {
  negocioIdFijo?: NegocioId;
  // La sede siempre viene del selector del Topbar (o de `negocioIdFijo` si
  // el padre fija una sede fija) — nunca de un filtro propio de este
  // componente: cada sede, y "Todas las sucursales", ya tiene su lugar ahí,
  // uno solo para toda la página. El periodo tampoco tiene filtro propio:
  // siempre lo controla el padre con el mismo selector Diario/Semanal/
  // Mensual/Anual de Panel Principal — un único filtro de periodo, igual en
  // toda la app, no una variante local "Este mes/Este año/Todo".
  periodo: Periodo;
}) {
  const { usuarios, negocio } = useApp();
  const { clientesIndividuales, clientesCorporativos } = useData();
  const sedeActiva = negocioIdFijo ?? negocio.id;
  const [filtroSede, setFiltroSede] = useState<string>(sedeActiva === "todas" ? "todos" : sedeActiva);

  // Ajusta filtroSede cuando cambia la sede activa (negocioIdFijo o el
  // negocio del Topbar) sin usar un efecto — llamar setState dentro de un
  // useEffect dispara un render en cascada; el patrón que recomienda React
  // es comparar durante el render mismo y ajustar ahí si detecta el cambio.
  const [sedePrevia, setSedePrevia] = useState(sedeActiva);
  if (sedeActiva !== sedePrevia) {
    setSedePrevia(sedeActiva);
    setFiltroSede(sedeActiva === "todas" ? "todos" : sedeActiva);
  }

  // Filtrado de asesores (cuentas de rol 'ventas')
  const equipoComercial = useMemo(() => {
    return usuarios.filter((u) => u.rolTipo === "ventas");
  }, [usuarios]);

  // Consolidación de datos combinando mock y almacenamiento local, filtrados
  // por el periodo elegido (por fecha de registro) — mismo rango de
  // calendario real que el resto del panel (rangoPeriodo en metrics.ts).
  const enPeriodo = (fechaRegistro: string) => {
    const { desde, hasta } = rangoPeriodo(periodo);
    return fechaRegistro >= desde && fechaRegistro <= hasta;
  };
  const todosClientesInd = useMemo(
    () => clientesIndividuales.filter((c) => enPeriodo(c.fechaRegistro)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [periodo, clientesIndividuales]
  );
  const todosClientesCorp = useMemo(
    () => clientesCorporativos.filter((c) => enPeriodo(c.fechaRegistro)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [periodo, clientesCorporativos]
  );

  // Cálculo de estadísticas por cada asesor — enfoque 100% CRM: captación de
  // clientes, sin cifras de ventas en soles (ver decisión de Mijael al
  // eliminar Reservas/Delivery del sistema).
  const estadisticas: AsesorEstadistica[] = useMemo(() => {
    return equipoComercial
      .filter((u) => filtroSede === "todos" || u.negocioId === filtroSede)
      .map((u) => {
        const neg = getNegocio(u.negocioId) ?? NEGOCIOS[0];

        // `registradoPor` guarda el id estable de la cuenta, no su nombre
        // visible — renombrar una cuenta desde Usuarios no rompe esto.
        const matchVendedor = (reg?: string) => reg === u.id;

        const clientesInd = todosClientesInd.filter((c) => matchVendedor(c.registradoPor));
        const clientesCorp = todosClientesCorp.filter((c) => matchVendedor(c.registradoPor));

        const todosMisClientes = [
          ...clientesInd.map((c) => ({
            id: c.id,
            nombre: `${c.nombres} ${c.apellidos}`.trim(),
            tipo: "Natural" as const,
            fechaRegistro: c.fechaRegistro,
            creadoEn: c.creadoEn,
            celular: c.celular,
            negocioId: c.negocioId,
            departamento: c.departamento, provincia: c.provincia, distrito: c.distrito,
          })),
          ...clientesCorp.map((c) => ({
            id: c.id,
            nombre: c.razonSocial,
            tipo: "Corporativo" as const,
            fechaRegistro: c.fechaRegistro,
            creadoEn: c.creadoEn,
            celular: c.celular,
            negocioId: c.negocioId,
            departamento: c.departamento, provincia: c.provincia, distrito: c.distrito,
          })),
        ].sort((a, b) => new Date(b.creadoEn ?? b.fechaRegistro).getTime() - new Date(a.creadoEn ?? a.fechaRegistro).getTime());

        const ultimoCliente = todosMisClientes[0] ?? null;

        return {
          usuario: u,
          negocioNombre: neg.nombre,
          negocioColor: neg.colorAcento,
          clientesNaturales: clientesInd.length,
          clientesCorporativos: clientesCorp.length,
          totalClientes: todosMisClientes.length,
          todosMisClientes,
          ultimoCliente,
        };
      });
  }, [equipoComercial, filtroSede, todosClientesInd, todosClientesCorp]);

  // Ordenamiento único: por clientes captados (ya no hay cifra de ventas que
  // ordenar aparte, así que no hace falta un selector de criterio).
  const estadisticasOrdenadas = useMemo(() => {
    return [...estadisticas].sort((a, b) => b.totalClientes - a.totalClientes);
  }, [estadisticas]);

  // Destacada (Mayor Captadora)
  const topCaptador = useMemo(() => {
    if (estadisticas.length === 0) return null;
    return estadisticasOrdenadas[0];
  }, [estadisticas, estadisticasOrdenadas]);

  const totalClientesCaptados = useMemo(() => {
    return estadisticas.reduce((sum, e) => sum + e.totalClientes, 0);
  }, [estadisticas]);

  const maxClientes = Math.max(...estadisticas.map((e) => e.totalClientes), 1);

  // Vista Anual, viendo "todas las sucursales" a la vez: en vez de un solo
  // total del año por asesor (que ya se ve en la tabla de arriba), acá se
  // desglosa mes a mes — enero a mes actual — con una serie POR NEGOCIO
  // (no por individual/corporativo, esa vista es la del gráfico de
  // Mensual). Cuenta TODOS los clientes de ese negocio ese mes, sin
  // importar qué cuenta puntual los registró — así sigue siendo correcto
  // aunque un negocio llegue a tener más de un vendedor en el futuro.
  const negociosOperando = NEGOCIOS.filter((n) => n.operando);
  const desempenoMensualPorNegocio = useMemo(() => {
    if (periodo !== "anio" || filtroSede !== "todos") return [];
    const anioActual = BASE_DATE.getFullYear();
    const mesActual = BASE_DATE.getMonth();
    const contarMes = (arr: { fechaRegistro: string; negocioId: NegocioId }[], negocioId: NegocioId, mes: number) =>
      arr.filter((c) => {
        const f = new Date(c.fechaRegistro);
        return c.negocioId === negocioId && f.getMonth() === mes && f.getFullYear() === anioActual;
      }).length;
    const filas: Record<string, string | number>[] = [];
    for (let mes = 0; mes <= mesActual; mes++) {
      const fila: Record<string, string | number> = { mes: MESES_LABEL[mes] };
      for (const neg of negociosOperando) {
        fila[neg.id] = contarMes(clientesIndividuales, neg.id, mes) + contarMes(clientesCorporativos, neg.id, mes);
      }
      filas.push(fila);
    }
    return filas;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [periodo, filtroSede, clientesIndividuales, clientesCorporativos]);

  // Historial completo de un asesor (todos los clientes que registró, no
  // solo el último) — se abre al hacer clic en su fila. Respeta el mismo
  // periodo activo que el resto de la tabla, para que el modal nunca
  // muestre un número distinto al que dice la fila que lo abrió.
  const [asesorHistorial, setAsesorHistorial] = useState<AsesorEstadistica | null>(null);

  return (
    <div className="space-y-5">
      {/* La sede y el periodo ya no tienen filtro propio acá — los controla
          el selector del Topbar y el selector de periodo del padre (el
          mismo Diario/Semanal/Mensual/Anual de Panel Principal), uno solo
          para toda la página. */}
      <div>
        <h2 className="text-sm font-bold text-[var(--color-gris)] flex items-center gap-2">
          <Trophy size={16} className="text-[var(--color-naranja)]" />
          Rendimiento del Equipo Comercial
        </h2>
        <p className="text-xs text-[var(--color-gris-medio)] mt-0.5">
          Captación de clientes y última actividad por asesor · {rangoDelPeriodo(periodo)}
        </p>
      </div>

      {/* Las 2 tarjetas de resumen que había acá (Mayor Captadora / Total
          clientes captados) se quitaron por redundantes — la tabla de abajo
          ya muestra al líder (fila 1, con 🌟) y "X asesores en evaluación"
          en su propio encabezado; el total ya no hacía falta como tarjeta
          aparte. */}
      <Card padding="p-0">
        <div className="px-5 py-4 border-b border-[var(--color-gris-claro)]/40 flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 className="font-bold text-sm text-[var(--color-gris)]">
              Ranking y Desempeño Individual de Asesores
            </h3>
            <p className="text-xs text-[var(--color-gris-medio)] mt-0.5">
              Haz clic en un asesor para ver su historial completo, o en un cliente para ir directo a su ficha
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
                <th className="py-3 px-4 text-center">Clientes Captados</th>
                <th className="py-3 px-4 text-center">Participación</th>
                <th className="py-3 px-4">Registro</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-gris-claro)]/20 font-medium text-[var(--color-gris)]">
              {estadisticasOrdenadas.map((e, idx) => {
                const porcentajeParticipacion = totalClientesCaptados > 0 ? Math.round((e.totalClientes / totalClientesCaptados) * 100) : 0;
                const esPrimeroClientes = topCaptador?.usuario.id === e.usuario.id;

                return (
                  <tr
                    key={e.usuario.id}
                    onClick={() => setAsesorHistorial(e)}
                    className="hover:bg-[var(--color-crema)]/30 transition-colors cursor-pointer"
                  >
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
                              {esPrimeroClientes && (
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

                    {/* Clientes Captados */}
                    <td className="py-3.5 px-4 text-center">
                      <span className="font-bold text-sm text-[var(--color-terracota)]">
                        {e.totalClientes}
                      </span>
                      <p className="text-[10px] text-[var(--color-gris-medio)]">
                        {e.clientesNaturales} nat. / {e.clientesCorporativos} corp.
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
                            style={{ width: `${Math.min(100, Math.max(5, (e.totalClientes / maxClientes) * 100))}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Registro — enlace directo a la lista completa de clientes
                        de este asesor (mismo modal que abre la fila entera,
                        pero como acción explícita acá) */}
                    <td className="py-3.5 px-4">
                      {e.ultimoCliente ? (
                        <button
                          onClick={(ev) => { ev.stopPropagation(); setAsesorHistorial(e); }}
                          className="text-xs font-semibold text-[var(--color-terracota)] hover:underline"
                        >
                          Clientes Registrados
                        </button>
                      ) : (
                        <span className="text-[11px] text-[var(--color-gris-medio)] italic">
                          Sin registros aún
                        </span>
                      )}
                    </td>

                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Un día/semana es muy poca muestra para un gráfico comparativo con
          sentido (mismo criterio que ya usa el resto del sistema) — solo
          se arma en Mensual/Anual. En Anual, viendo "todas las sucursales",
          el gráfico cambia: en vez de un solo total del año por asesor
          (individuales/corporativos, que ya no dice mucho sobre 12 meses
          de una sola vez), muestra el desglose mes a mes con una barra por
          NEGOCIO — así se ve la tendencia real del año, no solo un total
          plano. Fuera de ese caso (Mensual, o Anual pero viendo una sola
          sede), se queda con el comparativo por asesor de siempre. */}
      {periodo === "anio" && filtroSede === "todos" && desempenoMensualPorNegocio.length > 0 ? (
        <Card>
          <CardHeader title="Desempeño mensual por negocio" subtitle={`Clientes captados por mes · ${rangoDelPeriodo(periodo)}`} />
          <BarChartSerie
            data={desempenoMensualPorNegocio}
            xKey="mes"
            series={negociosOperando.map((n) => ({
              key: n.id,
              nombre: n.nombre,
              color: COLOR_ANUAL_POR_NEGOCIO[n.id] ?? n.colorAcento,
            }))}
          />
        </Card>
      ) : (periodo === "mes" || periodo === "anio") && estadisticasOrdenadas.length > 0 && (
        <Card>
          <CardHeader title="Comparativo de rendimiento" subtitle={`Clientes captados por asesor · ${rangoDelPeriodo(periodo)}`} />
          <BarChartSerie
            data={estadisticasOrdenadas.map((e) => ({
              // Lo que se evalúa acá es el rendimiento del VENDEDOR de cada
              // sede — "Vendedor Las Flores/Umaru/Mamina", no el nombre de
              // la cuenta tal cual (que dice "Ventas ...", pensado para el
              // login, no para leerse en un eje de gráfico).
              asesor: e.usuario.nombre.replace("Ventas ", "Vendedor "),
              individuales: e.clientesNaturales,
              corporativos: e.clientesCorporativos,
            }))}
            xKey="asesor"
            series={[
              { key: "individuales", nombre: "Individuales", color: "#8C3A25" },
              { key: "corporativos", nombre: "Corporativos", color: "#5C7C8C" },
            ]}
          />
        </Card>
      )}

      {asesorHistorial && (
        <Modal
          titulo={`Historial de ${asesorHistorial.usuario.nombre}`}
          subtitulo={`${asesorHistorial.negocioNombre} · ${asesorHistorial.totalClientes} clientes registrados · ${rangoDelPeriodo(periodo)}`}
          onCerrar={() => setAsesorHistorial(null)}
        >
          {asesorHistorial.todosMisClientes.length === 0 ? (
            <p className="text-sm text-[var(--color-gris-medio)] py-8 text-center px-5">
              Sin clientes registrados en este periodo.
            </p>
          ) : (
            <ul className="divide-y divide-[var(--color-gris-claro)]/20">
              {asesorHistorial.todosMisClientes.map((c) => (
                <li key={c.id} className="flex items-center justify-between gap-3 px-5 py-3">
                  <div className="min-w-0">
                    <Link
                      href={`/clientes/${c.id}`}
                      onClick={() => setAsesorHistorial(null)}
                      className="font-semibold text-sm text-[var(--color-gris)] hover:text-[var(--color-terracota)] hover:underline truncate block"
                    >
                      {c.nombre}
                    </Link>
                    <p className="text-xs text-[var(--color-gris-medio)]">{c.celular}</p>
                    <p className="text-[11px] text-[var(--color-gris-medio)] truncate">{procedenciaDe(c)}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <Badge tono={c.tipo === "Corporativo" ? "verde" : "azul"}>{c.tipo}</Badge>
                    <p className="text-[11px] text-[var(--color-gris-medio)] mt-1">
                      {new Date(c.fechaRegistro).toLocaleDateString("es-PE", { day: "2-digit", month: "short" })}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Modal>
      )}
    </div>
  );
}
