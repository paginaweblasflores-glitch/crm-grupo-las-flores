// Plantilla del mensaje de cumpleaños (mismo patrón que una plantilla real
// aprobada de WhatsApp Business API: texto fijo + variables como {nombre}).

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
