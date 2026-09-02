import { SeguimientoCumple, NegocioId } from "@/lib/types";

// Función pura — recibe el arreglo ya cargado (useData()) en vez de leerlo
// de una variable compartida a nivel de módulo (ver mock/clientes.ts para
// la explicación completa de por qué se abandonó ese patrón).
export function seguimientosPorNegocio(seguimientos: SeguimientoCumple[], negocioId: NegocioId): SeguimientoCumple[] {
  if (negocioId === "todas") return seguimientos;
  return seguimientos.filter((s) => s.negocioId === negocioId);
}

// --- Historial de 12 meses (Panel Ejecutivo/Gerencial, filtro Anual) -------
// Agregado 100% real de `seguimiento_cumpleanos`, agrupado por el mes en que
// el saludo se mandó de verdad (saludoEnviadoEn), no por mes de nacimiento.
// Antes esto era simulado con un generador aleatorio (el sistema recién
// arrancaba y no había historial real) — con clientes reales ya importados
// eso quedó dando cifras inventadas (ej. "901 convertidos de 5351 enviados")
// mientras la tabla real seguía en 0 filas. Con datos reales el resultado es
// honesto solo: 0 en todos los meses hasta que el saludo automático empiece
// a mandarse de verdad, y se va llenando solo con esos envíos reales — sin
// necesitar ningún caso especial por negocio (si un negocio todavía no tiene
// el saludo automático activo, simplemente no tiene filas ese mes).
export function resumenCumpleanosHistoricoMes(seguimientos: SeguimientoCumple[], negocioId: NegocioId, mes: number): { enviados: number; convertidos: number } {
  const delMes = seguimientosPorNegocio(seguimientos, negocioId).filter((s) => {
    if (!s.saludoEnviado || !s.saludoEnviadoEn) return false;
    return new Date(s.saludoEnviadoEn).getMonth() + 1 === mes;
  });
  return {
    enviados: delMes.length,
    convertidos: delMes.filter((s) => s.reservacion === "si").length,
  };
}
