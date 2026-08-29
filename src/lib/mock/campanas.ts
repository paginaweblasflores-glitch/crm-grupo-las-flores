import { Campana, NegocioId } from "@/lib/types";
import { daysAgoISO, pickMany } from "./seed";
import { clientesIndividualesPorNegocio, corporativosPorNegocio } from "./clientes";

// Campañas históricas — ya se mandaron antes de que existiera este sistema,
// por eso nacen "aprobada" con el 100% de su segmento como contactado (no
// hay nada que editar ni aprobar en una campaña que ya pasó). Solo las que
// Gerencial arma desde el sistema (ver useCampanasCreadas) empiezan como
// "borrador" y tienen el ciclo completo editar → aprobar → enviar. Todas las
// históricas son de una sola sede — el histórico nunca tuvo una campaña de
// grupo, esa capacidad es nueva.
const NOMBRES: { nombre: string; mensaje: string; publico: Campana["publico"]; diasAtras: number }[] = [
  { nombre: "Bienvenida a nuevos clientes", mensaje: "¡Bienvenido/a a la familia! Como agradecimiento por registrarte, tienes un postre de cortesía en tu próxima visita 🌸", publico: "natural", diasAtras: 150 },
  { nombre: "Promoción de temporada baja", mensaje: "Este mes tenemos una promoción especial de temporada — 2x1 en platos seleccionados de lunes a jueves. ¡Te esperamos!", publico: "todos", diasAtras: 100 },
  { nombre: "Oferta para empresas", mensaje: "Para tu próximo evento corporativo tenemos un menú especial con descuento por volumen. Escríbenos y te armamos una propuesta.", publico: "corporativo", diasAtras: 60 },
  { nombre: "Reactivación fin de semana", mensaje: "Te extrañamos por acá — este fin de semana tenemos una carta especial. ¿Nos visitas?", publico: "natural", diasAtras: 20 },
];

function generarCampanas(negocioId: NegocioId): Campana[] {
  const individuales = clientesIndividualesPorNegocio(negocioId);
  const corporativos = corporativosPorNegocio(negocioId);

  const idsPara = (publico: Campana["publico"]): string[] => {
    if (publico === "natural") return individuales.map((c) => c.id);
    if (publico === "corporativo") return corporativos.map((c) => c.id);
    return [...individuales.map((c) => c.id), ...corporativos.map((c) => c.id)];
  };

  return NOMBRES.map((c, i) => {
    const todosLosIds = idsPara(c.publico);
    // Una campaña histórica no siempre alcanzó al 100% de su segmento — se
    // simula un alcance real (70-100%) en vez de fingir que llegó a todos.
    const alcance = todosLosIds.length === 0 ? [] : pickMany(todosLosIds, Math.max(1, Math.round(todosLosIds.length * 0.85)));
    return {
      id: `${negocioId}-camp-${i + 1}`,
      negocios: [negocioId] as NegocioId[],
      nombre: c.nombre,
      publico: c.publico,
      mensaje: c.mensaje,
      estado: "aprobada" as const,
      creadaEn: daysAgoISO(c.diasAtras + 3),
      aprobadaEn: daysAgoISO(c.diasAtras),
      clientesObjetivo: todosLosIds,
      contactados: alcance,
    };
  });
}

export const CAMPANAS: Campana[] = [
  ...generarCampanas("las-flores"),
  ...generarCampanas("umaru"),
  ...generarCampanas("mamina"),
];

// Mismo patrón que `festividadAlcanzaNegocio` — una campaña llega a un
// negocio si su alcance es "todas" o si ese negocio está en la lista.
export function campanaAlcanzaNegocio(c: Campana, negocioId: NegocioId): boolean {
  return c.negocios === "todas" || c.negocios.includes(negocioId);
}

export function campanasPorNegocio(negocioId: NegocioId): Campana[] {
  if (negocioId === "todas") return CAMPANAS;
  return CAMPANAS.filter((c) => campanaAlcanzaNegocio(c, negocioId));
}
