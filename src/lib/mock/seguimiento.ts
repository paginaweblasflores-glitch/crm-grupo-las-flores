import { SeguimientoCumple, NegocioId } from "@/lib/types";
import { CLIENTES_INDIVIDUALES } from "./clientes";
import { randBool, randInt, BASE_DATE } from "./seed";

function esDeEsteMes(fechaISO: string): boolean {
  const [, mes] = fechaISO.split("-").map(Number);
  return mes === BASE_DATE.getMonth() + 1;
}

function generarSeguimiento(negocioId: NegocioId): SeguimientoCumple[] {
  // El seguimiento del mes se arma con quienes cumplen años este mes —
  // así el resumen que ve Mijael ("cuántos cumpleaños este mes") tiene
  // relación real con los datos, no una muestra aleatoria de la base.
  const clientes = CLIENTES_INDIVIDUALES.filter(
    (c) => c.negocioId === negocioId && esDeEsteMes(c.fechaNacimiento)
  );
  return clientes.map((cliente, i) => {
    const saludoEnviado = randBool(0.85);
    const visto = saludoEnviado && randBool(0.75);
    const respuesta: SeguimientoCumple["respuesta"] = !saludoEnviado
      ? "pendiente"
      : visto
        ? (randBool(0.4) ? "si" : "no")
        : "pendiente";
    const reservacion: SeguimientoCumple["reservacion"] = respuesta === "si" ? (randBool(0.55) ? "si" : "no") : "pendiente";
    return {
      id: `${negocioId}-seg-${i + 1}`,
      negocioId,
      clienteId: cliente.id,
      clienteTipo: "individual",
      nombre: `${cliente.nombres} ${cliente.apellidos}`,
      fechaCumple: cliente.fechaNacimiento,
      celular: cliente.celular,
      saludoEnviado,
      visto,
      respuesta,
      reservacion,
      adelantoReserva: reservacion === "si" ? randInt(20, 60) : undefined,
      montoConsumo: reservacion === "si" ? randInt(80, 320) : undefined,
    };
  });
}

export const SEGUIMIENTOS: SeguimientoCumple[] = [
  ...generarSeguimiento("las-flores"),
  ...generarSeguimiento("umaru"),
];

export function seguimientosPorNegocio(negocioId: NegocioId): SeguimientoCumple[] {
  return SEGUIMIENTOS.filter((s) => s.negocioId === negocioId);
}

// Próximos cumpleaños (de toda la base, no solo los que ya tienen seguimiento armado)
export function proximosCumpleanos(negocioId: NegocioId, hoy: Date, rangoDias = 10) {
  const clientes = CLIENTES_INDIVIDUALES.filter((c) => c.negocioId === negocioId);
  const anio = hoy.getFullYear();
  return clientes
    .map((c) => {
      const [, mes, dia] = c.fechaNacimiento.split("-").map(Number);
      let proxima = new Date(anio, mes - 1, dia);
      if (proxima < new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate())) {
        proxima = new Date(anio + 1, mes - 1, dia);
      }
      const diffDias = Math.round((proxima.getTime() - hoy.getTime()) / 86400000);
      return { cliente: c, diffDias };
    })
    .filter((x) => x.diffDias >= 0 && x.diffDias <= rangoDias)
    .sort((a, b) => a.diffDias - b.diffDias);
}
