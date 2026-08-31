import { SeguimientoCumple, ClienteIndividual, NegocioId } from "@/lib/types";
import { mulberry32 } from "./seed";

// Función pura — recibe el arreglo ya cargado (useData()) en vez de leerlo
// de una variable compartida a nivel de módulo (ver mock/clientes.ts para
// la explicación completa de por qué se abandonó ese patrón).
export function seguimientosPorNegocio(seguimientos: SeguimientoCumple[], negocioId: NegocioId): SeguimientoCumple[] {
  if (negocioId === "todas") return seguimientos;
  return seguimientos.filter((s) => s.negocioId === negocioId);
}

// --- Historial de 12 meses (Panel Ejecutivo, filtro Anual) ------------------
// Simulado a propósito: el sistema recién arranca, así que no hay datos
// reales de meses anteriores todavía — apenas se acumule suficiente
// historia real, esto se puede reemplazar por un resumen agregado de
// verdad. Offset fijo por negocio para armar una semilla propia por
// (negocio, mes).
const NEGOCIO_SEED_OFFSET: Partial<Record<NegocioId, number>> = { "las-flores": 1, umaru: 2 };

// Historial de conversión de saludos de cumpleaños para un mes calendario
// específico (por número de mes, no por año — el cumpleaños se repite cada
// año, así que "nació en marzo" basta para saber si cae en la ventana).
// Mamina se excluye igual que en el mes en curso: su saludo automático de
// cumpleaños todavía no está operando, así que su historial es honestamente
// cero, no simulado. No devuelve filas individuales (SeguimientoCumple[])
// porque el único consumidor es un gráfico de tendencia — solo hacen falta
// los 2 totales agregados.
export function resumenCumpleanosHistoricoMes(clientes: ClienteIndividual[], negocioId: NegocioId, mes: number): { enviados: number; convertidos: number } {
  // "todas" suma Las Flores + Umaru (Mamina siempre da 0 por el guard de
  // abajo) — necesario para que el Panel Gerencial pueda pedir el histórico
  // agregado del grupo con el mismo negocioId que usa en el resto del panel.
  if (negocioId === "todas") {
    const a = resumenCumpleanosHistoricoMes(clientes, "las-flores", mes);
    const b = resumenCumpleanosHistoricoMes(clientes, "umaru", mes);
    return { enviados: a.enviados + b.enviados, convertidos: a.convertidos + b.convertidos };
  }
  const offset = NEGOCIO_SEED_OFFSET[negocioId];
  if (offset === undefined) return { enviados: 0, convertidos: 0 };
  const clientesDelMes = clientes.filter((c) => {
    if (c.negocioId !== negocioId) return false;
    const [, mesNac] = c.fechaNacimiento.split("-").map(Number);
    return mesNac === mes;
  });
  const rand = mulberry32(20260826 + offset * 1000 + mes);
  let enviados = 0;
  let convertidos = 0;
  // Mismas probabilidades que el generador anterior (0.85 / 0.75 / 0.4 /
  // 0.55), para que el histórico simulado sea consistente con el mes en
  // curso real.
  for (let i = 0; i < clientesDelMes.length; i++) {
    if (rand() >= 0.85) continue; // saludoEnviado
    enviados++;
    if (rand() >= 0.75) continue; // "visto"
    if (rand() >= 0.4) continue; // respuesta "sí"
    if (rand() < 0.55) convertidos++; // reservación "sí"
  }
  return { enviados, convertidos };
}
