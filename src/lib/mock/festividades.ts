import { Festividad, NegocioId } from "@/lib/types";

export function festividadAlcanzaNegocio(f: Festividad, negocioId: NegocioId): boolean {
  return f.alcance === "todas" || f.alcance.includes(negocioId);
}

export function proximaFecha(mesDia: string, hoy: Date): { fecha: Date; diffDias: number } {
  const [mes, dia] = mesDia.split("-").map(Number);
  const anio = hoy.getFullYear();
  let fecha = new Date(anio, mes - 1, dia);
  if (fecha < new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate())) {
    fecha = new Date(anio + 1, mes - 1, dia);
  }
  const diffDias = Math.round((fecha.getTime() - hoy.getTime()) / 86400000);
  return { fecha, diffDias };
}
