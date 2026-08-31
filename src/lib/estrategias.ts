// Asistente de Estrategias — simulado. No hay una API de IA conectada de
// verdad todavía (el prototipo no tiene backend); esto arma respuestas útiles
// y concretas a partir de los datos reales del negocio (ver lib/metrics.ts),
// como para mostrar qué tan útil sería el agente una vez conectado.

import { NegocioId } from "./types";
import {
  resumenPeriodo, clientesPorTipoPeriodo, distribucionOrigen, resumenCumpleanosMes, DatosMetricas,
} from "./metrics";
import { campanasPorNegocio } from "./mock/campanas";
import { Campana } from "./types";

export function sugerenciasPara(): string[] {
  return [
    "Arma una campaña para el próximo mes",
    "¿Cómo van los cumpleaños de este mes?",
    "Ideas para que vuelvan más clientes",
    "¿De dónde vienen mis clientes nuevos?",
  ];
}

function origenPrincipal(datos: DatosMetricas, negocioId: NegocioId): { nombre: string; valor: number } | null {
  const distrib = distribucionOrigen(datos, negocioId);
  if (distrib.length === 0) return null;
  return [...distrib].sort((a, b) => b.valor - a.valor)[0];
}

export function generarRespuesta(
  prompt: string,
  datos: DatosMetricas,
  campanasTodas: Campana[],
  negocioId: NegocioId,
  negocioNombre: string
): string {
  const p = prompt.toLowerCase();
  const mes = resumenPeriodo(datos, negocioId, "mes");

  if (p.includes("cumpleañ") || p.includes("cumplea")) {
    const c = resumenCumpleanosMes(datos, negocioId);
    const tasa = c.enviados === 0 ? 0 : Math.round((c.personasQueReservaron / c.enviados) * 100);
    return (
      `Este mes en ${negocioNombre}: ${c.totalDelMes} clientes cumplen años, se enviaron ${c.enviados} saludos y ` +
      `${c.personasQueReservaron} terminaron visitando — una conversión de saludo a visita de ${tasa}%.\n\n` +
      `Sugerencia: si la conversión está por debajo de 20%, prueba agregar un beneficio concreto al saludo (ej. "postre de cortesía") en vez de solo felicitar — suele mover más a visitar. Puedes armar ese mensaje desde Mensajería.`
    );
  }

  if (p.includes("campaña") || p.includes("campana") || p.includes("promoci")) {
    const origen = origenPrincipal(datos, negocioId);
    const campanas = campanasPorNegocio(campanasTodas, negocioId);
    const ultima = campanas[campanas.length - 1];
    const alcanceUltima = ultima?.clientesObjetivo?.length
      ? Math.round(((ultima.contactados?.length ?? 0) / ultima.clientesObjetivo.length) * 100)
      : null;
    return (
      `Propuesta de campaña para ${negocioNombre}:\n\n` +
      `1. Segmento: ${mes.clientesNuevos} clientes nuevos este mes son una buena base para una oferta de "bienvenida" o "vuelve pronto" — arma la campaña con público "Clientes naturales" o "Todos" según el caso.\n` +
      `2. Canal: WhatsApp — es el único canal donde el sistema puede abrirte la conversación ya armada con el número y el mensaje cargados${origen ? ` (además, tu origen principal hoy es "${origen.nombre}", ${origen.valor} clientes)` : ""}.\n` +
      `3. Referencia: tu última campaña ("${ultima?.nombre ?? "sin datos"}") ${alcanceUltima !== null ? `contactó ${alcanceUltima}% de su segmento` : "todavía no tiene contactos registrados"} — apunta a superar ese número.\n\n` +
      `¿Quieres que arme el texto del mensaje para esa campaña? Dime el motivo (ej. temporada baja, nuevo plato, fin de semana) y te doy 2-3 opciones de copy — luego la creas como borrador en Campañas y la apruebas cuando esté lista.`
    );
  }

  if (p.includes("vuelv") || p.includes("retenci") || p.includes("frecuen")) {
    // La conversión de saludo de cumpleaños en visita es la única señal de
    // "volvió" que existe en el sistema (Hospedaje, la otra que hubo, se
    // eliminó) — misma cuenta que usa la rama de "cumpleañ" arriba.
    const c = resumenCumpleanosMes(datos, negocioId);
    const tasa = c.enviados === 0 ? 0 : Math.round((c.personasQueReservaron / c.enviados) * 100);
    return (
      `La única señal de "volvió" que tiene hoy el CRM es la conversión de saludo de cumpleaños en visita: este mes en ${negocioNombre} se enviaron ${c.enviados} saludos y ${c.personasQueReservaron} terminaron visitando (${tasa}%).\n\n` +
      `Ideas concretas: (1) si la conversión está por debajo de 20%, agrega un beneficio concreto al saludo (ej. "postre de cortesía") en vez de solo felicitar, (2) revisa si los cumpleaños de este mes ya recibieron su saludo — suele ser el gancho más fácil, ` +
      `(3) si tienes una fecha festiva cerca, arma una campaña dirigida a reforzar ese mismo gancho. Dime cuál te interesa y te ayudo a armarla.`
    );
  }

  if (p.includes("cliente")) {
    const tipo = clientesPorTipoPeriodo(datos, negocioId, "mes");
    const origen = origenPrincipal(datos, negocioId);
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
