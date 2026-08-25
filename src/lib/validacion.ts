// Validaciones de formulario reutilizables — mensajes claros en español,
// pensados para que el usuario vea de inmediato qué campo está mal y por qué.

export type Errores = Record<string, string>;

export function soloDigitos(valor: string): string {
  return valor.replace(/\D/g, "");
}

export function limitarDigitos(valor: string, max: number): string {
  return soloDigitos(valor).slice(0, max);
}

export function requerido(valor: string | undefined | null, etiqueta = "Este campo"): string | null {
  if (!valor || !valor.trim()) return `${etiqueta} es obligatorio.`;
  return null;
}

export function exactoDigitos(valor: string, n: number, etiqueta: string): string | null {
  if (!valor) return `${etiqueta} es obligatorio.`;
  const limpio = soloDigitos(valor);
  if (limpio.length !== n) return `${etiqueta} debe tener exactamente ${n} dígitos.`;
  return null;
}

export function celularPeru(valor: string): string | null {
  if (!valor) return "El celular es obligatorio.";
  const limpio = soloDigitos(valor);
  if (limpio.length !== 9) return "El celular debe tener 9 dígitos.";
  if (!limpio.startsWith("9")) return "Un celular peruano empieza con 9.";
  return null;
}

// RUC peruano: 11 dígitos, empieza con 1 (persona natural con negocio) o 2 (persona jurídica).
export function rucPeru(valor: string): string | null {
  if (!valor) return "El RUC es obligatorio.";
  const limpio = soloDigitos(valor);
  if (limpio.length !== 11) return "El RUC debe tener 11 dígitos.";
  if (!limpio.startsWith("1") && !limpio.startsWith("2")) return "El RUC debe empezar con 1 o 2.";
  return null;
}

// Filtra en tiempo real lo que se puede escribir en un campo de nombre —
// letras, tildes, espacios y los pocos símbolos válidos en un nombre (apóstrofe, guión, punto).
export function soloLetras(valor: string): string {
  return valor.replace(/[^A-Za-zÀ-ÿñÑ\s'.-]/g, "");
}

export function nombrePersona(valor: string, etiqueta: string): string | null {
  if (!valor || !valor.trim()) return `${etiqueta} es obligatorio.`;
  if (/\d/.test(valor)) return `${etiqueta} no debe tener números.`;
  if (!/^[A-Za-zÀ-ÿñÑ\s'.-]+$/.test(valor)) return `${etiqueta} no debe tener símbolos.`;
  return null;
}

export function emailOpcional(valor: string | undefined): string | null {
  if (!valor) return null; // el correo es opcional
  const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor.trim());
  return ok ? null : "El correo no parece válido (ej: nombre@correo.com).";
}

export function fechaPasada(valor: string, etiqueta = "La fecha"): string | null {
  if (!valor) return `${etiqueta} es obligatoria.`;
  const fecha = new Date(valor);
  const hoy = new Date();
  if (fecha > hoy) return `${etiqueta} no puede ser en el futuro.`;
  const hace120anios = new Date();
  hace120anios.setFullYear(hoy.getFullYear() - 120);
  if (fecha < hace120anios) return `${etiqueta} no parece correcta.`;
  return null;
}
