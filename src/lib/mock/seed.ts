// PRNG determinístico (mulberry32) para que los datos simulados sean estables
// entre el render de servidor y el de cliente (evita mismatches de hidratación).

export function mulberry32(seed: number) {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(20260825);

export function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(rand() * arr.length)];
}

export function pickMany<T>(arr: readonly T[], n: number): T[] {
  const copy = [...arr];
  const out: T[] = [];
  for (let i = 0; i < n && copy.length > 0; i++) {
    const idx = Math.floor(rand() * copy.length);
    out.push(copy[idx]);
    copy.splice(idx, 1);
  }
  return out;
}

export function randInt(min: number, max: number): number {
  return Math.floor(rand() * (max - min + 1)) + min;
}

export function randFloat(min: number, max: number, decimals = 0): number {
  const v = rand() * (max - min) + min;
  const f = Math.pow(10, decimals);
  return Math.round(v * f) / f;
}

export function randBool(probTrue = 0.5): boolean {
  return rand() < probTrue;
}

export function daysAgoISO(days: number): string {
  const d = new Date(BASE_DATE);
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

export function daysAheadISO(days: number): string {
  return daysAgoISO(-days);
}

// "Hoy" para todo el sistema (periodos Diario/Semanal/Mensual/Anual,
// cumpleaños, comparativos, etc.) — dinámico, la fecha real del día en que
// se abre la app. Antes era una fecha congelada (25 de agosto de 2026) desde
// que el proyecto era pura demostración con datos ficticios; ahora que hay
// clientes reales registrándose en producción, congelar "hoy" hacía que un
// registro real de HOY quedara fuera de cualquier ventana de periodo (ej.
// "Ranking de asesores" de la semana) porque el sistema seguía pensando que
// era el 25 de agosto. Se recorta a medianoche local (sin horas/minutos)
// porque el resto del código ya asume eso — igual que la fecha congelada de
// antes, solo que ahora se recalcula cada vez que carga la página.
const hoy = new Date();
export const BASE_DATE = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());

export function randPhone(): string {
  return "9" + Array.from({ length: 8 }, () => randInt(0, 9)).join("");
}

export function randRuc(): string {
  return "20" + Array.from({ length: 9 }, () => randInt(0, 9)).join("");
}

export function pad(n: number, len = 2): string {
  return String(n).padStart(len, "0");
}

// --- Estacionalidad para reservas/pedidos/hospedaje -------------------------
// Sin esto, "qué mes vende más" o "qué día de la semana vende más" saldría
// puro ruido — con la semilla fija ya es estable, pero no cuenta una historia
// real. Los pesos siguen el calendario real de Ayacucho (mismas fechas que
// mock/festividades.ts), no una temporada genérica de restaurante: Semana
// Santa de Ayacucho es una de las más grandes y turísticas del Perú (cae en
// marzo/abril — Semana Santa está fija el 04-02 en festividades.ts), y
// Carnavales (14 de febrero) también trae bastante turismo a la ciudad — por
// eso febrero y marzo/abril son meses FUERTES, no flojos. El mes más flojo es
// setiembre: no hay ninguna festividad registrada cerca y ya pasó el impulso
// de Fiestas Patrias (28 de julio). Diciembre sube por el 9 de diciembre
// (Batalla de Ayacucho) y Navidad, pero no es el pico del año.
const PESO_MES: Record<number, number> = {
  0: 0.75,  // enero: post-fiestas, antes de Carnavales
  1: 1.3,   // febrero: Carnavales (14-feb) — turismo real en Ayacucho
  2: 1.3,   // marzo: previo a Semana Santa + aniversario Las Flores (15-mar)
  3: 1.35,  // abril: Semana Santa (02-abr) — el evento turístico más grande del año
  4: 0.9,   // mayo: Día de la Madre, sin más
  5: 0.85,  // junio: temporada baja
  6: 1.15,  // julio: Fiestas Patrias (28-jul)
  7: 0.9,   // agosto: temporada regular
  8: 0.7,   // setiembre: el mes más flojo, sin festividades cerca
  9: 0.75,  // octubre: sigue flojo
  10: 0.85, // noviembre: empieza a subir hacia diciembre
  11: 1.2,  // diciembre: 9 de diciembre + Navidad
};
const PESO_MAX_MES = Math.max(...Object.values(PESO_MES));

const PESO_DIA_SEMANA: Record<number, number> = {
  0: 0.9, 1: 0.6, 2: 0.65, 3: 0.75, 4: 0.85, 5: 1.3, 6: 1.4,
};
const PESO_MAX_DIA = Math.max(...Object.values(PESO_DIA_SEMANA));

const PESO_MAX = PESO_MAX_MES * PESO_MAX_DIA;

function pesoFecha(fechaISO: string): number {
  const d = new Date(fechaISO);
  return PESO_MES[d.getMonth()] * PESO_DIA_SEMANA[d.getDay()];
}

// Elige un "días atrás" dentro del rango, favoreciendo por rechazo ponderado
// las fechas que caen en meses/días de semana con más peso (ver arriba) — así
// la cantidad total generada sigue siendo la pedida, pero distribuida con una
// estacionalidad real en vez de uniforme.
export function randDiaConPeso(minDias: number, maxDias: number): number {
  let candidato = minDias;
  for (let intento = 0; intento < 25; intento++) {
    candidato = randInt(minDias, maxDias);
    const peso = pesoFecha(daysAgoISO(candidato));
    if (rand() < peso / PESO_MAX) return candidato;
  }
  return candidato;
}
