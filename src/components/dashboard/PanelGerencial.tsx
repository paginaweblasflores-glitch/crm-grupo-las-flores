"use client";

import Link from "next/link";
import { useState, useMemo } from "react";
import {
  Users, Gift, Building2, ArrowRight, MapPin,
  UserPlus, Clock, MessageCircle, User, Percent,
} from "lucide-react";
import { useApp } from "@/lib/app-context";
import { useData } from "@/lib/data-context";
import { NEGOCIOS, getNegocio } from "@/lib/mock/negocios";
import { clientesIndividualesPorNegocio, corporativosPorNegocio } from "@/lib/mock/clientes";
import { proximosCumpleanosDe } from "@/lib/seguimiento-helpers";
import { BASE_DATE } from "@/lib/mock/seed";
import {
  clientesPorTipoPeriodo, serieClientesPorPeriodo,
  PERIODOS, Periodo, rangoDelPeriodo, etiquetaPeriodoAnterior,
  distribucionOrigen, origenWebPorNegocio, ORIGEN_LABEL,
  resumenCumpleanosMes, resumenCumpleanosPeriodo, historialFidelizacionGrupo,
} from "@/lib/metrics";
import { Card, CardHeader } from "@/components/ui/Card";
import { StatTile } from "@/components/ui/StatTile";
import { Badge } from "@/components/ui/Badge";
import { BarChartSerie } from "@/components/charts/BarChartSerie";
import { DonutChart } from "@/components/charts/DonutChart";
import { EstadisticasVendedores } from "@/components/dashboard/EstadisticasVendedores";
import { ComparativoCrecimientoPorNegocio, ComparativoFidelizacionPorNegocio } from "@/components/dashboard/ComparativosNegocio";
import { tiempoRelativoOFecha, procedenciaDe } from "@/lib/formato";

function origenLabel(origen: string): string {
  if (origen === "corporativo") return "Convenio corporativo"; // etiqueta sintética — ClienteCorporativo no tiene campo origen propio
  return ORIGEN_LABEL[origen] ?? origen;
}

// Panel Gerencial: los mismos 4 pilares que pidió Mijael — Crecimiento,
// Fidelización, Rendimiento del equipo, y de dónde vienen más registros —
// pero con el detalle operativo por negocio que Dirección no necesita
// (vendedores, ranking, seguimiento en vivo). Regla explícita: un negocio
// específico (Las Flores/Umaru/Mamina) NUNCA muestra comparativas con los
// otros 2 — son independientes. Las comparativas (mismo diseño que Panel
// Ejecutivo, vía ComparativosNegocio.tsx) solo aparecen en "Todas las
// sucursales".
export function PanelGerencial() {
  const { negocio, usuarios } = useApp();
  const [periodo, setPeriodo] = useState<Periodo>("semana");
  const esTodas = negocio.id === "todas";
  const negociosOperando = NEGOCIOS.filter((n) => n.operando);
  const { clientesIndividuales, clientesCorporativos, seguimientos } = useData();
  const datos = useMemo(
    () => ({ clientesIndividuales, clientesCorporativos, seguimientos }),
    [clientesIndividuales, clientesCorporativos, seguimientos]
  );

  // Lista de asesores comerciales según el filtro principal activo (Topbar)
  const vendedoresAMostrar = useMemo(() => {
    const equipo = usuarios.filter((u) => u.rolTipo === "ventas");
    if (esTodas) return equipo;
    return equipo.filter((u) => u.negocioId === negocio.id);
  }, [usuarios, negocio.id, esTodas]);

  // Cálculo del último registro de cliente para CADA VENDEDOR de la sede activa
  const ultimosRegistros = useMemo(() => {
    return vendedoresAMostrar.map((v) => {
      const neg = getNegocio(v.negocioId) ?? NEGOCIOS[0];

      // `registradoPor` guarda el id estable de la cuenta, no su nombre
      // visible — así renombrar una cuenta desde Usuarios no rompe la
      // atribución histórica.
      const matchVendedor = (reg?: string) => reg === v.id;

      const individuales = clientesIndividualesPorNegocio(clientesIndividuales, v.negocioId).filter((c) => matchVendedor(c.registradoPor)).map((c) => ({
        id: c.id,
        nombre: `${c.nombres} ${c.apellidos}`.trim(),
        tipo: "Natural" as const,
        documento: c.numeroDocumento ? `DNI ${c.numeroDocumento}` : undefined,
        celular: c.celular,
        fechaRegistro: c.fechaRegistro,
        creadoEn: c.creadoEn,
        origen: c.origen || "crm",
        pais: c.pais, departamento: c.departamento, provincia: c.provincia, distrito: c.distrito,
      }));

      const corporativos = corporativosPorNegocio(clientesCorporativos, v.negocioId).filter((c) => matchVendedor(c.registradoPor)).map((c) => ({
        id: c.id,
        nombre: c.razonSocial,
        tipo: "Corporativo" as const,
        documento: `RUC ${c.ruc}`,
        celular: c.celular,
        fechaRegistro: c.fechaRegistro,
        creadoEn: c.creadoEn,
        origen: "corporativo",
        pais: c.pais, departamento: c.departamento, provincia: c.provincia, distrito: c.distrito,
      }));

      let todos = [...individuales, ...corporativos].sort(
        (a, b) => new Date(b.creadoEn ?? b.fechaRegistro).getTime() - new Date(a.creadoEn ?? a.fechaRegistro).getTime()
      );

      // Fallback si la cuenta es nueva y no tiene asignados todavía
      if (todos.length === 0) {
        todos = clientesIndividualesPorNegocio(clientesIndividuales, v.negocioId).slice(0, 10).map((c) => ({
          id: c.id,
          nombre: `${c.nombres} ${c.apellidos}`.trim(),
          tipo: "Natural" as const,
          documento: c.numeroDocumento ? `DNI ${c.numeroDocumento}` : undefined,
          celular: c.celular,
          fechaRegistro: c.fechaRegistro,
          creadoEn: c.creadoEn,
          origen: c.origen || "crm",
          pais: c.pais, departamento: c.departamento, provincia: c.provincia, distrito: c.distrito,
        }));
      }

      return {
        vendedor: v,
        negocioNombre: neg.nombre,
        negocioColor: neg.colorAcento,
        negocioId: v.negocioId,
        ultimoCliente: todos[0] ?? null,
        totalClientes: todos.length,
      };
    });
  }, [vendedoresAMostrar, clientesIndividuales, clientesCorporativos]);

  // --- Crecimiento -----------------------------------------------------
  const clientesPeriodo = clientesPorTipoPeriodo(datos, negocio.id, periodo);
  const serieClientes = serieClientesPorPeriodo(datos, negocio.id, periodo);
  const clientesDelNegocio = clientesIndividualesPorNegocio(clientesIndividuales, negocio.id).length + corporativosPorNegocio(clientesCorporativos, negocio.id).length;
  const corporativosDelNegocio = corporativosPorNegocio(clientesCorporativos, negocio.id).length;

  const comparativoCrecimiento = useMemo(
    () => (esTodas ? negociosOperando.map((n) => ({ negocio: n, clientes: clientesPorTipoPeriodo(datos, n.id, periodo) })) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [esTodas, periodo, datos]
  );

  // --- Fidelización ------------------------------------------------------
  // Misma señal que usa Directorio — conversión de saludo de cumpleaños en
  // visita — porque es la única señal de "volvió" que existe en el sistema
  // (Hospedaje, la otra que hubo, se eliminó). Nunca usa el rango rodante de
  // arriba (Diario/Semanal/Mensual): un saludo de cumpleaños no tiene
  // granularidad diaria, así que en esos 3 casos se muestra el mes de
  // calendario real; en Anual, el histórico de 12 meses.
  const mesActual = BASE_DATE.toLocaleDateString("es-PE", { month: "long", year: "numeric" });
  const cumpleMes = resumenCumpleanosMes(datos, negocio.id);
  const historialFidelizacion = useMemo(
    () => (periodo === "anio" ? historialFidelizacionGrupo(datos, negocio.id) : []),
    [negocio.id, periodo, datos]
  );
  const fidelizacionAnual = useMemo(
    () => historialFidelizacion.reduce(
      (a, p) => ({ enviados: a.enviados + p.enviados, convertidos: a.convertidos + p.convertidos }),
      { enviados: 0, convertidos: 0 }
    ),
    [historialFidelizacion]
  );
  const cumpleanosConvertidos = periodo === "anio" ? fidelizacionAnual.convertidos : cumpleMes.personasQueReservaron;
  const cumpleanosEnviados = periodo === "anio" ? fidelizacionAnual.enviados : cumpleMes.enviados;
  const conversionCumpleanos = cumpleanosEnviados > 0 ? Math.round((cumpleanosConvertidos / cumpleanosEnviados) * 100) : 0;
  // "Anual" es el año de calendario en curso (enero a hoy), no una ventana
  // rodante de 12 meses — mismo criterio que "mes" acá abajo y que usa
  // Directorio, para que "Anual" signifique lo mismo en toda la página.
  const vistaFidelizacion = periodo === "anio" ? String(BASE_DATE.getFullYear()) : mesActual;
  const cumpleanosDelNegocio = proximosCumpleanosDe(clientesIndividualesPorNegocio(clientesIndividuales, negocio.id), BASE_DATE, 30).length;
  // Las 3 tarjetas de cumpleaños solo se muestran en Mensual/Anual (ver más
  // abajo) — en Diario/Semanal no hay nada que mostrar en esta sección, así
  // que el título tampoco se muestra (sin esto quedaría flotando sin nada
  // debajo).
  const mostrarSeccionFidelizacion = periodo === "mes" || periodo === "anio";

  const comparativoFidelizacion = useMemo(
    () => (esTodas ? negociosOperando.map((n) => ({ negocio: n, cumple: resumenCumpleanosPeriodo(datos, n.id, periodo) })) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [esTodas, periodo, datos]
  );

  // --- De dónde vienen más registros --------------------------------------
  const origenClientes = distribucionOrigen(datos, negocio.id);
  const desgloseWeb = esTodas ? origenWebPorNegocio(datos) : [];

  return (
    <div className="space-y-6" id="reporte">
      {/* ================= CRECIMIENTO ================= */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-sm font-semibold text-[var(--color-gris)]">Crecimiento</h2>
          {/* "Comparado con X" ya no va acá — las tarjetas de abajo ya dicen
              "vs. julio de 2026" cada una, repetirlo en el subtítulo era
              redundante. El subtítulo solo dice qué periodo se está viendo. */}
          <p className="text-xs text-[var(--color-gris-medio)] mt-0.5">{negocio.nombre} · {rangoDelPeriodo(periodo)}</p>
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
          label="Clientes nuevos"
          value={clientesPeriodo.individuales}
          icon={<UserPlus size={18} />}
          tono="terracota"
          trend={cambioTexto(clientesPeriodo.individualesCambio, periodo)}
          trendUp={(clientesPeriodo.individualesCambio ?? 0) >= 0}
        />
        <StatTile
          label="Clientes corporativos nuevos"
          value={clientesPeriodo.corporativos}
          icon={<Building2 size={18} />}
          tono="azul"
          trend={cambioTexto(clientesPeriodo.corporativosCambio, periodo)}
          trendUp={(clientesPeriodo.corporativosCambio ?? 0) >= 0}
        />
        <StatTile label="Clientes totales" value={clientesDelNegocio} icon={<Users size={18} />} tono="naranja" trend={negocio.nombre} />
        <StatTile label="Clientes corporativos" value={corporativosDelNegocio} icon={<Building2 size={18} />} tono="azul" trend={`de ${clientesDelNegocio} clientes`} />
      </div>

      {/* Un solo día no da para graficar una tendencia — mismo criterio que
          ya se usa en Dirección para no mostrar el desglose diario en vistas
          demasiado granulares. */}
      {periodo !== "dia" && (
        <Card>
          <CardHeader title="Clientes nuevos — tendencia" subtitle={`${rangoDelPeriodo(periodo)} · ${negocio.nombre}`} />
          <BarChartSerie
            data={serieClientes}
            xKey="mes"
            series={[{ key: "clientes", nombre: "Clientes nuevos", color: "#8C3A25" }]}
            todasLasEtiquetas={periodo === "mes"}
          />
        </Card>
      )}

      {esTodas && <ComparativoCrecimientoPorNegocio items={comparativoCrecimiento} vistaDescripcion={rangoDelPeriodo(periodo)} />}

      {/* ================= FIDELIZACIÓN ================= */}
      {mostrarSeccionFidelizacion && (
        <div>
          <h2 className="text-sm font-semibold text-[var(--color-gris)]">Fidelización</h2>
          {/* El subtítulo describe las 3 tarjetas de cumpleaños — solo tiene
              sentido mostrarlo cuando ellas también se muestran (Mensual/
              Anual). */}
          {(periodo === "mes" || periodo === "anio") && (
            <p className="text-xs text-[var(--color-gris-medio)] mt-0.5">
              De los clientes que cumplieron años en {vistaFidelizacion} y recibieron el saludo, cuántos terminaron visitando — {negocio.nombre}
            </p>
          )}
        </div>
      )}

      {/* Un saludo de cumpleaños no tiene granularidad diaria/semanal — el
          dato real es "el mes en curso" o "el año en curso", nunca "hoy" ni
          "esta semana". En Diario/Semanal estas tarjetas mostrarían el mismo
          número sin moverse con el filtro, igual de confuso que el bug que
          ya se corrigió en el gráfico de Crecimiento — mejor ocultar las 3
          juntas ahí (incluida "Próximos cumpleaños", para no dejarla sola y
          huérfana sin sus 2 hermanas) y mostrarlas solo donde el dato es
          real. */}
      {(periodo === "mes" || periodo === "anio") && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatTile
            label="Cumpleaños convertidos en visita"
            value={cumpleanosConvertidos}
            icon={<Gift size={18} />}
            tono="verde"
            trend={`de ${cumpleanosEnviados} saludos enviados en ${vistaFidelizacion}`}
            trendUp
          />
          <StatTile
            label="Tasa de conversión"
            value={`${conversionCumpleanos}%`}
            icon={<Percent size={18} />}
            tono="azul"
            trend={`saludo de cumpleaños → visita, en ${vistaFidelizacion}`}
          />
          <StatTile label="Próximos cumpleaños" value={cumpleanosDelNegocio} icon={<Gift size={18} />} tono="naranja" trend="en los próximos 30 días" />
        </div>
      )}

      {periodo === "anio" && (
        <Card>
          <CardHeader
            title={esTodas ? "Fidelización del grupo — por mes" : "Fidelización — por mes"}
            subtitle={`Cumpleaños convertidos en visita · ${negocio.nombre} · ${vistaFidelizacion}`}
          />
          <BarChartSerie
            data={historialFidelizacion}
            xKey="mes"
            series={[{ key: "convertidos", nombre: "Cumpleaños convertidos en visita", color: "#3e6b4f" }]}
          />
        </Card>
      )}

      {esTodas && (periodo === "mes" || periodo === "anio") && (
        <ComparativoFidelizacionPorNegocio items={comparativoFidelizacion} vistaDescripcion={vistaFidelizacion} />
      )}

      {/* ================= RENDIMIENTO DEL EQUIPO ================= */}
      {/* El título de acá arriba describe la tarjeta "Último Registro" que
          sigue inmediatamente abajo (para qué le sirve a Mijael: ver qué
          cliente se registró más reciente y qué asesor lo atendió) — no
          "Rendimiento del equipo", que ya es el título propio de
          EstadisticasVendedores más abajo y quedaba redundante. */}
      <div>
        <h2 className="text-sm font-semibold text-[var(--color-gris)]">Registro de últimos clientes</h2>
        <p className="text-xs text-[var(--color-gris-medio)] mt-0.5">{negocio.nombre} · último cliente registrado, por asesor</p>
      </div>

      <Card>
        <CardHeader
          title={esTodas ? "Último Registro de Cliente por Asesor(a)" : `Último Registro de Cliente · Asesores de ${negocio.nombre}`}
          subtitle={
            esTodas
              ? "Seguimiento en tiempo real de captación por cada vendedor · Todas las sucursales del Grupo"
              : `Seguimiento en tiempo real de captación por los vendedores de ${negocio.nombre}`
          }
          action={
            <Link
              href="/clientes"
              className="flex items-center gap-1.5 text-xs font-semibold text-[var(--color-terracota)] bg-[var(--color-crema)] px-3.5 py-2 rounded-xl hover:bg-[var(--color-crema-oscuro)] transition-colors shadow-xs"
            >
              <UserPlus size={14} />
              <span>Añadir Cliente</span>
            </Link>
          }
        />

        {ultimosRegistros.length === 0 ? (
          <p className="text-xs text-[var(--color-gris-medio)] py-8 text-center bg-[var(--color-crema)]/10 rounded-xl border border-dashed border-[var(--color-gris-claro)]/40 mt-4">
            No hay asesores asignados a esta sede todavía.
          </p>
        ) : (
          <div className={`mt-4 grid grid-cols-1 gap-4 ${
            ultimosRegistros.length === 1
              ? "md:grid-cols-1 max-w-md"
              : ultimosRegistros.length === 2
              ? "md:grid-cols-2"
              : ultimosRegistros.length === 3
              ? "md:grid-cols-3"
              : "md:grid-cols-2 lg:grid-cols-4"
          }`}>
            {ultimosRegistros.map(({ vendedor: v, negocioNombre, negocioColor, ultimoCliente, totalClientes }) => {
              const esSedeActiva = v.negocioId === negocio.id;
              return (
                <div
                  key={v.id}
                  className={`rounded-2xl border p-4 flex flex-col justify-between transition-all bg-white ${
                    esSedeActiva && !esTodas
                      ? "border-[var(--color-terracota)] ring-1 ring-[var(--color-terracota)]/20 shadow-sm"
                      : "border-[var(--color-gris-claro)]/40 hover:border-[var(--color-terracota)]/40 hover:shadow-md"
                  }`}
                >
                  <div>
                    {/* Cabecera del Vendedor */}
                    <div className="flex items-center justify-between gap-2 mb-3 pb-2.5 border-b border-[var(--color-gris-claro)]/30">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-[var(--color-terracota)] text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-sm">
                          {v.iniciales}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-sm text-[var(--color-gris)] truncate">
                            {v.nombre}
                          </p>
                          <p className="text-[10px] text-[var(--color-gris-medio)] truncate flex items-center gap-1.5 mt-0.5">
                            <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: negocioColor }} />
                            <span>{negocioNombre.replace("Restaurante ", "").replace("Hotel ", "")}</span>
                          </p>
                        </div>
                      </div>

                      <Badge tono="gris">
                        {totalClientes} clientes
                      </Badge>
                    </div>

                    {/* Último cliente captado */}
                    {ultimoCliente ? (
                      <div className="space-y-2">
                        <div>
                          <Link
                            href={`/clientes/${ultimoCliente.id}`}
                            className="font-bold text-sm text-[var(--color-gris)] hover:text-[var(--color-terracota)] transition-colors line-clamp-1"
                          >
                            {ultimoCliente.nombre}
                          </Link>
                          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                            <Badge tono={ultimoCliente.tipo === "Natural" ? "gris" : "azul"}>
                              {ultimoCliente.tipo}
                            </Badge>
                            {ultimoCliente.documento && (
                              <span className="text-[11px] font-mono text-[var(--color-gris-medio)] font-semibold">
                                {ultimoCliente.documento}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="text-xs text-[var(--color-gris-medio)] space-y-1.5 pt-1">
                          <div className="flex items-center gap-1.5 text-[var(--color-terracota)] font-semibold">
                            <Clock size={12} className="shrink-0" />
                            <span>{tiempoRelativoOFecha(ultimoCliente.creadoEn ?? ultimoCliente.fechaRegistro)}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-[var(--color-gris-medio)] truncate">
                            <User size={12} className="shrink-0" />
                            <span className="truncate">Canal: {origenLabel(ultimoCliente.origen)}</span>
                          </div>
                          <div className="flex items-center gap-1.5 truncate text-[11px] text-[var(--color-gris-medio)]">
                            <MapPin size={11} className="shrink-0" />
                            <span className="truncate">{procedenciaDe(ultimoCliente)}</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-[var(--color-gris-medio)] py-4 text-center italic">
                        Sin clientes registrados aún
                      </p>
                    )}
                  </div>

                  {ultimoCliente && (
                    <div className="mt-3 pt-3 border-t border-[var(--color-gris-claro)]/30 space-y-2">
                      <a
                        href={`https://wa.me/51${ultimoCliente.celular.replace(/\D/g, "")}?text=${encodeURIComponent(
                          `Hola ${ultimoCliente.nombre}, te saluda ${v.nombre} de ${negocioNombre}.`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-1.5 w-full bg-[#25D366]/10 text-[#128C7E] hover:bg-[#25D366]/20 font-semibold text-xs py-1.5 rounded-lg transition-colors"
                      >
                        <MessageCircle size={13} />
                        <span>WhatsApp ({ultimoCliente.celular})</span>
                      </a>
                      <Link
                        href={`/clientes/${ultimoCliente.id}`}
                        className="flex items-center justify-between text-xs font-semibold text-[var(--color-terracota)] hover:underline pt-0.5"
                      >
                        <span>Ver ficha 360°</span>
                        <ArrowRight size={12} />
                      </Link>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Un solo día de ranking es demasiado ruidoso para decidir nada — se
          oculta en vez de mostrar un "Mayor Captadora" que puede cambiar por
          1 solo registro. Mismo criterio que el resto del panel: sin dato
          suficiente para esa granularidad, se oculta en vez de mostrar algo
          engañoso. Usa el mismo selector de arriba — el componente ya no
          tiene filtro propio de sede ni de periodo. */}
      {periodo !== "dia" && <EstadisticasVendedores periodo={periodo} />}

      {/* ================= DE DÓNDE VIENEN MÁS REGISTROS ================= */}
      <div>
        <h2 className="text-sm font-semibold text-[var(--color-gris)]">De dónde vienen más registros</h2>
        <p className="text-xs text-[var(--color-gris-medio)] mt-0.5">{negocio.nombre}</p>
      </div>

      <Card>
        <CardHeader title="De dónde vienen los clientes" subtitle={negocio.nombre} />
        <DonutChart data={origenClientes} />
      </Card>

      {/* Solo en "Todas las sucursales": el desglose de Web por sede es un
          detalle adicional que solo tiene sentido comparando entre negocios
          — el donut de arriba (CRM vs. Web) ya se ve igual en las 4 vistas. */}
      {esTodas && (
        <Card>
          <CardHeader title="Web por sede" subtitle="Clientes que se registraron por la web de cada negocio (vs. presencial en el CRM)" />
          <div className="space-y-4 mt-1">
            {desgloseWeb.map(({ negocio: n, valor, porcentaje }) => (
              <div key={n.id}>
                <div className="flex items-center justify-between text-sm mb-1.5">
                  <span className="font-medium text-[var(--color-gris)]">{n.nombre}</span>
                  <span className="text-[var(--color-gris-medio)]">{valor.toLocaleString("es-PE")} clientes · {porcentaje}%</span>
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
      )}
    </div>
  );
}

function cambioTexto(valor: number | null, periodo: Periodo): string | undefined {
  // `valor` ya viene en null para Diario (ver cambioPorcentualSiAplica en
  // metrics.ts — una muestra de 1 día es demasiado chica para que un %
  // signifique algo real), así que este chequeo alcanza para los 2 casos.
  if (valor === null) return undefined;
  return `${valor >= 0 ? "+" : ""}${valor}% vs. ${etiquetaPeriodoAnterior(periodo)}`;
}
