import { NegocioId } from "./types";
import { BASE_DATE } from "./mock/seed";
import { clientesIndividualesPorNegocio, corporativosPorNegocio } from "./mock/clientes";
import { HOSPEDAJES } from "./mock/hospedaje";
import { seguimientosPorNegocio, resumenCumpleanosHistoricoMes } from "./mock/seguimiento";
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

const MESES_LABEL = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Set", "Oct", "Nov", "Dic"];

export interface ActividadItem {
  id: string;
  tipo: "cliente" | "hospedaje";
  titulo: string;
  detalle: string;
  fecha: string;
}

// Actividad reciente de relación con el cliente: nuevos registros (el
// enfoque 100% CRM del sistema) más hospedaje, el único módulo de estancia
// que queda tras eliminar Reservas y Delivery.
export function actividadReciente(negocioId: NegocioId, n = 6): ActividadItem[] {
  const clientesInd: ActividadItem[] = clientesIndividualesPorNegocio(negocioId).map((c) => ({
    id: c.id,
    tipo: "cliente",
    titulo: `Nuevo cliente: ${c.nombres} ${c.apellidos}`,
    detalle: `Individual · ${c.origen.replace(/-/g, " ")}`,
    fecha: c.fechaRegistro,
  }));
  const clientesCorp: ActividadItem[] = corporativosPorNegocio(negocioId).map((c) => ({
    id: c.id,
    tipo: "cliente",
    titulo: `Nuevo cliente: ${c.razonSocial}`,
    detalle: "Corporativo",
    fecha: c.fechaRegistro,
  }));
  const hospedajes: ActividadItem[] = HOSPEDAJES.filter((h) => h.negocioId === negocioId).map((h) => ({
    id: h.id,
    tipo: "hospedaje",
    titulo: `Hospedaje de ${h.clienteNombre}`,
    detalle: `Hab. ${h.habitacion}`,
    fecha: h.checkIn,
  }));
  return [...clientesInd, ...clientesCorp, ...hospedajes]
    .sort((a, b) => (a.fecha < b.fecha ? 1 : -1))
    .slice(0, n);
}

// Lo único que Dirección/Gerencial necesita del módulo de Cumpleaños: cuántos
// saludos se mandaron este mes y cuántos terminaron en una visita — números
// de fidelización, no de plata. Este campo "reservación" es propio del
// seguimiento de cumpleaños (si el cliente terminó visitando tras el
// saludo), no del módulo Reservas — es independiente y no se ve afectado por
// su eliminación.
export function resumenCumpleanosMes(negocioId: NegocioId) {
  const seguimientos = seguimientosPorNegocio(negocioId);
  const enviados = seguimientos.filter((s) => s.saludoEnviado).length;
  const reservaron = seguimientos.filter((s) => s.reservacion === "si");
  return {
    totalDelMes: seguimientos.length,
    enviados,
    personasQueReservaron: reservaron.length,
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
}

export function resumenPeriodo(negocioId: NegocioId, periodo: Periodo): ResumenPeriodo {
  const dias = PERIODOS.find((p) => p.value === periodo)!.dias;

  const contarClientes = (offset: number) =>
    clientesIndividualesPorNegocio(negocioId).filter((c) => enVentana(c.fechaRegistro, dias, offset)).length;

  const clientesActual = contarClientes(0);
  const clientesAnterior = contarClientes(dias);

  return {
    clientesNuevos: clientesActual,
    clientesNuevosCambio: cambioPorcentual(clientesActual, clientesAnterior),
  };
}

// --- Distribuciones para gráficos de dona por módulo -----------------------
// Única fuente de las etiquetas de canal de registro — antes había una
// segunda copia divergente en PanelGerencial.tsx, se consolidó acá.
export const ORIGEN_LABEL: Record<string, string> = {
  crm: "CRM (presencial)",
  web: "Sitio web",
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
  return {
    estadias: actual.length, estadiasCambio: cambioPorcentual(actual.length, anterior.length),
    noches: actual.reduce((a, h) => a + nochesDe(h), 0),
  };
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
// Los socios en Lima no necesitan ver el detalle operativo — necesitan saber
// si el grupo está creciendo en clientes. Enfoque 100% CRM: sin ingresos
// consolidados (decisión de Mijael al eliminar Reservas/Delivery).
export interface ResumenCrecimientoGrupo {
  clientesTotales: number;
  clientesNuevos: number; clientesNuevosCambio: number | null;
  // "Volvió" se mide con la conversión de saludos de cumpleaños
  // (resumenCumpleanosMes) porque es la única señal de "visita" que existe
  // por igual en los 3 negocios — a diferencia de hospedaje, que solo
  // existe para Umaru (ver frecuencia.ts). Cubre solo a quienes cumplieron
  // años este mes y recibieron el saludo, no a toda la cartera — es un
  // proxy honesto, no "todas las visitas del grupo". El denominador es
  // `enviados` (saludos que de verdad salieron), no `totalDelMes` (todos
  // los que cumplen años este mes, incluidos los que aún no llegan a su
  // fecha) — así "de X saludos, Y confirmaron" describe saludos reales.
  cumpleanosConvertidos: number;
  cumpleanosEnviados: number;
  negociosActivos: number;
}

export function resumenCrecimientoGrupo(periodo: Periodo): ResumenCrecimientoGrupo {
  const activos = NEGOCIOS.filter((n) => n.operando);
  const resumenes = activos.map((n) => resumenPeriodo(n.id, periodo));
  const cumpleanos = activos.map((n) => resumenCumpleanosMes(n.id));

  const clientesTotales = activos.reduce(
    (a, n) => a + clientesIndividualesPorNegocio(n.id).length + corporativosPorNegocio(n.id).length,
    0
  );
  const clientesNuevos = resumenes.reduce((a, r) => a + r.clientesNuevos, 0);
  const cumpleanosConvertidos = cumpleanos.reduce((a, c) => a + c.personasQueReservaron, 0);
  const cumpleanosEnviados = cumpleanos.reduce((a, c) => a + c.enviados, 0);

  const promedio = (valores: (number | null)[]) => {
    const validos = valores.filter((v): v is number => v !== null);
    return validos.length === 0 ? null : Math.round(validos.reduce((a, b) => a + b, 0) / validos.length);
  };

  return {
    clientesTotales,
    clientesNuevos,
    clientesNuevosCambio: promedio(resumenes.map((r) => r.clientesNuevosCambio)),
    cumpleanosConvertidos,
    cumpleanosEnviados,
    negociosActivos: activos.length,
  };
}

export interface PuntoFidelizacion { mes: string; convertidos: number; enviados: number; [key: string]: string | number; }

// Tendencia de 12 meses de "Fidelización" para el grupo (mismo patrón de
// ventana rodante que serieClientesPorPeriodo/serieMensualMetrica). Cada uno
// de los 12 meses de la ventana aparece una sola vez, así que basta el
// número de mes calendario (sin año) para ubicar a quién le tocaba cumplir
// años ese mes — ver resumenCumpleanosHistoricoMes en mock/seguimiento.ts.
export function historialFidelizacionGrupo(meses = 12): PuntoFidelizacion[] {
  const activos = NEGOCIOS.filter((n) => n.operando);
  const out: PuntoFidelizacion[] = [];
  for (let i = meses - 1; i >= 0; i--) {
    const fecha = new Date(BASE_DATE.getFullYear(), BASE_DATE.getMonth() - i, 1);
    const totales = activos.map((n) => resumenCumpleanosHistoricoMes(n.id, fecha.getMonth() + 1));
    out.push({
      mes: MESES_LABEL[fecha.getMonth()],
      enviados: totales.reduce((a, t) => a + t.enviados, 0),
      convertidos: totales.reduce((a, t) => a + t.convertidos, 0),
    });
  }
  return out;
}

// Fidelización de UN negocio, respetando el mismo filtro Mensual/Anual que ya
// usa "Comparativo por negocio" (clientesPorTipoPeriodo) — así ambas
// tarjetas de comparativo por sede se mueven juntas con el mismo selector.
// En Mensual usa el mes en curso real (resumenCumpleanosMes); en Anual suma
// los 12 meses del historial (resumenCumpleanosHistoricoMes).
export function resumenCumpleanosPeriodo(negocioId: NegocioId, periodo: Periodo): { enviados: number; convertidos: number } {
  if (periodo === "anio") {
    let enviados = 0;
    let convertidos = 0;
    for (let i = 0; i < 12; i++) {
      const fecha = new Date(BASE_DATE.getFullYear(), BASE_DATE.getMonth() - i, 1);
      const t = resumenCumpleanosHistoricoMes(negocioId, fecha.getMonth() + 1);
      enviados += t.enviados;
      convertidos += t.convertidos;
    }
    return { enviados, convertidos };
  }
  const r = resumenCumpleanosMes(negocioId);
  return { enviados: r.enviados, convertidos: r.personasQueReservaron };
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

// --- Módulo Estadísticas: dinámico por métrica ------------------------------
// Tras eliminar Reservas y Delivery, "ingresos" deja de existir como
// concepto (enfoque 100% CRM) — solo quedan las métricas que sí tienen una
// fuente de datos real: Hospedaje (solo Umaru) y Clientes nuevos (los 3
// negocios). Los paneles anclan a "clientes" por defecto y a veces ni
// siquiera muestran el selector, pero la infraestructura queda genérica por
// si se necesita en más lugares.
export type MetricaEstadistica = "hospedaje" | "clientes";

export const METRICAS_ESTADISTICA: { value: MetricaEstadistica; label: string; unidad: "dinero" | "conteo" }[] = [
  { value: "hospedaje", label: "Hospedaje", unidad: "conteo" },
  { value: "clientes", label: "Clientes nuevos", unidad: "conteo" },
];

// Valor de una métrica para un negocio en un mes calendario específico.
function valorDelMes(negocioId: NegocioId, metrica: MetricaEstadistica, anio: number, mes: number): number {
  const enElMes = (fechaISO: string) => {
    const f = new Date(fechaISO);
    return f.getFullYear() === anio && f.getMonth() === mes;
  };
  switch (metrica) {
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
// últimos 12 — para la fila de insights destacados del panel.
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
// últimos `meses` — muestra si el negocio capta más el fin de semana o entre
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

// --- Panel Gerencial: desglose por negocio de la métrica elegida -----------
// Para "Todas las sucursales" — cuánto aporta cada sede real a la métrica
// elegida, en la misma ventana de 12 meses que el resto de los insights de
// esa métrica. Mismo patrón de barras que clientesPorNegocioTotales().
export interface DesgloseNegocioMetrica {
  negocio: (typeof NEGOCIOS)[number];
  valor: number;
  porcentaje: number;
}

export function desglosePorNegocioMetrica(metrica: MetricaEstadistica): DesgloseNegocioMetrica[] {
  const conteos = NEGOCIOS.map((n) => ({
    negocio: n,
    valor: serieMensualMetrica(n.id, metrica, 12).reduce((a, p) => a + p.valor, 0),
  }));
  const total = conteos.reduce((a, c) => a + c.valor, 0);
  return conteos
    .map((c) => ({ ...c, porcentaje: total === 0 ? 0 : Math.round((c.valor / total) * 100) }))
    .sort((a, b) => b.valor - a.valor);
}

// --- Panel Gerencial: registros por canal web, desglosados por sede --------
// Bajo "Todas las sucursales" — cuántos clientes llegaron por la web de cada
// negocio. "Web" ya es un valor único de `origen` (no hace falta un valor
// distinto por sede: un cliente ya pertenece a un solo negocio, así que
// cruzar origen==="web" con negocioId ya da "web de Las Flores/Umaru/Mamina"
// sin inflar el enum de origen).
export function origenWebPorNegocio(): DesgloseNegocioMetrica[] {
  const conteos = NEGOCIOS.map((n) => ({
    negocio: n,
    valor: clientesIndividualesPorNegocio(n.id).filter((c) => c.origen === "web").length,
  }));
  const total = conteos.reduce((a, c) => a + c.valor, 0);
  return conteos
    .map((c) => ({ ...c, porcentaje: total === 0 ? 0 : Math.round((c.valor / total) * 100) }))
    .sort((a, b) => b.valor - a.valor);
}
