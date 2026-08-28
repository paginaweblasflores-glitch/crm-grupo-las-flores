import { Negocio } from "@/lib/types";

export const NEGOCIO_TODAS: Negocio = {
  id: "todas",
  nombre: "Todas las sucursales",
  tipo: "restaurante",
  operando: true,
  colorAcento: "#8c3a25",
  descripcionEstado: "Grupo Las Flores · Vista consolidada de todas las sedes",
};

export const NEGOCIOS_SEDES: Negocio[] = [
  {
    id: "las-flores",
    nombre: "Restaurante Las Flores",
    tipo: "restaurante",
    operando: true,
    colorAcento: "#8c3a25",
    descripcionEstado: "Web propia, en pruebas",
  },
  {
    id: "umaru",
    nombre: "Hotel Umaru",
    tipo: "hotel",
    operando: true,
    colorAcento: "#5c7c8c",
    descripcionEstado: "Web gestionada por empresa externa en Lima",
  },
  {
    id: "mamina",
    nombre: "Mamina Restobar",
    tipo: "restobar",
    operando: true,
    colorAcento: "#a0522d",
    descripcionEstado: "Restobar, coctelería y gastronomía nocturna",
  },
];

export const NEGOCIOS: Negocio[] = NEGOCIOS_SEDES;

export function getNegocio(id: string): Negocio | undefined {
  if (id === "todas") return NEGOCIO_TODAS;
  return NEGOCIOS.find((n) => n.id === id);
}
