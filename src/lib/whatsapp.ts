// Enlace directo a WhatsApp — evita copiar el número a mano (SFIDA #5).
// Solo abre una conversación real de WhatsApp con el número (y, si se pasa,
// el mensaje) ya cargados; no envía nada por sí solo — quien lo abre tiene
// que apretar Enviar dentro de WhatsApp.
export function enlaceWhatsApp(celular: string, texto?: string): string {
  const limpio = celular.replace(/\D/g, "");
  const base = `https://wa.me/51${limpio}`;
  return texto ? `${base}?text=${encodeURIComponent(texto)}` : base;
}
