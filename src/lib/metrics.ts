import { NegocioId } from "./types";
import { BASE_DATE } from "./mock/seed";
import { clientesIndividualesPorNegocio, corporativosPorNegocio } from "./mock/clientes";
import { reservasPorNegocio } from "./mock/reservas";
import { PEDIDOS } from "./mock/pedidos";
import { HOSPEDAJES } from "./mock/hospedaje";
import { proximosCumpleanos, seguimientosPorNegocio } from "./mock/seguimiento";
import { NEGOCIOS } from "./mock/negocios";

function diasDesde(fechaISO: string): number {
  return Math.round((BASE_DATE.getTime() - new Date(fechaISO).getTime()) / 86400000);
}

export function clientesNuevos(negocioId: NegocioId, dias: number): number {
  return clientesIndividualesPorNegocio(negocioId).filter((c) => {
    const d = diasDesde(c.fechaRegistro);
    return d >= 0 && d <= dias;
  }).length;
}

export function reservasSemana(negocioId: NegocioId) {
  const items = reservasPorNegocio(negocioId).filter((r) => {
    const d = diasDesde(r.fecha);
    return d >= 0 && d <= 7;
  });
  const confirmadas = items.filter((r) => r.estado === "confirmada" || r.estado === "atendida");
  return { total: items.length, confirmadas: confirmadas.length };
}

export function pedidosSemana(negocioId: NegocioId) {
  const items = PEDIDOS.filter((p) => p.negocioId === negocioId).filter((p) => {
    const d = diasDesde(p.fecha);
    return d >= 0 && d <= 7;
  });
  const monto = items.reduce((acc, p) => acc + (p.estado !== "cancelado" ? p.monto : 0), 0);
  return { total: items.length, monto };
}

export function ticketPromedio(negocioId: NegocioId): number {
  const reservasAtendidas = reservasPorNegocio(negocioId).filter((r) => r.estado === "atendida" && r.monto);
  const pedidos = PEDIDOS.filter((p) => p.negocioId === negocioId && p.estado === "entregado");
  const montos = [...reservasAtendidas.map((r) => r.monto ?? 0), ...pedidos.map((p) => p.monto)];
  if (montos.length === 0) return 0;
  return Math.round(montos.reduce((a, b) => a + b, 0) / montos.length);
}

export function tasaConversionReservas(negocioId: NegocioId): number {
  const items = reservasPorNegocio(negocioId).filter((r) => r.estado !== "confirmada");
  if (items.length === 0) return 0;
  const atendidas = items.filter((r) => r.estado === "atendida").length;
  return Math.round((atendidas / items.length) * 100);
}

const MESES_LABEL = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Set", "Oct", "Nov", "Dic"];

export function serieMensual(negocioId: NegocioId, cantidadMeses = 6) {
  const meses: { mes: string; reservas: number; pedidos: number }[] = [];
  for (let i = cantidadMeses - 1; i >= 0; i--) {
    const fecha = new Date(BASE_DATE.getFullYear(), BASE_DATE.getMonth() - i, 1);
    const label = MESES_LABEL[fecha.getMonth()];
    const reservas = reservasPorNegocio(negocioId).filter((r) => {
      const f = new Date(r.fecha);
      return f.getMonth() === fecha.getMonth() && f.getFullYear() === fecha.getFullYear();
    }).length;
    const pedidos = PEDIDOS.filter((p) => p.negocioId === negocioId).filter((p) => {
      const f = new Date(p.fecha);
      return f.getMonth() === fecha.getMonth() && f.getFullYear() === fecha.getFullYear();
    }).length;
    meses.push({ mes: label, reservas, pedidos });
  }
  return meses;
}

export interface ActividadItem {
  id: string;
  tipo: "reserva" | "delivery" | "hospedaje";
  titulo: string;
  detalle: string;
  fecha: string;
}

export function actividadReciente(negocioId: NegocioId, n = 6): ActividadItem[] {
  const reservas: ActividadItem[] = reservasPorNegocio(negocioId).map((r) => ({
    id: r.id,
    tipo: "reserva",
    titulo: `Reserva de ${r.clienteNombre}`,
    detalle: `${r.personas} personas · ${r.estado}`,
    fecha: r.registradoEn,
  }));
  const pedidos: ActividadItem[] = PEDIDOS.filter((p) => p.negocioId === negocioId).map((p) => ({
    id: p.id,
    tipo: "delivery",
    titulo: `Pedido de ${p.clienteNombre}`,
    detalle: `S/ ${p.monto} · ${p.estado}`,
    fecha: p.registradoEn,
  }));
  const hospedajes: ActividadItem[] = HOSPEDAJES.filter((h) => h.negocioId === negocioId).map((h) => ({
    id: h.id,
    tipo: "hospedaje",
    titulo: `Hospedaje de ${h.clienteNombre}`,
    detalle: `Hab. ${h.habitacion} · S/ ${h.tarifaNoche}/noche`,
    fecha: h.checkIn,
  }));
  return [...reservas, ...pedidos, ...hospedajes]
    .sort((a, b) => (a.fecha < b.fecha ? 1 : -1))
    .slice(0, n);
}

// Lo único que Dirección necesita del módulo de Cumpleaños: cuántos se
// mandaron este mes, cuántas reservas concretas salieron de ahí, y cuánta
// plata generaron — números para decidir, no la gestión día a día.
export function resumenCumpleanosMes(negocioId: NegocioId) {
  const seguimientos = seguimientosPorNegocio(negocioId);
  const enviados = seguimientos.filter((s) => s.saludoEnviado).length;
  const reservaron = seguimientos.filter((s) => s.reservacion === "si");
  const montoTotal = reservaron.reduce((acc, s) => acc + (s.montoConsumo ?? 0), 0);
  return {
    totalDelMes: seguimientos.length,
    enviados,
    personasQueReservaron: reservaron.length,
    montoTotal,
  };
}

// --- Reportes por periodo (Diario / Semanal / Mensual / Anual) — Dirección ---
export type Periodo = "dia" | "semana" | "mes" | "anio";

export const PERIODOS: { value: Periodo; label: string; dias: number }[] = [
  { value: "dia", label: "Diario", dias: 1 },
  { value: "semana", label: "Semanal", dias: 7 },
  { value: "mes", label: "Mensual", dias: 30 },
  { value: "anio", label: "Anual", dias: 365 },
];

export function enVentana(fechaISO: string, dias: number, offset = 0): boolean {
  const d = diasDesde(fechaISO);
  return d >= offset && d < offset + dias;
}

export function cambioPorcentual(actual: number, anterior: number): number | null {
  if (anterior === 0) return actual > 0 ? 100 : null;
  return Math.round(((actual - anterior) / anterior) * 100);
}

function diasDelPeriodo(periodo: Periodo): number {
  return PERIODOS.find((p) => p.value === periodo)!.dias;
}

export interface ResumenPeriodo {
  clientesNuevos: number; clientesNuevosCambio: number | null;
  reservas: number; reservasCambio: number | null;
  pedidos: number; pedidosCambio: number | null;
  ingresos: number; ingresosCambio: number | null;
}

export function resumenPeriodo(negocioId: NegocioId, periodo: Periodo): ResumenPeriodo {
  const dias = PERIODOS.find((p) => p.value === periodo)!.dias;

  const contarClientes = (offset: number) =>
    clientesIndividualesPorNegocio(negocioId).filter((c) => enVentana(c.fechaRegistro, dias, offset)).length;

  const reservasEnVentana = (offset: number) => reservasPorNegocio(negocioId).filter((r) => enVentana(r.fecha, dias, offset));
  const pedidosEnVentana = (offset: number) => PEDIDOS.filter((p) => p.negocioId === negocioId && enVentana(p.fecha, dias, offset));

  const ingresosEnVentana = (offset: number) => {
    const r = reservasEnVentana(offset).filter((x) => x.estado === "atendida").reduce((a, x) => a + (x.monto ?? 0), 0);
    const p = pedidosEnVentana(offset).filter((x) => x.estado === "entregado").reduce((a, x) => a + x.monto, 0);
    return r + p;
  };

  const clientesActual = contarClientes(0);
  const clientesAnterior = contarClientes(dias);
  const reservasActual = reservasEnVentana(0).length;
  const reservasAnterior = reservasEnVentana(dias).length;
  const pedidosActual = pedidosEnVentana(0).length;
  const pedidosAnterior = pedidosEnVentana(dias).length;
  const ingresosActual = ingresosEnVentana(0);
  const ingresosAnterior = ingresosEnVentana(dias);

  return {
    clientesNuevos: clientesActual,
    clientesNuevosCambio: cambioPorcentual(clientesActual, clientesAnterior),
    reservas: reservasActual,
    reservasCambio: cambioPorcentual(reservasActual, reservasAnterior),
    pedidos: pedidosActual,
    pedidosCambio: cambioPorcentual(pedidosActual, pedidosAnterior),
    ingresos: ingresosActual,
    ingresosCambio: cambioPorcentual(ingresosActual, ingresosAnterior),
  };
}

// Serie para el gráfico según el periodo elegido: por día (diario/semanal/
// mensual) o por mes (anual) — así el gráfico siempre tiene una resolución
// razonable en vez de 365 barras diarias ilegibles.
export function serieParaPeriodo(negocioId: NegocioId, periodo: Periodo) {
  if (periodo === "anio") {
    return serieMensual(negocioId, 12);
  }
  const dias = periodo === "dia" ? 7 : periodo === "semana" ? 7 : 30; // "dia" también muestra la semana como contexto
  const puntos: { mes: string; reservas: number; pedidos: number }[] = [];
  for (let i = dias - 1; i >= 0; i--) {
    const fecha = new Date(BASE_DATE);
    fecha.setDate(fecha.getDate() - i);
    const clave = fecha.toISOString().slice(0, 10);
    const label = fecha.toLocaleDateString("es-PE", { day: "2-digit", month: "2-digit" });
    const reservas = reservasPorNegocio(negocioId).filter((r) => r.fecha === clave).length;
    const pedidos = PEDIDOS.filter((p) => p.negocioId === negocioId && p.fecha === clave).length;
    puntos.push({ mes: label, reservas, pedidos });
  }
  return puntos;
}

// --- Distribuciones para gráficos de dona por módulo -----------------------
const ORIGEN_LABEL: Record<string, string> = {
  "web-reservas": "Web — Reservas",
  "web-delivery": "Web — Delivery",
  presencial: "Presencial",
  "redes-sociales": "Redes sociales",
  referido: "Referido",
  "importado-excel": "Importado de Excel",
};

export function distribucionOrigen(negocioId: NegocioId) {
  const conteo: Record<string, number> = {};
  clientesIndividualesPorNegocio(negocioId).forEach((c) => {
    conteo[c.origen] = (conteo[c.origen] ?? 0) + 1;
  });
  return Object.entries(conteo).map(([origen, valor]) => ({ nombre: ORIGEN_LABEL[origen] ?? origen, valor }));
}

const ESTADO_RESERVA_LABEL: Record<string, string> = {
  confirmada: "Confirmada", atendida: "Atendida", cancelada: "Cancelada", "no-llego": "No llegó",
};

export function distribucionEstadoReservas(negocioId: NegocioId) {
  const conteo: Record<string, number> = {};
  reservasPorNegocio(negocioId).forEach((r) => { conteo[r.estado] = (conteo[r.estado] ?? 0) + 1; });
  return Object.entries(conteo).map(([estado, valor]) => ({ nombre: ESTADO_RESERVA_LABEL[estado] ?? estado, valor }));
}

const ESTADO_PEDIDO_LABEL: Record<string, string> = {
  "en-preparacion": "En preparación", "en-camino": "En camino", entregado: "Entregado", cancelado: "Cancelado",
};

export function distribucionEstadoPedidos(negocioId: NegocioId) {
  const conteo: Record<string, number> = {};
  PEDIDOS.filter((p) => p.negocioId === negocioId).forEach((p) => { conteo[p.estado] = (conteo[p.estado] ?? 0) + 1; });
  return Object.entries(conteo).map(([estado, valor]) => ({ nombre: ESTADO_PEDIDO_LABEL[estado] ?? estado, valor }));
}

// --- Delivery por periodo ----------------------------------------------------
export function pedidosPorPeriodo(negocioId: NegocioId, periodo: Periodo) {
  const dias = diasDelPeriodo(periodo);
  const enVentanaPedidos = (offset: number) => PEDIDOS.filter((p) => p.negocioId === negocioId && enVentana(p.fecha, dias, offset));
  const actual = enVentanaPedidos(0);
  const anterior = enVentanaPedidos(dias);
  const montoActual = actual.filter((p) => p.estado === "entregado").reduce((a, p) => a + p.monto, 0);
  const montoAnterior = anterior.filter((p) => p.estado === "entregado").reduce((a, p) => a + p.monto, 0);
  return {
    total: actual.length, totalCambio: cambioPorcentual(actual.length, anterior.length),
    monto: montoActual, montoCambio: cambioPorcentual(montoActual, montoAnterior),
  };
}

export function seriePedidosPorPeriodo(negocioId: NegocioId, periodo: Periodo) {
  if (periodo === "anio") {
    const meses: { mes: string; pedidos: number }[] = [];
    for (let i = 11; i >= 0; i--) {
      const fecha = new Date(BASE_DATE.getFullYear(), BASE_DATE.getMonth() - i, 1);
      const label = MESES_LABEL[fecha.getMonth()];
      const pedidos = PEDIDOS.filter((p) => p.negocioId === negocioId).filter((p) => {
        const f = new Date(p.fecha);
        return f.getMonth() === fecha.getMonth() && f.getFullYear() === fecha.getFullYear();
      }).length;
      meses.push({ mes: label, pedidos });
    }
    return meses;
  }
  const dias = periodo === "mes" ? 30 : 7;
  const puntos: { mes: string; pedidos: number }[] = [];
  for (let i = dias - 1; i >= 0; i--) {
    const fecha = new Date(BASE_DATE);
    fecha.setDate(fecha.getDate() - i);
    const clave = fecha.toISOString().slice(0, 10);
    const label = fecha.toLocaleDateString("es-PE", { day: "2-digit", month: "2-digit" });
    const pedidos = PEDIDOS.filter((p) => p.negocioId === negocioId && p.fecha === clave).length;
    puntos.push({ mes: label, pedidos });
  }
  return puntos;
}

// --- Reservas: confirmadas/atendidas y conversión, dentro del periodo -------
// Antes estas dos tarjetas del resumen de Dirección quedaban fijas (una
// siempre calculaba "esta semana" sin importar el filtro elegido, la otra
// promediaba todo el histórico) — ahora ambas se recalculan sobre la misma
// ventana de tiempo que el resto del resumen.
export function reservasEstadoPorPeriodo(negocioId: NegocioId, periodo: Periodo) {
  const dias = diasDelPeriodo(periodo);
  const enP = (offset: number) => reservasPorNegocio(negocioId).filter((r) => enVentana(r.fecha, dias, offset));
  const actual = enP(0);
  const anterior = enP(dias);

  const confirmadasActual = actual.filter((r) => r.estado === "confirmada" || r.estado === "atendida").length;
  const confirmadasAnterior = anterior.filter((r) => r.estado === "confirmada" || r.estado === "atendida").length;

  const elegiblesActual = actual.filter((r) => r.estado !== "confirmada");
  const atendidasActual = elegiblesActual.filter((r) => r.estado === "atendida").length;
  const conversion = elegiblesActual.length === 0 ? 0 : Math.round((atendidasActual / elegiblesActual.length) * 100);

  return {
    confirmadas: confirmadasActual,
    confirmadasCambio: cambioPorcentual(confirmadasActual, confirmadasAnterior),
    conversion,
  };
}

// --- Reservas: serie de una sola variable (para el resumen de Reservas) ----
export function serieReservasPorPeriodo(negocioId: NegocioId, periodo: Periodo) {
  if (periodo === "anio") {
    const meses: { mes: string; reservas: number }[] = [];
    for (let i = 11; i >= 0; i--) {
      const fecha = new Date(BASE_DATE.getFullYear(), BASE_DATE.getMonth() - i, 1);
      const label = MESES_LABEL[fecha.getMonth()];
      const reservas = reservasPorNegocio(negocioId).filter((r) => {
        const f = new Date(r.fecha);
        return f.getMonth() === fecha.getMonth() && f.getFullYear() === fecha.getFullYear();
      }).length;
      meses.push({ mes: label, reservas });
    }
    return meses;
  }
  const dias = periodo === "mes" ? 30 : 7;
  const puntos: { mes: string; reservas: number }[] = [];
  for (let i = dias - 1; i >= 0; i--) {
    const fecha = new Date(BASE_DATE);
    fecha.setDate(fecha.getDate() - i);
    const clave = fecha.toISOString().slice(0, 10);
    const label = fecha.toLocaleDateString("es-PE", { day: "2-digit", month: "2-digit" });
    const reservas = reservasPorNegocio(negocioId).filter((r) => r.fecha === clave).length;
    puntos.push({ mes: label, reservas });
  }
  return puntos;
}

// --- Clientes: nuevos por periodo, separado por tipo ------------------------
// Antes las tarjetas de "Clientes individuales/corporativos" del resumen de
// Dirección mostraban el total histórico fijo, sin moverse al cambiar de
// periodo — esto separa individuales y corporativos NUEVOS dentro del
// periodo elegido, cada uno con su cambio %, para que si no hubo ninguno en
// el día/semana elegido, la tarjeta muestre 0 de verdad.
export function clientesPorTipoPeriodo(negocioId: NegocioId, periodo: Periodo) {
  const dias = diasDelPeriodo(periodo);
  const contar = (arr: { fechaRegistro: string }[], offset: number) =>
    arr.filter((c) => enVentana(c.fechaRegistro, dias, offset)).length;

  const individuales = clientesIndividualesPorNegocio(negocioId);
  const corporativos = corporativosPorNegocio(negocioId);

  const indActual = contar(individuales, 0);
  const indAnterior = contar(individuales, dias);
  const corpActual = contar(corporativos, 0);
  const corpAnterior = contar(corporativos, dias);

  return {
    individuales: indActual, individualesCambio: cambioPorcentual(indActual, indAnterior),
    corporativos: corpActual, corporativosCambio: cambioPorcentual(corpActual, corpAnterior),
    total: indActual + corpActual, totalCambio: cambioPorcentual(indActual + corpActual, indAnterior + corpAnterior),
  };
}

// --- Clientes: nuevos por periodo, en serie ---------------------------------
export function serieClientesPorPeriodo(negocioId: NegocioId, periodo: Periodo) {
  if (periodo === "anio") {
    const meses: { mes: string; clientes: number }[] = [];
    for (let i = 11; i >= 0; i--) {
      const fecha = new Date(BASE_DATE.getFullYear(), BASE_DATE.getMonth() - i, 1);
      const label = MESES_LABEL[fecha.getMonth()];
      const clientes = clientesIndividualesPorNegocio(negocioId).filter((c) => {
        const f = new Date(c.fechaRegistro);
        return f.getMonth() === fecha.getMonth() && f.getFullYear() === fecha.getFullYear();
      }).length;
      meses.push({ mes: label, clientes });
    }
    return meses;
  }
  const dias = periodo === "mes" ? 30 : 7;
  const puntos: { mes: string; clientes: number }[] = [];
  for (let i = dias - 1; i >= 0; i--) {
    const fecha = new Date(BASE_DATE);
    fecha.setDate(fecha.getDate() - i);
    const clave = fecha.toISOString().slice(0, 10);
    const label = fecha.toLocaleDateString("es-PE", { day: "2-digit", month: "2-digit" });
    const clientes = clientesIndividualesPorNegocio(negocioId).filter((c) => c.fechaRegistro === clave).length;
    puntos.push({ mes: label, clientes });
  }
  return puntos;
}

// --- Hospedaje por periodo (Umaru) ------------------------------------------
function nochesDe(h: { checkIn: string; checkOut: string }): number {
  return Math.round((new Date(h.checkOut).getTime() - new Date(h.checkIn).getTime()) / 86400000);
}

export function resumenHospedajePeriodo(periodo: Periodo) {
  const dias = diasDelPeriodo(periodo);
  const enPeriodo = (offset: number) => HOSPEDAJES.filter((h) => enVentana(h.checkIn, dias, offset));
  const actual = enPeriodo(0);
  const anterior = enPeriodo(dias);
  const ingreso = (arr: typeof HOSPEDAJES) => arr.reduce((a, h) => a + nochesDe(h) * h.tarifaNoche, 0);
  const ingresoActual = ingreso(actual);
  const ingresoAnterior = ingreso(anterior);
  return {
    estadias: actual.length, estadiasCambio: cambioPorcentual(actual.length, anterior.length),
    noches: actual.reduce((a, h) => a + nochesDe(h), 0),
    ingreso: ingresoActual, ingresoCambio: cambioPorcentual(ingresoActual, ingresoAnterior),
  };
}

// Ingresos "de verdad" de un negocio en un periodo: reservas atendidas +
// delivery entregado + hospedaje (solo aplica a Umaru) — resumenPeriodo() no
// suma hospedaje porque nació para el resumen de Dirección/Ventas, que no lo
// necesitaban desglosado así; el Panel Gerencial sí necesita el ingreso real
// total del negocio, no solo la parte de reservas/pedidos.
export function ingresosTotalesPeriodo(negocioId: NegocioId, periodo: Periodo) {
  const dias = diasDelPeriodo(periodo);
  const reservasIngreso = (offset: number) =>
    reservasPorNegocio(negocioId)
      .filter((r) => enVentana(r.fecha, dias, offset) && r.estado === "atendida")
      .reduce((a, r) => a + (r.monto ?? 0), 0);
  const pedidosIngreso = (offset: number) =>
    PEDIDOS.filter((p) => p.negocioId === negocioId && enVentana(p.fecha, dias, offset) && p.estado === "entregado").reduce((a, p) => a + p.monto, 0);
  const hospedajeIngreso = (offset: number) =>
    HOSPEDAJES.filter((h) => h.negocioId === negocioId && enVentana(h.checkIn, dias, offset)).reduce((a, h) => a + nochesDe(h) * h.tarifaNoche, 0);

  const actual = reservasIngreso(0) + pedidosIngreso(0) + hospedajeIngreso(0);
  const anterior = reservasIngreso(dias) + pedidosIngreso(dias) + hospedajeIngreso(dias);
  return { total: actual, cambio: cambioPorcentual(actual, anterior) };
}

// Ticket promedio DEL periodo elegido — a diferencia de ticketPromedio()
// (histórico, todo el tiempo), esta sí responde al selector
// Diario/Semanal/Mensual/Anual, igual que sus 3 vecinas en el Panel
// Gerencial. Mismo criterio de "venta real" que ingresosTotalesPeriodo():
// reservas atendidas + pedidos entregados + hospedaje (si es Umaru).
export function ticketPromedioPeriodo(negocioId: NegocioId, periodo: Periodo): number {
  const dias = diasDelPeriodo(periodo);
  const reservasAtendidas = reservasPorNegocio(negocioId).filter(
    (r) => enVentana(r.fecha, dias, 0) && r.estado === "atendida"
  );
  const pedidosEntregados = PEDIDOS.filter(
    (p) => p.negocioId === negocioId && enVentana(p.fecha, dias, 0) && p.estado === "entregado"
  );
  const hospedajesDelPeriodo = HOSPEDAJES.filter((h) => h.negocioId === negocioId && enVentana(h.checkIn, dias, 0));

  const montos = [
    ...reservasAtendidas.map((r) => r.monto ?? 0),
    ...pedidosEntregados.map((p) => p.monto),
    ...hospedajesDelPeriodo.map((h) => nochesDe(h) * h.tarifaNoche),
  ];
  if (montos.length === 0) return 0;
  return Math.round(montos.reduce((a, b) => a + b, 0) / montos.length);
}

export function serieHospedajePorPeriodo(periodo: Periodo) {
  if (periodo === "anio") {
    const meses: { mes: string; estadias: number }[] = [];
    for (let i = 11; i >= 0; i--) {
      const fecha = new Date(BASE_DATE.getFullYear(), BASE_DATE.getMonth() - i, 1);
      const label = MESES_LABEL[fecha.getMonth()];
      const estadias = HOSPEDAJES.filter((h) => {
        const f = new Date(h.checkIn);
        return f.getMonth() === fecha.getMonth() && f.getFullYear() === fecha.getFullYear();
      }).length;
      meses.push({ mes: label, estadias });
    }
    return meses;
  }
  const dias = periodo === "mes" ? 30 : 7;
  const puntos: { mes: string; estadias: number }[] = [];
  for (let i = dias - 1; i >= 0; i--) {
    const fecha = new Date(BASE_DATE);
    fecha.setDate(fecha.getDate() - i);
    const clave = fecha.toISOString().slice(0, 10);
    const label = fecha.toLocaleDateString("es-PE", { day: "2-digit", month: "2-digit" });
    const estadias = HOSPEDAJES.filter((h) => h.checkIn === clave).length;
    puntos.push({ mes: label, estadias });
  }
  return puntos;
}

// --- Panel de Dirección: crecimiento del grupo, sin desglose por módulo ----
// Los socios en Lima no necesitan ver reservas ni delivery por separado —
// necesitan saber si el grupo está creciendo. 4 números, no más (siguiendo
// la práctica de dashboards ejecutivos: 3-5 métricas enfocadas en tendencia).
export interface ResumenCrecimientoGrupo {
  clientesTotales: number;
  clientesNuevos: number; clientesNuevosCambio: number | null;
  ingresos: number; ingresosCambio: number | null;
  negociosActivos: number;
}

export function resumenCrecimientoGrupo(periodo: Periodo): ResumenCrecimientoGrupo {
  const activos = NEGOCIOS.filter((n) => n.operando);
  const resumenes = activos.map((n) => resumenPeriodo(n.id, periodo));

  const clientesTotales = activos.reduce(
    (a, n) => a + clientesIndividualesPorNegocio(n.id).length + corporativosPorNegocio(n.id).length,
    0
  );
  const clientesNuevos = resumenes.reduce((a, r) => a + r.clientesNuevos, 0);
  const ingresos = resumenes.reduce((a, r) => a + r.ingresos, 0);

  const promedio = (valores: (number | null)[]) => {
    const validos = valores.filter((v): v is number => v !== null);
    return validos.length === 0 ? null : Math.round(validos.reduce((a, b) => a + b, 0) / validos.length);
  };

  return {
    clientesTotales,
    clientesNuevos,
    clientesNuevosCambio: promedio(resumenes.map((r) => r.clientesNuevosCambio)),
    ingresos,
    ingresosCambio: promedio(resumenes.map((r) => r.ingresosCambio)),
    negociosActivos: activos.length,
  };
}

// --- Panel Gerencial: cuántos clientes tiene cada tienda, en proporción -----
export function clientesPorNegocioTotales() {
  const conteos = NEGOCIOS.map((n) => ({
    negocio: n,
    clientes: clientesIndividualesPorNegocio(n.id).length + corporativosPorNegocio(n.id).length,
  }));
  const total = conteos.reduce((a, c) => a + c.clientes, 0);
  return conteos.map((c) => ({ ...c, porcentaje: total === 0 ? 0 : Math.round((c.clientes / total) * 100) }));
}

export function resumenNegocio(negocioId: NegocioId) {
  const clientes = clientesIndividualesPorNegocio(negocioId).length + corporativosPorNegocio(negocioId).length;
  const reservas = reservasSemana(negocioId);
  const pedidos = pedidosSemana(negocioId);
  const cumples = proximosCumpleanos(negocioId, BASE_DATE, 10).length;
  return {
    clientes,
    reservasSemana: reservas.total,
    pedidosSemana: pedidos.total,
    ingresosSemana: pedidos.monto + reservas.confirmadas * ticketPromedio(negocioId),
    proximosCumples: cumples,
    ticketPromedio: ticketPromedio(negocioId),
  };
}

// --- Módulo Estadísticas: dinámico por métrica (no solo ingresos) ----------
// Mijael pidió poder elegir qué mirar (ingresos, reservas, delivery,
// hospedaje, clientes nuevos) en vez de un reporte fijo — todo lo de acá
// abajo recibe `metrica` como parámetro y cambia de fuente de datos según
// cuál esté seleccionada en la UI.
export type MetricaEstadistica = "ingresos" | "reservas" | "delivery" | "hospedaje" | "clientes";

export const METRICAS_ESTADISTICA: { value: MetricaEstadistica; label: string; unidad: "dinero" | "conteo" }[] = [
  { value: "ingresos", label: "Ingresos", unidad: "dinero" },
  { value: "reservas", label: "Reservas", unidad: "conteo" },
  { value: "delivery", label: "Delivery", unidad: "conteo" },
  { value: "hospedaje", label: "Hospedaje", unidad: "conteo" },
  { value: "clientes", label: "Clientes nuevos", unidad: "conteo" },
];

// Valor de una métrica para un negocio en un mes calendario específico.
// "ingresos" combina reservas atendidas + pedidos entregados + hospedaje (si
// es Umaru) — mismo criterio que ingresosTotalesPeriodo(); las demás son un
// conteo simple de esa actividad puntual.
function valorDelMes(negocioId: NegocioId, metrica: MetricaEstadistica, anio: number, mes: number): number {
  const enElMes = (fechaISO: string) => {
    const f = new Date(fechaISO);
    return f.getFullYear() === anio && f.getMonth() === mes;
  };
  switch (metrica) {
    case "ingresos": {
      const reservas = reservasPorNegocio(negocioId).filter((r) => r.estado === "atendida" && enElMes(r.fecha)).reduce((a, r) => a + (r.monto ?? 0), 0);
      const pedidos = PEDIDOS.filter((p) => p.negocioId === negocioId && p.estado === "entregado" && enElMes(p.fecha)).reduce((a, p) => a + p.monto, 0);
      const hospedaje = HOSPEDAJES.filter((h) => h.negocioId === negocioId && enElMes(h.checkIn)).reduce((a, h) => a + nochesDe(h) * h.tarifaNoche, 0);
      return reservas + pedidos + hospedaje;
    }
    case "reservas":
      return reservasPorNegocio(negocioId).filter((r) => enElMes(r.fecha)).length;
    case "delivery":
      return PEDIDOS.filter((p) => p.negocioId === negocioId && enElMes(p.fecha)).length;
    case "hospedaje":
      return HOSPEDAJES.filter((h) => h.negocioId === negocioId && enElMes(h.checkIn)).length;
    case "clientes":
      return clientesIndividualesPorNegocio(negocioId).filter((c) => enElMes(c.fechaRegistro)).length;
  }
}

export interface PuntoMensual { mes: string; etiqueta: string; valor: number; [key: string]: string | number; }

// Tendencia mensual de la métrica elegida, últimos `meses` (12 por defecto).
// `etiqueta` incluye el año ("Dic 25") porque la ventana de 12 meses cruza
// dos años calendario — sin el año, un mes como diciembre puede leerse como
// "el diciembre que viene" en vez del que ya pasó dentro de la ventana.
export function serieMensualMetrica(negocioId: NegocioId, metrica: MetricaEstadistica, meses = 12): PuntoMensual[] {
  const out: PuntoMensual[] = [];
  for (let i = meses - 1; i >= 0; i--) {
    const fecha = new Date(BASE_DATE.getFullYear(), BASE_DATE.getMonth() - i, 1);
    const mesLabel = MESES_LABEL[fecha.getMonth()];
    out.push({
      mes: mesLabel,
      etiqueta: `${mesLabel} ${String(fecha.getFullYear()).slice(2)}`,
      valor: valorDelMes(negocioId, metrica, fecha.getFullYear(), fecha.getMonth()),
    });
  }
  return out;
}

// El mes con más y con menos actividad de la métrica elegida, de los
// últimos 12 — para la fila de insights destacados del módulo Estadísticas.
export function mejorYPeorMesMetrica(negocioId: NegocioId, metrica: MetricaEstadistica): { mejor: PuntoMensual | null; peor: PuntoMensual | null } {
  const conDatos = serieMensualMetrica(negocioId, metrica, 12).filter((p) => p.valor > 0);
  if (conDatos.length === 0) return { mejor: null, peor: null };
  return {
    mejor: conDatos.reduce((a, b) => (b.valor > a.valor ? b : a)),
    peor: conDatos.reduce((a, b) => (b.valor < a.valor ? b : a)),
  };
}

const DIAS_SEMANA_LABEL = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"]; // orden de Date.getDay()

export interface PuntoDiaSemana { dia: string; valor: number; [key: string]: string | number; }

// Actividad de la métrica elegida, agrupada por día de la semana sobre los
// últimos `meses` — muestra si el negocio vende más el fin de semana o entre
// semana. Se devuelve en orden Lunes→Domingo para que el gráfico se lea como
// una semana normal, no como empieza Date.getDay() (domingo=0).
export function actividadPorDiaSemanaMetrica(negocioId: NegocioId, metrica: MetricaEstadistica, meses = 12): PuntoDiaSemana[] {
  const desde = new Date(BASE_DATE);
  desde.setMonth(desde.getMonth() - meses);
  const conteos = Array.from({ length: 7 }, () => 0);
  const sumarPorDia = (fechaISO: string, valor = 1) => {
    const f = new Date(fechaISO);
    if (f >= desde && f <= BASE_DATE) conteos[f.getDay()] += valor;
  };

  switch (metrica) {
    case "ingresos":
      reservasPorNegocio(negocioId).filter((r) => r.estado === "atendida").forEach((r) => sumarPorDia(r.fecha, r.monto ?? 0));
      PEDIDOS.filter((p) => p.negocioId === negocioId && p.estado === "entregado").forEach((p) => sumarPorDia(p.fecha, p.monto));
      HOSPEDAJES.filter((h) => h.negocioId === negocioId).forEach((h) => sumarPorDia(h.checkIn, nochesDe(h) * h.tarifaNoche));
      break;
    case "reservas":
      reservasPorNegocio(negocioId).forEach((r) => sumarPorDia(r.fecha));
      break;
    case "delivery":
      PEDIDOS.filter((p) => p.negocioId === negocioId).forEach((p) => sumarPorDia(p.fecha));
      break;
    case "hospedaje":
      HOSPEDAJES.filter((h) => h.negocioId === negocioId).forEach((h) => sumarPorDia(h.checkIn));
      break;
    case "clientes":
      clientesIndividualesPorNegocio(negocioId).forEach((c) => sumarPorDia(c.fechaRegistro));
      break;
  }

  const ordenLunesADomingo = [1, 2, 3, 4, 5, 6, 0];
  return ordenLunesADomingo.map((dia) => ({ dia: DIAS_SEMANA_LABEL[dia], valor: conteos[dia] }));
}

// El mejor Y el peor día de la semana de la métrica elegida — Mijael pidió
// explícitamente poder ver también "los días malos", no solo el mejor.
export function mejorYPeorDiaSemanaMetrica(negocioId: NegocioId, metrica: MetricaEstadistica): { mejor: PuntoDiaSemana | null; peor: PuntoDiaSemana | null } {
  const conDatos = actividadPorDiaSemanaMetrica(negocioId, metrica).filter((d) => d.valor > 0);
  if (conDatos.length === 0) return { mejor: null, peor: null };
  return {
    mejor: conDatos.reduce((a, b) => (b.valor > a.valor ? b : a)),
    peor: conDatos.reduce((a, b) => (b.valor < a.valor ? b : a)),
  };
}
