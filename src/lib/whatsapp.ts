// Enlace directo a WhatsApp — evita copiar el número a mano (SFIDA #5).
// Solo abre una conversación real de WhatsApp con el número ya cargado;
// no envía nada por sí solo.
export function enlaceWhatsApp(celular: string): string {
  const limpio = celular.replace(/\D/g, "");
  return `https://wa.me/51${limpio}`;
}
