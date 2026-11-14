// Piezas compartidas por los webhooks que crean clientes a partir de otro
// sistema (web pública: /api/clientes/webhook, sorteos:
// /api/clientes/webhook-sorteo). Cada uno decide sus propias reglas de qué
// es un duplicado y qué campos exige; acá vive solo lo que NO debe divergir
// entre ellos: cómo se valida una fecha, cuál es "hoy", cómo se limpia un
// texto y cómo se detecta un duplicado que la base misma rechazó.
//
// Solo se importa desde rutas de servidor (usa la llave de servicio).
import { supabaseAdmin } from "./supabase-admin";

// "Hoy" en hora de Lima, no en UTC. El servidor corre en UTC: a las 7 pm de
// Lima ya es "mañana" para Postgres (current_date), así que un cliente
// registrado de noche quedaba con la fecha del día siguiente — y a fin de mes
// caía en el mes equivocado de las estadísticas de "clientes nuevos".
export function fechaHoyLima(ahora: Date = new Date()): string {
  return ahora.toLocaleDateString("en-CA", { timeZone: "America/Lima" }); // AAAA-MM-DD
}

// Mismo criterio que fechaPasada() de validacion.ts (no futura, máx. 120
// años), pero estricto con el calendario: "1990-02-31" no existe, y
// new Date() lo acepta moviéndolo a marzo en vez de rechazarlo. Devuelve el
// motivo del rechazo, o null si la fecha sirve.
export function errorFechaNacimiento(valor: unknown): string | null {
  if (typeof valor !== "string") return "debe venir como texto AAAA-MM-DD.";
  const texto = valor.trim();
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(texto);
  if (!m) return "debe tener el formato AAAA-MM-DD.";
  const anio = Number(m[1]);
  const mes = Number(m[2]);
  const dia = Number(m[3]);
  const fecha = new Date(Date.UTC(anio, mes - 1, dia));
  if (fecha.getUTCFullYear() !== anio || fecha.getUTCMonth() !== mes - 1 || fecha.getUTCDate() !== dia) {
    return "no es una fecha que exista en el calendario.";
  }
  const hoy = fechaHoyLima();
  if (texto > hoy) return "no puede ser una fecha futura.";
  // Texto ISO se compara bien como texto: "1900-01-01" < "2026-11-14".
  const limite = `${Number(hoy.slice(0, 4)) - 120}${hoy.slice(4)}`;
  if (texto < limite) return "no parece correcta (más de 120 años).";
  return null;
}

// Texto de una persona/lugar tal como llega: sin caracteres de control, con
// los espacios repetidos colapsados (la base real ya tiene casos como
// "RAFAELE  BARRIAL" con doble espacio) y sin espacios en los bordes.
export function limpiarTexto(valor: unknown): string {
  if (typeof valor !== "string") return "";
  return valor.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim();
}

// ¿Ya existe, EN ESE NEGOCIO, un cliente con este celular Y esta fecha de
// nacimiento? Es la regla de duplicados del CRM (la misma del formulario
// manual de Clientes): el celular solo no basta porque hay familias que
// comparten teléfono, y se mira dentro del negocio porque Las Flores y Umaru
// son negocios separados — la misma persona puede ser cliente de los dos
// (cada uno la atiende y le escribe por su cuenta); lo que no puede haber es
// el mismo cliente dos veces en un mismo negocio.
export async function existeCliente(
  negocioId: string,
  celular: string,
  fechaNacimiento: string
): Promise<{ existe: boolean; error: string | null }> {
  const { data, error } = await supabaseAdmin
    .from("clientes_individuales")
    .select("id")
    .eq("negocio_id", negocioId)
    .eq("celular", celular)
    .eq("fecha_nacimiento", fechaNacimiento)
    .limit(1);
  if (error) return { existe: false, error: error.message };
  return { existe: (data ?? []).length > 0, error: null };
}

// 23505 = unique_violation de Postgres. Con el índice único
// (negocio_id, celular, fecha_nacimiento) de integracion_sorteos.sql, si dos
// peticiones iguales llegan al mismo tiempo las dos pasan la revisión previa de
// existeCliente(), pero la base deja entrar solo a una — la otra cae acá y
// se trata como "duplicado", no como una falla.
export function esDuplicadoDeLaBase(error: { code?: string } | null): boolean {
  return error?.code === "23505";
}
