// Cálculo de frecuencia de un cliente — se cuentan sus hospedajes (el único
// registro de compra que queda en el sistema tras eliminar Reservas y
// Delivery). Para negocios sin hospedaje (Las Flores, Mamina) esto significa
// que, honestamente, el CRM ya no tiene ninguna señal de "visita" — es la
// consecuencia directa de esa decisión, no un error de cálculo.

import { ClienteIndividual, FrecuenciaClasificacion, NegocioId, ResumenCliente } from "./types";
import type { Tono } from "@/components/ui/Badge";
import { BASE_DATE } from "./mock/seed";
import { hospedajesDeCliente } from "./mock/hospedaje";
import { clientesIndividualesPorNegocio } from "./mock/clientes";

function diasDesde(fechaISO: string): number {
  const f = new Date(fechaISO);
  return Math.round((BASE_DATE.getTime() - f.getTime()) / 86400000);
}

export function resumenDeCliente(cliente: ClienteIndividual): ResumenCliente {
  const hospedajes = hospedajesDeCliente(cliente.id);

  const eventos: { fecha: string }[] = [
    ...hospedajes.map((h) => ({ fecha: h.checkOut })),
  ].filter((e) => new Date(e.fecha) <= BASE_DATE);

  const totalVisitas = eventos.length;
  const visitas30Dias = eventos.filter((e) => diasDesde(e.fecha) <= 30).length;

  const fechasOrdenadas = eventos.map((e) => e.fecha).sort((a, b) => (a < b ? 1 : -1));
  const ultimaVisita = fechasOrdenadas[0] ?? null;

  let clasificacion: FrecuenciaClasificacion;
  if (totalVisitas === 0) {
    clasificacion = "nuevo";
  } else if (ultimaVisita && diasDesde(ultimaVisita) > 90) {
    clasificacion = "inactivo";
  } else if (visitas30Dias >= 3) {
    clasificacion = "frecuente";
  } else {
    clasificacion = "ocasional";
  }

  return { totalVisitas, visitas30Dias, ultimaVisita, clasificacion };
}

export const ETIQUETA_CLASIFICACION: Record<FrecuenciaClasificacion, string> = {
  nuevo: "Cliente nuevo",
  ocasional: "Cliente ocasional",
  frecuente: "Cliente frecuente",
  inactivo: "Cliente inactivo",
};

export const COLOR_CLASIFICACION: Record<FrecuenciaClasificacion, Tono> = {
  nuevo: "azul",
  ocasional: "naranja",
  frecuente: "verde",
  inactivo: "gris",
};

// Cuántos clientes de un negocio caen en cada clasificación — reusa
// resumenDeCliente() cliente por cliente en vez de inventar una segunda
// forma de calcular frecuencia. Formato listo para DonutChart.
export function distribucionFrecuencia(negocioId: NegocioId): { nombre: string; valor: number }[] {
  const conteo: Record<FrecuenciaClasificacion, number> = { nuevo: 0, ocasional: 0, frecuente: 0, inactivo: 0 };
  clientesIndividualesPorNegocio(negocioId).forEach((c) => {
    conteo[resumenDeCliente(c).clasificacion] += 1;
  });
  return (Object.keys(conteo) as FrecuenciaClasificacion[])
    .filter((k) => conteo[k] > 0)
    .map((k) => ({ nombre: ETIQUETA_CLASIFICACION[k], valor: conteo[k] }));
}

// Cuántos clientes "volvieron" este mes: tuvieron al menos una visita en los
// últimos 30 días Y ya tenían historial antes de eso — así no se cuenta a
// alguien cuya única visita en la vida cayó, de casualidad, dentro del mes.
export function clientesQueVolvieronEsteMes(negocioId: NegocioId): number {
  return clientesIndividualesPorNegocio(negocioId).filter((c) => {
    const r = resumenDeCliente(c);
    return r.visitas30Dias > 0 && r.totalVisitas > r.visitas30Dias;
  }).length;
}
