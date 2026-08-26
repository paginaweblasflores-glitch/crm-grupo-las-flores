import { Campana, NegocioId } from "@/lib/types";
import { randInt } from "./seed";

const MESES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto"];

function generarCampanas(negocioId: NegocioId): Campana[] {
  return MESES.map((mes, i) => {
    const total = randInt(40, 140);
    const enviados = mes === "Agosto" ? randInt(10, total - 5) : total;
    return {
      id: `${negocioId}-camp-${i + 1}`,
      negocioId,
      nombre: `Catálogo / promoción de ${mes}`,
      mes,
      totalClientes: total,
      enviados,
      canal: i % 3 === 0 ? "whatsapp" : i % 3 === 1 ? "instagram" : "facebook",
    };
  });
}

export const CAMPANAS: Campana[] = [
  ...generarCampanas("las-flores"),
  ...generarCampanas("umaru"),
  ...generarCampanas("mamina"),
];

export function campanasPorNegocio(negocioId: NegocioId): Campana[] {
  return CAMPANAS.filter((c) => c.negocioId === negocioId);
}
