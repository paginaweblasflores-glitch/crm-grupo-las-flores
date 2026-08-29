// Matriz de permisos del CRM — modelo definido por Mijael junto a Arturo y
// Luis (reunión de diseño de su propio CRM), reemplaza el modelo anterior:
//
// - Dirección (socios/directorio en Lima): un solo panel de métricas de
//   crecimiento del grupo. Cero acciones, cero acceso a módulos operativos.
// - Gerencial (Mijael): control operativo total de los 3 negocios — hace todo
//   lo que hace Ventas, además gestiona campañas, usuarios (crear/editar/
//   eliminar cuentas de Ventas) y días festivos. El detalle y comparativo de
//   actividad de su equipo lo ve en Panel Principal (Rendimiento del Equipo
//   Comercial) — existió un módulo "Mi Equipo" aparte, pero terminó siendo
//   una copia exacta de ese mismo bloque, así que se eliminó.
// - Ventas (el equipo de cada negocio): registra clientes, lleva el
//   seguimiento de cumpleaños con el chat integrado, y ve (sin editar) las
//   campañas de su negocio. No entra a Usuarios/Estrategias/Días Festivos.

import { RolTipo, NegocioId } from "./types";

export type NivelAcceso = "completo" | "resumen" | "no";

export type ModuloId =
  | "dashboard"
  | "clientes"
  | "cumpleanos"
  | "campanas"
  | "estrategias"
  | "mensajeria"
  | "usuarios"
  | "diasFestivos";

export const PERMISOS: Record<RolTipo, Record<ModuloId, NivelAcceso>> = {
  direccion: {
    dashboard: "resumen",
    clientes: "no",
    cumpleanos: "no",
    campanas: "no",
    estrategias: "no",
    mensajeria: "no",
    usuarios: "no",
    diasFestivos: "no",
  },
  gerencial: {
    dashboard: "completo",
    clientes: "completo",
    cumpleanos: "completo",
    campanas: "completo",
    estrategias: "completo",
    mensajeria: "completo",
    usuarios: "completo",
    diasFestivos: "completo",
  },
  ventas: {
    dashboard: "completo",
    clientes: "completo",
    cumpleanos: "completo",
    campanas: "resumen",
    estrategias: "no",
    mensajeria: "completo",
    usuarios: "no",
    diasFestivos: "no",
  },
};

export function accesoA(rol: RolTipo, modulo: ModuloId): NivelAcceso {
  return PERMISOS[rol][modulo];
}

export function puedeVer(rol: RolTipo, modulo: ModuloId): boolean {
  return accesoA(rol, modulo) !== "no";
}

// Aprobar el mes de cumpleaños, etc.
export function puedeAutorizar(rol: RolTipo): boolean {
  return rol === "gerencial";
}

export function puedeGestionarUsuarios(rol: RolTipo): boolean {
  return rol === "gerencial";
}

export function puedeRegistrarClientes(rol: RolTipo): boolean {
  return rol === "gerencial" || rol === "ventas";
}

export function puedeGestionarCampanas(rol: RolTipo): boolean {
  return rol === "gerencial";
}

// Cada cuenta de Ventas pertenece a un solo negocio — cada negocio es grande
// e independiente, con su propio equipo. Dirección y Gerencial ven y
// comparan los tres negocios del grupo (Dirección solo para métricas
// agregadas; Gerencial además puede operar en cualquiera de los tres).
export function negociosPermitidos(rol: RolTipo, negocioPropio: NegocioId): NegocioId[] | "todos" {
  if (rol === "direccion" || rol === "gerencial") return "todos";
  return [negocioPropio];
}

// Solo Gerencial cambia de negocio activamente para operar en uno u otro —
// Dirección ve los tres agregados en un solo panel, no navega por negocio.
export function puedeCambiarNegocio(rol: RolTipo): boolean {
  return rol === "gerencial";
}
