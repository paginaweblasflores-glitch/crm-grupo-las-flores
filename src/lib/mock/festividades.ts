import { Festividad, NegocioId } from "@/lib/types";

// Fechas comerciales/religiosas/cívicas del año — vienen directo del feedback
// de Mijael (documento "Retroalimentación CRM – SFIDA"). Se repiten cada año
// (mesDia = "MM-DD"); la que se mueve de fecha real (Semana Santa) queda con
// una fecha aproximada, editable desde el sistema.
// El orden de este array no importa para la lista (la página ordena por
// mesDia, enero → diciembre) — pero se mantiene aquí en ese mismo orden
// cronológico para que sea fácil de leer.
export const FESTIVIDADES: Festividad[] = [
  { id: "fest-anio-nuevo", nombre: "Año Nuevo", mesDia: "01-01", tipo: "civico", alcance: "todas" },
  { id: "fest-dia-amor", nombre: "Día del Amor y la Amistad", mesDia: "02-14", tipo: "comercial", alcance: "todas" },
  { id: "fest-carnaval", nombre: "Carnaval", mesDia: "03-05", tipo: "comercial", alcance: "todas" },
  { id: "fest-semana-santa", nombre: "Semana Santa", mesDia: "04-02", tipo: "religioso", alcance: "todas", descripcion: "Fecha aproximada — se mueve cada año." },
  { id: "fest-dia-madre", nombre: "Día de la Madre", mesDia: "05-10", tipo: "comercial", alcance: "todas" },
  { id: "fest-dia-padre", nombre: "Día del Padre", mesDia: "06-21", tipo: "comercial", alcance: "todas" },
  { id: "fest-fiestas-patrias", nombre: "Fiestas Patrias", mesDia: "07-28", tipo: "civico", alcance: "todas" },
  // Los dos aniversarios caen el mismo día (5 de octubre) — cada uno solo
  // aplica a su propio negocio (alcance), así que nunca se ven juntos en la
  // lista salvo que las dos sedes coincidan en fecha real de aniversario.
  { id: "fest-aniversario-umaru", nombre: "Aniversario Hotel Umaru", mesDia: "10-05", tipo: "comercial", alcance: ["umaru"] },
  { id: "fest-aniversario-flores", nombre: "Aniversario Restaurante Las Flores", mesDia: "10-05", tipo: "comercial", alcance: ["las-flores"] },
  { id: "fest-9-diciembre", nombre: "9 de diciembre — Batalla de Ayacucho", mesDia: "12-09", tipo: "civico", alcance: "todas" },
  { id: "fest-navidad", nombre: "Navidad", mesDia: "12-25", tipo: "religioso", alcance: "todas" },
];

export function festividadAlcanzaNegocio(f: Festividad, negocioId: NegocioId): boolean {
  return f.alcance === "todas" || f.alcance.includes(negocioId);
}

// Próxima fecha en la que cae una festividad, a partir de "hoy" (por mesDia,
// cada año se repite) — mismo principio que proximosCumpleanosDe.
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
