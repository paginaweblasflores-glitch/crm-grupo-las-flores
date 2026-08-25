// Plantilla del mensaje de cumpleaños (mismo patrón que una plantilla real
// aprobada de WhatsApp Business API: texto fijo + variables como {nombre})
// y el "sembrado" de conversaciones ya avanzadas, para que la demo muestre
// cómo se ve un caso ya respondido y confirmado, no solo casilleros vacíos.

import { Mensaje, SeguimientoCumple } from "./types";
import { BASE_DATE } from "./mock/seed";

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

function hace(dias: number, horas: number, minutos: number): string {
  const d = new Date(BASE_DATE);
  d.setDate(d.getDate() - dias);
  d.setHours(horas, minutos, 0, 0);
  return d.toISOString();
}

// Conversación determinística según el estado real del seguimiento — no es
// aleatoria, así que siempre se ve igual entre recargas de la página.
export function semillaConversacion(s: SeguimientoCumple, negocioNombre: string): Mensaje[] {
  if (!s.saludoEnviado) return [];

  const mensajes: Mensaje[] = [
    { id: `${s.id}-m1`, de: "negocio", texto: plantillaCumpleanos(s.nombre.split(" ")[0], negocioNombre), hora: hace(3, 9, 15) },
  ];

  if (s.respuesta === "no" || s.respuesta === "pendiente") {
    return mensajes;
  }

  // respuesta === "si"
  mensajes.push({
    id: `${s.id}-m2`,
    de: "cliente",
    texto: "¡Muchas gracias! Qué lindo detalle 🌸 ¿Tienen mesa disponible este fin de semana?",
    hora: hace(3, 9, 54),
  });

  if (s.reservacion === "no" || s.reservacion === "pendiente") {
    mensajes.push({
      id: `${s.id}-m3`,
      de: "negocio",
      texto: "¡Claro que sí! Cuéntanos la fecha y cuántas personas serían y te confirmamos al toque.",
      hora: hace(3, 10, 5),
    });
    return mensajes;
  }

  // reservacion === "si"
  mensajes.push(
    { id: `${s.id}-m3`, de: "negocio", texto: "¡Perfecto! Cuéntanos para cuántas personas sería la mesa.", hora: hace(3, 10, 5) },
    { id: `${s.id}-m4`, de: "cliente", texto: "Seríamos 4 personas, ¿se podría el sábado a las 8pm?", hora: hace(3, 10, 22) },
    { id: `${s.id}-m5`, de: "negocio", texto: "¡Reserva confirmada para el sábado 8pm, mesa para 4! Te esperamos 🎉", hora: hace(2, 16, 40) },
    { id: `${s.id}-m6`, de: "cliente", texto: "Genial, muchas gracias, ahí estaremos 🙌", hora: hace(2, 16, 47) },
  );
  return mensajes;
}
