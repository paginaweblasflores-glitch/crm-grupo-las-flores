import { Negocio, NegocioId } from "@/lib/types";

export const NEGOCIO_TODAS: Negocio = {
  id: "todas",
  nombre: "Todas las sucursales",
  tipo: "restaurante",
  operando: true,
  colorAcento: "#8c3a25",
  descripcionEstado: "Grupo Las Flores · Vista consolidada de todas las sedes",
};

// Colores oficiales por negocio (decisión de Mijael) — colorAcento es la
// única fuente de este color en todo el sistema (badges, punto de color
// junto al nombre, gráficos comparativos, selector de sede en el Topbar,
// etc.) — cambiarlo acá los actualiza en todos esos lugares a la vez.
export const NEGOCIOS_SEDES: Negocio[] = [
  {
    id: "las-flores",
    nombre: "Restaurante Las Flores",
    tipo: "restaurante",
    operando: true,
    colorAcento: "#3E6B4F", // verde
    descripcionEstado: "Web propia, en pruebas",
  },
  {
    id: "umaru",
    nombre: "Hotel Umaru",
    tipo: "hotel",
    operando: true,
    colorAcento: "#8B5E34", // marrón tierra
    descripcionEstado: "Web gestionada por empresa externa en Lima",
  },
  {
    id: "mamina",
    nombre: "Mamina Restobar",
    tipo: "restobar",
    operando: true,
    colorAcento: "#C9A227", // dorado
    descripcionEstado: "Restobar, coctelería y gastronomía nocturna",
  },
];

export const NEGOCIOS: Negocio[] = NEGOCIOS_SEDES;

export function getNegocio(id: string): Negocio | undefined {
  if (id === "todas") return NEGOCIO_TODAS;
  return NEGOCIOS.find((n) => n.id === id);
}

// Arma el nombre (o nombres) de negocio para interpolar {negocio} en un
// mensaje de campaña — mismo placeholder que ya usa Cumpleaños, pero acá
// puede ser más de un negocio a la vez (una campaña puede llegar a varias
// sedes). Siempre en el orden fijo de NEGOCIOS_SEDES (Las Flores, Umaru,
// Mamina), no en el orden en que se hayan elegido en el formulario — 1 =
// "Restaurante Las Flores", 2 = "Restaurante Las Flores y Hotel Umaru",
// 3 (o "todas") = "Restaurante Las Flores, Hotel Umaru y Mamina Restobar".
export function nombreCombinadoNegocios(alcance: "todas" | NegocioId[]): string {
  const negocios = alcance === "todas" ? NEGOCIOS_SEDES : NEGOCIOS_SEDES.filter((n) => alcance.includes(n.id));
  const nombres = negocios.map((n) => n.nombre);
  if (nombres.length <= 1) return nombres[0] ?? "";
  return `${nombres.slice(0, -1).join(", ")} y ${nombres[nombres.length - 1]}`;
}
