// Interruptores centrales del sistema — un solo lugar para prender/apagar
// comportamiento que depende de una integración externa todavía no lista,
// en vez de repartir el check por varios archivos.

// La API de WhatsApp Business (Meta Cloud API) todavía no está conectada ni
// probada (ver src/lib/store.ts → ConfigWhatsAppAPI). Mientras esto sea
// `false`:
//   - Cumpleaños: el botón "Aprobar mes" queda visible pero deshabilitado
//     (gris) para Gerencial, y AutoEnvioCumpleanos no manda nada aunque
//     alguna fila quedara aprobada de antes — doble seguro, no solo
//     cosmético en el botón.
//   - Campañas: "Aprobar y enviar" sigue igual de simulado que siempre
//     (nunca llamó a una API real), sin cambios acá.
// Cuando la API quede conectada y probada de verdad, cambiar a `true`.
export const WHATSAPP_CONECTADA = false;
