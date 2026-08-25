// Ayudantes para que el seguimiento de cumpleaños incluya también a los
// clientes recién registrados desde el sistema (no solo los del catálogo
// mock) — así, apenas Ventas registra un cliente nuevo, si su cumpleaños cae
// este mes ya aparece en el seguimiento con el saludo automático "armado"
// (plantilla + hora general), sin que nadie tenga que configurarlo a mano.

import { ClienteIndividual, SeguimientoCumple, NegocioId } from "./types";
import { BASE_DATE } from "./mock/seed";

export function mesDe(fechaISO: string): number {
  return Number(fechaISO.split("-")[1]);
}

export function diaDe(fechaISO: string): number {
  return Number(fechaISO.split("-")[2]);
}

export function esDeEsteMes(fechaISO: string): boolean {
  return mesDe(fechaISO) === BASE_DATE.getMonth() + 1;
}

export function esHoy(fechaISO: string): boolean {
  return mesDe(fechaISO) === BASE_DATE.getMonth() + 1 && diaDe(fechaISO) === BASE_DATE.getDate();
}

export function seguimientoDefectoPara(cliente: ClienteIndividual): SeguimientoCumple {
  return {
    id: `${cliente.negocioId}-seg-nuevo-${cliente.id}`,
    negocioId: cliente.negocioId,
    clienteId: cliente.id,
    clienteTipo: "individual",
    nombre: `${cliente.nombres} ${cliente.apellidos}`,
    fechaCumple: cliente.fechaNacimiento,
    celular: cliente.celular,
    saludoEnviado: false,
    visto: false,
    respuesta: "pendiente",
    reservacion: "pendiente",
  };
}

// Combina el seguimiento ya armado (mock) con los clientes nuevos de este
// mes que todavía no tenían una fila de seguimiento.
export function seguimientosConNuevos(
  base: SeguimientoCumple[],
  clientesCreados: ClienteIndividual[],
  negocioId: NegocioId
): SeguimientoCumple[] {
  const idsExistentes = new Set(base.map((s) => s.clienteId));
  const nuevos = clientesCreados
    .filter((c) => c.negocioId === negocioId && esDeEsteMes(c.fechaNacimiento) && !idsExistentes.has(c.id))
    .map(seguimientoDefectoPara);
  return [...base, ...nuevos];
}

// Igual que proximosCumpleanos() de mock/seguimiento.ts, pero sobre cualquier
// lista de clientes (para poder incluir a los recién registrados desde el sistema).
export function proximosCumpleanosDe(clientes: ClienteIndividual[], hoy: Date, rangoDias = 10) {
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

// Todos los clientes (mock + recién registrados) que cumplen años en un mes dado.
export function clientesPorMes(clientes: ClienteIndividual[], mes: number): ClienteIndividual[] {
  return clientes.filter((c) => mesDe(c.fechaNacimiento) === mes);
}

// Los que cumplen años en un día exacto de ese mes.
export function clientesPorDia(clientes: ClienteIndividual[], mes: number, dia: number): ClienteIndividual[] {
  return clientes.filter((c) => mesDe(c.fechaNacimiento) === mes && diaDe(c.fechaNacimiento) === dia);
}
