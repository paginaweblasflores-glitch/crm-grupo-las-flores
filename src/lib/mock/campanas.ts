import { Campana, NegocioId } from "@/lib/types";

// Una campaña llega a un negocio si su alcance es "todas" o si ese negocio
// está en la lista.
export function campanaAlcanzaNegocio(c: Campana, negocioId: NegocioId): boolean {
  return c.negocios === "todas" || c.negocios.includes(negocioId);
}

// Función pura — recibe el arreglo ya cargado (useData()) en vez de leerlo
// de una variable compartida a nivel de módulo (ver mock/clientes.ts para
// la explicación completa de por qué se abandonó ese patrón).
export function campanasPorNegocio(campanas: Campana[], negocioId: NegocioId): Campana[] {
  if (negocioId === "todas") return campanas;
  return campanas.filter((c) => campanaAlcanzaNegocio(c, negocioId));
}
