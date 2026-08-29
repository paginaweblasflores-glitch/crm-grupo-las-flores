import { NegocioId } from "./types";
import { BASE_DATE } from "./mock/seed";
import { clientesIndividualesPorNegocio, corporativosPorNegocio } from "./mock/clientes";
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
const DIAS_SEMANA_CORTO = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"]; // orden de Date.getDay()

export interface ActividadItem {
  id: string;
  tipo: "cliente";
  titulo: string;
  detalle: string;
  fecha: string;
}

// Actividad reciente de relación con el cliente: nuevos registros — enfoque
// 100% CRM del sistema, sin hospedaje (eliminado junto con Reservas y
// Delivery).
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
  return [...clientesInd, ...clientesCorp]
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

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export interface RangoPeriodo { desde: string; hasta: string; desdeAnterior: string; hastaAnterior: string; }

// Rango real de un periodo. "mes"/"anio" son el mes/año de CALENDARIO en
// curso, desde el día 1 hasta hoy — no una ventana rodante de N días — así
// el texto ("agosto de 2026", "2026") y el cálculo dicen lo mismo. "anterior"
// es el mismo corte de fecha en el periodo previo (mismo día del mes/año
// anterior), para comparar manzanas con manzanas: 25 días de agosto vs 25
// días de julio, no vs los 31 días completos de julio. "dia"/"semana" se
// quedan rodantes (hoy exacto / últimos 7 días) — no tienen un "día 1" de
// calendario que le sirva a alguien operando el día a día.
export function rangoPeriodo(periodo: Periodo): RangoPeriodo {
  const hoy = BASE_DATE;
  if (periodo === "dia") {
    const ayer = new Date(hoy);
    ayer.setDate(ayer.getDate() - 1);
    return { desde: isoDate(hoy), hasta: isoDate(hoy), desdeAnterior: isoDate(ayer), hastaAnterior: isoDate(ayer) };
  }
  if (periodo === "semana") {
    const desde = new Date(hoy);
    desde.setDate(desde.getDate() - 6);
    const hastaAnterior = new Date(desde);
    hastaAnterior.setDate(hastaAnterior.getDate() - 1);
    const desdeAnterior = new Date(hastaAnterior);
    desdeAnterior.setDate(desdeAnterior.getDate() - 6);
    return { desde: isoDate(desde), hasta: isoDate(hoy), desdeAnterior: isoDate(desdeAnterior), hastaAnterior: isoDate(hastaAnterior) };
  }
  if (periodo === "mes") {
    const desde = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    const desdeAnterior = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1);
    const hastaAnterior = new Date(hoy.getFullYear(), hoy.getMonth() - 1, hoy.getDate());
    return { desde: isoDate(desde), hasta: isoDate(hoy), desdeAnterior: isoDate(desdeAnterior), hastaAnterior: isoDate(hastaAnterior) };
  }
  // "anio"
  const desde = new Date(hoy.getFullYear(), 0, 1);
  const desdeAnterior = new Date(hoy.getFullYear() - 1, 0, 1);
  const hastaAnterior = new Date(hoy.getFullYear() - 1, hoy.getMonth(), hoy.getDate());
  return { desde: isoDate(desde), hasta: isoDate(hoy), desdeAnterior: isoDate(desdeAnterior), hastaAnterior: isoDate(hastaAnterior) };
}

function enRango(fechaISO: string, desde: string, hasta: string): boolean {
  return fechaISO >= desde && fechaISO <= hasta;
}

// Texto del rango activo — mismo principio de mostrar la fecha explícita,
// nunca solo "vista mensual": "mes"/"anio" ahora son calendario real
// ("agosto de 2026" / "2026"), "dia"/"semana" siguen siendo rodantes
// (fecha exacta / rango de 7 días), como ya estaban.
export function rangoDelPeriodo(periodo: Periodo): string {
  if (periodo === "dia") {
    return BASE_DATE.toLocaleDateString("es-PE", { day: "2-digit", month: "long", year: "numeric" });
  }
  if (periodo === "mes") {
    return BASE_DATE.toLocaleDateString("es-PE", { month: "long", year: "numeric" });
  }
  if (periodo === "anio") {
    return String(BASE_DATE.getFullYear());
  }
  const dias = PERIODOS.find((p) => p.value === periodo)!.dias;
  const desde = new Date(BASE_DATE);
  desde.setDate(desde.getDate() - (dias - 1));
  const fmt = (d: Date, conAnio: boolean) =>
    d.toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: conAnio ? "numeric" : undefined });
  const mismoAnio = desde.getFullYear() === BASE_DATE.getFullYear();
  return `${fmt(desde, !mismoAnio)} – ${fmt(BASE_DATE, true)}`;
}

export function cambioPorcentual(actual: number, anterior: number): number | null {
  if (anterior === 0) return actual > 0 ? 100 : null;
  return Math.round(((actual - anterior) / anterior) * 100);
}

// Un solo día es una muestra demasiado chica para que un % signifique algo
// real (de 1 a 2 clientes ya es "+100%") — se omite el % en Diario en toda
// la app (tiles, comparativas por negocio), no se calcula "de verdad" para
// después ocultarlo con texto: directo no se calcula, así ningún consumidor
// puede mostrarlo por accidente.
function cambioPorcentualSiAplica(actual: number, anterior: number, periodo: Periodo): number | null {
  if (periodo === "dia") return null;
  return cambioPorcentual(actual, anterior);
}

// Etiqueta explícita del periodo de comparación — "vs. periodo anterior" no
// dice si es ayer, la semana pasada o julio sin mirar el selector aparte.
// "dia" no tiene etiqueta propia porque ese periodo ya no muestra
// comparación (ver cambioPorcentualSiAplica).
export function etiquetaPeriodoAnterior(periodo: Periodo): string {
  const hoy = BASE_DATE;
  if (periodo === "semana") {
    const hastaAnterior = new Date(hoy);
    hastaAnterior.setDate(hastaAnterior.getDate() - 7);
    const desdeAnterior = new Date(hastaAnterior);
    desdeAnterior.setDate(desdeAnterior.getDate() - 6);
    const fmt = (d: Date) => d.toLocaleDateString("es-PE", { day: "2-digit", month: "short" });
    return `la semana anterior (${fmt(desdeAnterior)} – ${fmt(hastaAnterior)})`;
  }
  if (periodo === "mes") {
    const anterior = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1);
    return anterior.toLocaleDateString("es-PE", { month: "long", year: "numeric" });
  }
  if (periodo === "anio") {
    return `el mismo periodo de ${hoy.getFullYear() - 1}`;
  }
  return "";
}

export interface ResumenPeriodo {
  clientesNuevos: number; clientesNuevosCambio: number | null;
}

export function resumenPeriodo(negocioId: NegocioId, periodo: Periodo): ResumenPeriodo {
  const { desde, hasta, desdeAnterior, hastaAnterior } = rangoPeriodo(periodo);
  const contarClientes = (d: string, h: string) =>
    clientesIndividualesPorNegocio(negocioId).filter((c) => enRango(c.fechaRegistro, d, h)).length;

  const clientesActual = contarClientes(desde, hasta);
  const clientesAnterior = contarClientes(desdeAnterior, hastaAnterior);

  return {
    clientesNuevos: clientesActual,
    clientesNuevosCambio: cambioPorcentualSiAplica(clientesActual, clientesAnterior, periodo),
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
  const { desde, hasta, desdeAnterior, hastaAnterior } = rangoPeriodo(periodo);
  const contar = (arr: { fechaRegistro: string }[], d: string, h: string) =>
    arr.filter((c) => enRango(c.fechaRegistro, d, h)).length;

  const individuales = clientesIndividualesPorNegocio(negocioId);
  const corporativos = corporativosPorNegocio(negocioId);

  const indActual = contar(individuales, desde, hasta);
  const indAnterior = contar(individuales, desdeAnterior, hastaAnterior);
  const corpActual = contar(corporativos, desde, hasta);
  const corpAnterior = contar(corporativos, desdeAnterior, hastaAnterior);

  return {
    individuales: indActual, individualesCambio: cambioPorcentualSiAplica(indActual, indAnterior, periodo),
    corporativos: corpActual, corporativosCambio: cambioPorcentualSiAplica(corpActual, corpAnterior, periodo),
    total: indActual + corpActual, totalCambio: cambioPorcentualSiAplica(indActual + corpActual, indAnterior + corpAnterior, periodo),
  };
}

// --- Clientes: nuevos por periodo, en serie ---------------------------------
export function serieClientesPorPeriodo(negocioId: NegocioId, periodo: Periodo) {
  if (periodo === "anio") {
    // Enero a diciembre del año en curso — los meses futuros dan 0 solos
    // (ningún fechaRegistro puede ser futuro), sin necesitar un guard
    // explícito.
    const meses: { mes: string; clientes: number }[] = [];
    for (let mesIdx = 0; mesIdx < 12; mesIdx++) {
      const clientes = clientesIndividualesPorNegocio(negocioId).filter((c) => {
        const f = new Date(c.fechaRegistro);
        return f.getMonth() === mesIdx && f.getFullYear() === BASE_DATE.getFullYear();
      }).length;
      meses.push({ mes: MESES_LABEL[mesIdx], clientes });
    }
    return meses;
  }
  if (periodo === "mes") {
    // Del día 1 del mes en curso hasta hoy — largo variable (ej. 25 puntos
    // el 25 de agosto), no una ventana fija de 30 días rodantes.
    const puntos: { mes: string; clientes: number }[] = [];
    const diasTranscurridos = BASE_DATE.getDate();
    for (let dia = 1; dia <= diasTranscurridos; dia++) {
      const fecha = new Date(BASE_DATE.getFullYear(), BASE_DATE.getMonth(), dia);
      const clave = isoDate(fecha);
      const label = `${dia} ${MESES_LABEL[fecha.getMonth()].toLowerCase()}`;
      const clientes = clientesIndividualesPorNegocio(negocioId).filter((c) => c.fechaRegistro === clave).length;
      puntos.push({ mes: label, clientes });
    }
    return puntos;
  }
  // "semana" (rodante, últimos 7 días) y "dia" (sin gráfico propio, pero se
  // calcula con el mismo criterio por si algún llamador lo pide)
  const puntos: { mes: string; clientes: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const fecha = new Date(BASE_DATE);
    fecha.setDate(fecha.getDate() - i);
    const clave = isoDate(fecha);
    const label = DIAS_SEMANA_CORTO[fecha.getDay()];
    const clientes = clientesIndividualesPorNegocio(negocioId).filter((c) => c.fechaRegistro === clave).length;
    puntos.push({ mes: label, clientes });
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
  // en el sistema (Hospedaje, la otra que hubo, se eliminó — ver Mijael).
  // Cubre solo a quienes cumplieron
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

// Tendencia de 12 meses de "Fidelización", del grupo o de UN negocio (mismo
// patrón de ventana rodante que serieClientesPorPeriodo). Cada uno de los
// 12 meses de la ventana aparece una sola vez, así que basta
// el número de mes calendario (sin año) para ubicar a quién le tocaba
// cumplir años ese mes — ver resumenCumpleanosHistoricoMes en
// mock/seguimiento.ts. `negocioId` por defecto es "todas" (Panel Ejecutivo);
// el Panel Gerencial la llama con un negocio específico para su propio
// histórico.
export function historialFidelizacionGrupo(negocioId: NegocioId = "todas"): PuntoFidelizacion[] {
  const activos = negocioId === "todas"
    ? NEGOCIOS.filter((n) => n.operando)
    : NEGOCIOS.filter((n) => n.id === negocioId);
  // Enero a diciembre del año en curso, no una ventana rodante de 12 meses —
  // "Anual" significa lo mismo acá que en Crecimiento (año de calendario).
  // A diferencia de Crecimiento, un mes futuro NO da 0 solo:
  // resumenCumpleanosHistoricoMes filtra por mes de NACIMIENTO (sin año, se
  // repite cada año), así que alguien nacido en diciembre aparecería aunque
  // diciembre de este año no haya llegado — por eso el guard explícito.
  const out: PuntoFidelizacion[] = [];
  for (let mesIdx = 0; mesIdx < 12; mesIdx++) {
    const esFuturo = mesIdx > BASE_DATE.getMonth();
    const totales = esFuturo ? [] : activos.map((n) => resumenCumpleanosHistoricoMes(n.id, mesIdx + 1));
    out.push({
      mes: MESES_LABEL[mesIdx],
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
// enero hasta el mes en curso (mismo año de calendario que Crecimiento).
export function resumenCumpleanosPeriodo(negocioId: NegocioId, periodo: Periodo): { enviados: number; convertidos: number } {
  if (periodo === "anio") {
    let enviados = 0;
    let convertidos = 0;
    for (let mes = 1; mes <= BASE_DATE.getMonth() + 1; mes++) {
      const t = resumenCumpleanosHistoricoMes(negocioId, mes);
      enviados += t.enviados;
      convertidos += t.convertidos;
    }
    return { enviados, convertidos };
  }
  const r = resumenCumpleanosMes(negocioId);
  return { enviados: r.enviados, convertidos: r.personasQueReservaron };
}

// --- Panel Gerencial: desglose por negocio (tipo genérico compartido) ------
export interface DesgloseNegocioMetrica {
  negocio: (typeof NEGOCIOS)[number];
  valor: number;
  porcentaje: number;
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
