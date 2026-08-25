// Asistente de Estrategias — simulado. No hay una API de IA conectada de
// verdad todavía (el prototipo no tiene backend); esto arma respuestas útiles
// y concretas a partir de los datos reales del negocio (ver lib/metrics.ts),
// como para mostrar qué tan útil sería el agente una vez conectado.

import { NegocioId } from "./types";
import {
  resumenPeriodo, clientesPorTipoPeriodo, distribucionOrigen, resumenCumpleanosMes,
  ticketPromedio, pedidosPorPeriodo,
} from "./metrics";
import { campanasPorNegocio } from "./mock/campanas";

export function sugerenciasPara(negocioId: NegocioId): string[] {
  const base = [
    "Arma una campaña para el próximo mes",
    "¿Cómo van los cumpleaños de este mes?",
    "Ideas para subir el ticket promedio",
    "¿De dónde vienen mis clientes nuevos?",
    "¿Qué tal van las reservas este mes?",
  ];
  if (negocioId === "las-flores") base.push("¿Cómo van los pedidos por delivery?");
  return base;
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
      `${c.personasQueReservaron} terminaron reservando (S/ ${c.montoTotal.toLocaleString("es-PE")} generados) — una conversión de saludo a reserva de ${tasa}%.\n\n` +
      `Sugerencia: si la conversión está por debajo de 20%, prueba agregar un beneficio concreto al saludo (ej. "postre de cortesía" o "10% en tu consumo") en vez de solo felicitar — suele mover más a reservar. Puedes armar ese mensaje desde Mensajería.`
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

  if (p.includes("ticket") || p.includes("gasto promedio") || p.includes("consumo promedio")) {
    const ticket = ticketPromedio(negocioId);
    return (
      `El ticket promedio actual en ${negocioNombre} es S/ ${ticket}.\n\n` +
      `Ideas concretas para subirlo: (1) sugerir un combo o adicional al momento de la reserva/pedido, (2) crear un "menú del mes" con un plato de mayor margen, ` +
      `(3) ofrecer upgrade de mesa/experiencia para reservas de eventos. Si me dices cuál te interesa, te ayudo a armar cómo comunicarlo.`
    );
  }

  if (p.includes("delivery") || p.includes("pedido")) {
    const semana = pedidosPorPeriodo(negocioId, "semana");
    const mesPedidos = pedidosPorPeriodo(negocioId, "mes");
    return (
      `Delivery en ${negocioNombre}: ${semana.total} pedidos esta semana (S/ ${semana.monto.toLocaleString("es-PE")}), ${mesPedidos.total} en el mes.\n\n` +
      `Si ${semana.totalCambio !== null && semana.totalCambio < 0 ? "está bajando" : "quieres empujarlo más"}, una campaña dirigida solo a clientes que ya pidieron delivery antes (no a toda la base) suele convertir mejor que una general — puedo ayudarte a armar esa segmentación.`
    );
  }

  if (p.includes("reserva")) {
    return (
      `Reservas en ${negocioNombre} este mes: ${mes.reservas}${formatearCambioTexto(mes.reservasCambio)}.\n\n` +
      `Si están bajas, revisa qué días de la semana concentran menos reservas y prueba una promoción específica para esos días (2x1 entre semana, descuento en horario valle) en vez de una oferta general — suele rendir mejor.`
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
      `Para comparar los tres negocios lado a lado con números reales, usa el Tablero General (arriba del todo) — ahí ves clientes, reservas, ingresos y el comparativo por negocio con el mismo filtro de periodo. Desde aquí solo puedo hablarte del negocio que tienes seleccionado (${negocioNombre}).`
    );
  }

  return (
    `Puedo ayudarte con ${negocioNombre} sobre: armar una campaña, revisar cumpleaños del mes, ideas para el ticket promedio, cómo van las reservas o el delivery, y de dónde vienen tus clientes nuevos.\n\n` +
    `Prueba una de las sugerencias de abajo, o cuéntame con más detalle qué necesitas decidir.`
  );
}

function formatearCambioTexto(valor: number | null): string {
  if (valor === null) return "";
  return ` (${valor >= 0 ? "+" : ""}${valor}% vs. el mes anterior)`;
}
