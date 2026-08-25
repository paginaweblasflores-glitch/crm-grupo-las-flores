// Matriz de permisos del CRM, ajustada a cómo trabaja realmente el equipo:
//
// - Dirección (Mijael): solo números y estadísticas para decidir. No registra,
//   no responde, no autoriza — eso lo hacen sus trabajadores. La única
//   excepción es Usuarios: Mijael crea la cuenta de Administración de un
//   negocio nuevo (Umaru, Mamina) cuando todavía no hay nadie a quien
//   delegarle esa tarea — de ahí en adelante, ese administrador crea el
//   resto de su propio equipo.
// - Administración (Betsy): hace la mayor parte de la gestión y tiene
//   privilegios de autorización que Ventas no tiene (aprueba eventos grandes,
//   supervisa el seguimiento de cumpleaños, crea las cuentas del equipo).
// - Ventas (Melisa): es quien más módulos y acciones usa en el día a día —
//   registra clientes, gestiona reservas y delivery, y lleva el seguimiento
//   de cumpleaños con el chat integrado. No ve montos ni cifras críticas de
//   dinero: esas quedan para Administración y Dirección.

import { RolTipo, NegocioId } from "./types";

export type NivelAcceso = "completo" | "resumen" | "no";

export type ModuloId =
  | "dashboard"
  | "tableroNegocio"
  | "clientes"
  | "reservas"
  | "delivery"
  | "hospedaje"
  | "cumpleanos"
  | "campanas"
  | "estrategias"
  | "mensajeria"
  | "usuarios";

export const PERMISOS: Record<RolTipo, Record<ModuloId, NivelAcceso>> = {
  direccion: {
    dashboard: "resumen",
    tableroNegocio: "resumen",
    clientes: "resumen",
    reservas: "resumen",
    delivery: "resumen",
    hospedaje: "resumen",
    cumpleanos: "resumen",
    campanas: "resumen",
    estrategias: "completo",
    mensajeria: "no",
    usuarios: "completo",
  },
  administracion: {
    dashboard: "completo",
    tableroNegocio: "no",
    clientes: "completo",
    reservas: "completo",
    delivery: "completo",
    hospedaje: "completo",
    cumpleanos: "completo",
    campanas: "completo",
    estrategias: "completo",
    mensajeria: "completo",
    usuarios: "completo",
  },
  ventas: {
    dashboard: "completo",
    tableroNegocio: "no",
    clientes: "completo",
    reservas: "completo",
    delivery: "completo",
    hospedaje: "completo",
    cumpleanos: "completo",
    campanas: "no",
    estrategias: "no",
    mensajeria: "completo",
    usuarios: "no",
  },
};

export function accesoA(rol: RolTipo, modulo: ModuloId): NivelAcceso {
  return PERMISOS[rol][modulo];
}

export function puedeVer(rol: RolTipo, modulo: ModuloId): boolean {
  return accesoA(rol, modulo) !== "no";
}

// Dirección ve toda la plata y las estadísticas críticas; Administración
// también (supervisa resultados); Ventas opera pero no ve montos agregados.
export function puedeVerMontos(rol: RolTipo): boolean {
  return rol !== "ventas";
}

// Autorizar reservas grandes, aprobar el mes de cumpleaños, etc.
export function puedeAutorizar(rol: RolTipo): boolean {
  return rol === "administracion";
}

export function puedeGestionarUsuarios(rol: RolTipo): boolean {
  return rol === "administracion" || rol === "direccion";
}

export function puedeRegistrarClientes(rol: RolTipo): boolean {
  return rol === "administracion" || rol === "ventas";
}

// Cada cuenta de Administración o Ventas pertenece a un solo negocio (Betsy
// y Melisa a Las Flores; un futuro administrador de Umaru, a Umaru) — cada
// negocio es grande e independiente, con su propio personal. Solo Dirección
// ve y compara los tres negocios del grupo.
export function negociosPermitidos(rol: RolTipo, negocioPropio: NegocioId): NegocioId[] | "todos" {
  if (rol === "direccion") return "todos";
  return [negocioPropio];
}

export function puedeCambiarNegocio(rol: RolTipo): boolean {
  return rol === "direccion";
}
