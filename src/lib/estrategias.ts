// Asistente de Estrategias — simulado. No hay una API de IA conectada de
// verdad todavía (el prototipo no tiene backend); esto arma respuestas útiles
// y concretas a partir de los datos reales del negocio (ver lib/metrics.ts),
// como para mostrar qué tan útil sería el agente una vez conectado.

import { NegocioId } from "./types";
import {
  resumenPeriodo, clientesPorTipoPeriodo, distribucionOrigen, resumenCumpleanosMes,
} from "./metrics";
import { clientesQueVolvieronEsteMes, distribucionFrecuencia } from "./frecuencia";
import { campanasPorNegocio } from "./mock/campanas";

export function sugerenciasPara(): string[] {
  return [
    "Arma una campaña para el próximo mes",
    "¿Cómo van los cumpleaños de este mes?",
    "Ideas para que vuelvan más clientes",
    "¿De dónde vienen mis clientes nuevos?",
  ];
}

function origenPrincipal(negocioId: NegocioId): { nombre: string; valor: number } | null {
  const distrib = distribucionOrigen(negocioId);
  if (distrib.length === 0) return null;
  return [...distrib].sort((a, b) => b.valor - a.valor)[0];
}

export function generarRespuesta(prompt: string, negocioId: NegocioId, negocioNombre: string): string {
  const p = prompt.toLowerCase();
  const mes = resumenPeriodo(negocioId, "mes");

  if (p.includes("cumpleañ") || p.includes("cumplea")) {
    const c = resumenCumpleanosMes(negocioId);
    const tasa = c.enviados === 0 ? 0 : Math.round((c.personasQueReservaron / c.enviados) * 100);
    return (
      `Este mes en ${negocioNombre}: ${c.totalDelMes} clientes cumplen años, se enviaron ${c.enviados} saludos y ` +
      `${c.personasQueReservaron} terminaron visitando — una conversión de saludo a visita de ${tasa}%.\n\n` +
      `Sugerencia: si la conversión está por debajo de 20%, prueba agregar un beneficio concreto al saludo (ej. "postre de cortesía") en vez de solo felicitar — suele mover más a visitar. Puedes armar ese mensaje desde Mensajería.`
    );
  }

  if (p.includes("campaña") || p.includes("campana") || p.includes("promoci")) {
    const origen = origenPrincipal(negocioId);
    const campanas = campanasPorNegocio(negocioId);
    const ultima = campanas[campanas.length - 1];
    const alcanceUltima = ultima ? Math.round((ultima.enviados / ultima.totalClientes) * 100) : null;
    return (
      `Propuesta de campaña para ${negocioNombre}:\n\n` +
      `1. Canal: ${origen ? `WhatsApp — es donde más te llegan clientes ahora mismo (origen principal: "${origen.nombre}", ${origen.valor} clientes)` : "WhatsApp, por ser el canal más directo"}.\n` +
      `2. Base: ${mes.clientesNuevos} clientes nuevos este mes son un buen segmento para una oferta de "bienvenida" o "vuelve pronto".\n` +
      `3. Referencia: tu última campaña (${ultima ? ultima.mes : "sin datos"}) alcanzó ${alcanceUltima ?? "—"}% de la base — apunta a superar ese número.\n\n` +
      `¿Quieres que arme el texto del mensaje para esa campaña? Dime el motivo (ej. temporada baja, nuevo plato, fin de semana) y te doy 2-3 opciones de copy.`
    );
  }

  if (p.includes("vuelv") || p.includes("retenci") || p.includes("frecuen")) {
    const volvieron = clientesQueVolvieronEsteMes(negocioId);
    const distrib = distribucionFrecuencia(negocioId);
    const inactivos = distrib.find((d) => d.nombre === "Cliente inactivo")?.valor ?? 0;
    return (
      `Este mes volvieron ${volvieron} clientes en ${negocioNombre}${inactivos > 0 ? `, y tienes ${inactivos} clientes inactivos (sin visitas en más de 90 días)` : ""}.\n\n` +
      `Ideas concretas: (1) manda un mensaje directo a los clientes inactivos con un motivo concreto para volver (no un saludo genérico), (2) revisa si los cumpleaños de este mes ya recibieron su saludo — suele ser el gancho más fácil, ` +
      `(3) si tienes una fecha festiva cerca, arma una campaña dirigida solo a los que no han vuelto en un tiempo. Dime cuál te interesa y te ayudo a armarla.`
    );
  }

  if (p.includes("cliente")) {
    const tipo = clientesPorTipoPeriodo(negocioId, "mes");
    const origen = origenPrincipal(negocioId);
    return (
      `Este mes llegaron ${tipo.total} clientes nuevos a ${negocioNombre} (${tipo.individuales} individuales, ${tipo.corporativos} corporativos).` +
      (origen ? ` La mayoría vienen de "${origen.nombre}" (${origen.valor} en total, histórico).` : "") +
      `\n\nSi quieres crecer más rápido, vale la pena reforzar justo ese canal (más presupuesto o contenido ahí) antes que repartir esfuerzo parejo entre todos los canales.`
    );
  }

  if (p.includes("negocio") && p.includes("atenci")) {
    return (
      `Para comparar los tres negocios lado a lado con números reales, usa el Panel Principal (arriba del todo) — ahí ves clientes y el comparativo por negocio con el mismo filtro de periodo. Desde aquí solo puedo hablarte del negocio que tienes seleccionado (${negocioNombre}).`
    );
  }

  return (
    `Puedo ayudarte con ${negocioNombre} sobre: armar una campaña, revisar cumpleaños del mes, ideas para que vuelvan más clientes, y de dónde vienen tus clientes nuevos.\n\n` +
    `Prueba una de las sugerencias de abajo, o cuéntame con más detalle qué necesitas decidir.`
  );
}
