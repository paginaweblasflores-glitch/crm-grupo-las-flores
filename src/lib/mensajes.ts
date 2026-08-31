// Plantilla del mensaje de cumpleaños (mismo patrón que una plantilla real
// aprobada de WhatsApp Business API: texto fijo + variables como {nombre}).

import { Campana, Mensaje, SeguimientoCumple } from "./types";

// Plantilla y hora por defecto del saludo automático — editables desde
// Cumpleaños (Ventas). {nombre} se reemplaza por el nombre del cliente,
// {negocio} por el nombre del negocio.
export const PLANTILLA_CUMPLEANOS_DEFECTO =
  "¡Feliz cumpleaños, {nombre}! 🌸 De parte de todo el equipo de {negocio} te deseamos un día increíble. " +
  "Tienes un 20% de descuento esperándote en tu próxima visita — cuéntanos si quieres reservar y te ayudamos con gusto.";
export const HORA_ENVIO_DEFECTO = "09:00";

export function interpolarPlantilla(plantilla: string, nombre: string, negocioNombre: string): string {
  return plantilla.replaceAll("{nombre}", nombre).replaceAll("{negocio}", negocioNombre);
}

export function plantillaCumpleanos(nombre: string, negocioNombre: string): string {
  return interpolarPlantilla(PLANTILLA_CUMPLEANOS_DEFECTO, nombre, negocioNombre);
}

// El único mensaje que el chat puede dar por hecho: el saludo automático que
// SÍ se mandó de verdad, con su hora real (saludoEnviadoEn). Antes esta
// función también fabricaba una charla completa inventada (el cliente
// "respondiendo" cosas que nunca escribió) cuando reservacion era "sí"/"no"
// — tenía sentido con datos 100% de mentira, pero le pone palabras
// inventadas en la boca a un cliente real. El estado de la reservación ya se
// ve aparte, como badge, en la tabla de Cumpleaños — no hace falta
// simularlo acá también.
export function semillaConversacion(s: SeguimientoCumple, negocioNombre: string): Mensaje[] {
  if (!s.saludoEnviado) return [];
  return [{
    id: `${s.id}-m1`,
    de: "negocio",
    texto: plantillaCumpleanos(s.nombre.split(" ")[0], negocioNombre),
    // Si por algún motivo una fila vieja no tiene la hora real guardada
    // (creada antes de este cambio), se usa el momento en que se está
    // generando esta vista como último recurso — sigue siendo mejor que
    // fabricar "hace 3 días" a ciegas.
    hora: s.saludoEnviadoEn ?? new Date().toISOString(),
  }];
}

// Mismo criterio que semillaConversacion: se genera al vuelo a partir del
// estado ya guardado (campana.contactados), no es aleatoria — así se ve
// igual entre recargas. Cubre el caso de una campaña que marcó a este
// cliente como contactado pero cuyo mensaje nunca se escribió de verdad en
// su chat — típicamente las campañas históricas del mock, que nacen ya
// "aprobadas" desde antes de que existiera este sistema (ver mock/campanas.ts)
// y por eso no pasan por `agregarMensajeChatDirecto`. Sin esto, Mensajería
// se vería vacía para un cliente que Campañas ya cuenta como contactado.
export function semillaCampanasCliente(clienteId: string, campanas: Campana[]): Mensaje[] {
  return campanas
    .filter((c) => c.estado === "aprobada" && c.contactados.includes(clienteId))
    .map((c) => ({
      id: `${c.id}-cliente-${clienteId}`,
      de: "negocio" as const,
      texto: c.mensaje,
      hora: `${c.aprobadaEn ?? c.creadaEn}T09:00:00.000Z`,
    }));
}
