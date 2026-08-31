import { ClienteIndividual, ClienteCorporativo, NegocioId } from "@/lib/types";

// Funciones puras — reciben el arreglo ya cargado (desde useData(), con
// datos reales de Supabase) en vez de leerlo de una variable compartida a
// nivel de módulo. Antes estos arreglos vivían como `let` acá mismo,
// "hidratados" por src/lib/data-context.tsx — pero Next.js/Turbopack puede
// terminar empaquetando este archivo más de una vez (una copia por chunk de
// ruta), así que esa copia "hidratada" no siempre era la misma que leía cada
// página, y algunas pantallas (Cumpleaños) se quedaban viendo un arreglo
// vacío aunque los datos sí habían llegado. Pasar el arreglo como parámetro
// evita el problema de raíz: ya no depende de que dos módulos compartan el
// mismo estado en memoria.
export function clientesIndividualesPorNegocio(clientes: ClienteIndividual[], negocioId: NegocioId): ClienteIndividual[] {
  if (negocioId === "todas") return clientes;
  return clientes.filter((c) => c.negocioId === negocioId);
}

export function corporativosPorNegocio(corporativos: ClienteCorporativo[], negocioId: NegocioId): ClienteCorporativo[] {
  if (negocioId === "todas") return corporativos;
  return corporativos.filter((c) => c.negocioId === negocioId);
}

export function buscarClienteIndividual(clientes: ClienteIndividual[], id: string): ClienteIndividual | undefined {
  return clientes.find((c) => c.id === id);
}
