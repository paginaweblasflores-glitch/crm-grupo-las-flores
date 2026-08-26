import { Negocio } from "@/lib/types";

export const NEGOCIOS: Negocio[] = [
  {
    id: "las-flores",
    nombre: "Restaurante Las Flores",
    tipo: "restaurante",
    operando: true,
    colorAcento: "#8c3a25",
    descripcionEstado: "Web propia con reservas y delivery, en pruebas",
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

export function getNegocio(id: string): Negocio | undefined {
  return NEGOCIOS.find((n) => n.id === id);
}
