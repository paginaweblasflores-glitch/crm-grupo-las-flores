import { SeguimientoCumple, NegocioId } from "@/lib/types";
import { CLIENTES_INDIVIDUALES } from "./clientes";
import { randBool, randInt, BASE_DATE, mulberry32 } from "./seed";

function esDeEsteMes(fechaISO: string): boolean {
  const [, mes] = fechaISO.split("-").map(Number);
  return mes === BASE_DATE.getMonth() + 1;
}

function generarSeguimiento(negocioId: NegocioId): SeguimientoCumple[] {
  // El seguimiento del mes se arma con quienes cumplen años este mes —
  // así el resumen que ve Mijael ("cuántos cumpleaños este mes") tiene
  // relación real con los datos, no una muestra aleatoria de la base.
  const clientes = CLIENTES_INDIVIDUALES.filter(
    (c) => c.negocioId === negocioId && esDeEsteMes(c.fechaNacimiento)
  );
  return clientes.map((cliente, i) => {
    const saludoEnviado = randBool(0.85);
    const visto = saludoEnviado && randBool(0.75);
    const respuesta: SeguimientoCumple["respuesta"] = !saludoEnviado
      ? "pendiente"
      : visto
        ? (randBool(0.4) ? "si" : "no")
        : "pendiente";
    const reservacion: SeguimientoCumple["reservacion"] = respuesta === "si" ? (randBool(0.55) ? "si" : "no") : "pendiente";
    return {
      id: `${negocioId}-seg-${i + 1}`,
      negocioId,
      clienteId: cliente.id,
      clienteTipo: "individual",
      nombre: `${cliente.nombres} ${cliente.apellidos}`,
      fechaCumple: cliente.fechaNacimiento,
      celular: cliente.celular,
      saludoEnviado,
      visto,
      respuesta,
      reservacion,
      adelantoReserva: reservacion === "si" ? randInt(20, 60) : undefined,
      montoConsumo: reservacion === "si" ? randInt(80, 320) : undefined,
    };
  });
}

// Mamina todavía no tiene el saludo automático de cumpleaños en operación
// (tampoco tiene cuenta de Ventas propia asignada todavía) — se queda sin
// seguimiento generado a propósito, en vez de simular datos que no existen.
export const SEGUIMIENTOS: SeguimientoCumple[] = [
  ...generarSeguimiento("las-flores"),
  ...generarSeguimiento("umaru"),
];

export function seguimientosPorNegocio(negocioId: NegocioId): SeguimientoCumple[] {
  if (negocioId === "todas") return SEGUIMIENTOS;
  return SEGUIMIENTOS.filter((s) => s.negocioId === negocioId);
}

// --- Historial de 12 meses (Panel Ejecutivo, filtro Anual) ------------------
// Offset fijo por negocio para armar una semilla propia por (negocio, mes) —
// ver abajo por qué.
const NEGOCIO_SEED_OFFSET: Partial<Record<NegocioId, number>> = { "las-flores": 1, umaru: 2 };

// Historial de conversión de saludos de cumpleaños para un mes calendario
// específico (por número de mes, no por año — el cumpleaños se repite cada
// año, así que "nació en marzo" basta para saber si cae en la ventana).
// Mamina se excluye igual que en SEGUIMIENTOS: su saludo automático de
// cumpleaños todavía no está operando, así que su historial es honestamente
// cero, no simulado. No devuelve filas individuales (SeguimientoCumple[])
// porque el único consumidor es un gráfico de tendencia — solo hacen falta
// los 2 totales agregados.
//
// Cada llamada arma su PROPIA instancia de mulberry32, con una semilla
// derivada de (negocioId, mes) — no un PRNG compartido que avanza con cada
// llamada. Esta función se usa de dos formas distintas en el mismo render
// (el total del grupo mes a mes, y la suma de 12 meses de UN negocio a la
// vez) — con un PRNG compartido, el orden de esas llamadas cambia cuántos
// números se han "consumido" antes de llegar a un mes/negocio dado, y el
// total del grupo terminaba sin coincidir con la suma de los negocios por
// separado. Con una semilla propia por (negocio, mes), el resultado de cada
// combinación es siempre el mismo sin importar desde dónde ni en qué orden
// se pida — el total y la suma por negocio siempre cuadran.
export function resumenCumpleanosHistoricoMes(negocioId: NegocioId, mes: number): { enviados: number; convertidos: number } {
  const offset = NEGOCIO_SEED_OFFSET[negocioId];
  if (offset === undefined) return { enviados: 0, convertidos: 0 };
  const clientes = CLIENTES_INDIVIDUALES.filter((c) => {
    const [, mesNac] = c.fechaNacimiento.split("-").map(Number);
    return c.negocioId === negocioId && mesNac === mes;
  });
  const rand = mulberry32(20260826 + offset * 1000 + mes);
  let enviados = 0;
  let convertidos = 0;
  // Mismas probabilidades que generarSeguimiento (0.85 / 0.75 / 0.4 / 0.55)
  // para que el historial sea consistente con el mes en curso que ya se ve.
  for (let i = 0; i < clientes.length; i++) {
    if (rand() >= 0.85) continue; // saludoEnviado
    enviados++;
    if (rand() >= 0.75) continue; // visto
    if (rand() >= 0.4) continue; // respuesta "sí"
    if (rand() < 0.55) convertidos++; // reservación "sí"
  }
  return { enviados, convertidos };
}

// Próximos cumpleaños (de toda la base, no solo los que ya tienen seguimiento armado)
export function proximosCumpleanos(negocioId: NegocioId, hoy: Date, rangoDias = 10) {
  const clientes = negocioId === "todas" ? CLIENTES_INDIVIDUALES : CLIENTES_INDIVIDUALES.filter((c) => c.negocioId === negocioId);
  const anio = hoy.getFullYear();
  return clientes
    .map((c) => {
      const [, mes, dia] = c.fechaNacimiento.split("-").map(Number);
      let proxima = new Date(anio, mes - 1, dia);
      if (proxima < new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate())) {
        proxima = new Date(anio + 1, mes - 1, dia);
      }
      const diffDias = Math.round((proxima.getTime() - hoy.getTime()) / 86400000);
      return { cliente: c, diffDias };
    })
    .filter((x) => x.diffDias >= 0 && x.diffDias <= rangoDias)
    .sort((a, b) => a.diffDias - b.diffDias);
}
