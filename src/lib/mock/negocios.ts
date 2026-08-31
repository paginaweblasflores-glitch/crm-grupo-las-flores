import { Negocio } from "@/lib/types";

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
