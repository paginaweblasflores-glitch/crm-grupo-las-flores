// Helpers de formato para mostrar datos de clientes en tablas y tarjetas —
// compartidos entre Ficha 360°, Clientes, Panel Gerencial y ranking de
// asesores, para no repetir la misma lógica en cada archivo.

// Procedencia más específica disponible — distrito+provincia si el cliente
// llegó hasta ahí en la cascada Departamento → Provincia → Distrito, si no
// el nivel más específico que sí tenga. El negocio solo atiende Perú (sin
// campo de país), así que el departamento nunca debería faltar de verdad —
// el fallback a "Perú" es solo defensivo, por si un registro viejo llegara
// sin ninguno de los tres.
export function procedenciaDe(c: { departamento: string; provincia: string; distrito: string }): string {
  if (c.distrito) return `${c.distrito}, ${c.provincia}`;
  if (c.provincia) return `${c.provincia}, ${c.departamento}`;
  if (c.departamento) return `${c.departamento}, Perú`;
  return "Perú";
}

// Para tablas con una columna por campo (Departamento | Provincia |
// Distrito) en vez de un solo texto combinado — un campo que no aplica (ej.
// Distrito de un cliente que solo llegó hasta Departamento) se ve como "—",
// no como una celda vacía sin explicación.
export function valorOGuion(v: string): string {
  return v || "—";
}

// "Hace X min", "Hoy, HH:mm", "Ayer, HH:mm", "Hace X días" o la fecha corta.
// Recibe un timestamp CON hora real (creadoEn) — nunca fechaRegistro (esa
// solo guarda el día; Postgres/JS la interpretan como medianoche UTC, lo que
// mostraba siempre la misma hora fija sin importar cuándo se registró el
// cliente de verdad).
export function tiempoRelativoOFecha(fechaISO: string): string {
  try {
    const fecha = new Date(fechaISO);
    const ahora = new Date();
    const diffMs = ahora.getTime() - fecha.getTime();
    const diffMin = Math.floor(diffMs / (1000 * 60));
    const diffHoras = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDias = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMin >= 0 && diffMin < 1) return "Hace un momento";
    if (diffMin >= 1 && diffMin < 60) return `Hace ${diffMin} min`;
    if (diffHoras >= 0 && diffHoras < 24 && fecha.getDate() === ahora.getDate()) {
      return `Hoy, ${fecha.toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" })}`;
    }
    if (diffDias === 1 || (diffHoras < 48 && fecha.getDate() === ahora.getDate() - 1)) {
      return `Ayer, ${fecha.toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" })}`;
    }
    if (diffDias >= 0 && diffDias < 7) return `Hace ${diffDias} días`;
    return fecha.toLocaleDateString("es-PE", { day: "2-digit", month: "short" });
  } catch {
    return fechaISO;
  }
}
