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
//   seguimiento de cumpleaños con el chat integrado, y arma, aprueba y envía
//   campañas de su propio negocio — mismo módulo que usa Gerencial, sin
//   diferencia de permisos (la única diferencia es de alcance: Ventas solo
//   puede armar campañas para su propia sucursal, no para varias ni para
//   "todas" — eso sigue siendo de Gerencial, que sí opera los 3 negocios).
//   También ve Días Festivos (para saber cuándo armar una campaña) pero no
//   crea/edita/elimina fechas — ese calendario es del grupo entero, no de
//   un negocio — eso sigue siendo de Gerencial, igual que Usuarios. No
//   entra a Estrategias.
// - Configuración: exclusivo de Gerencial — ve su propia contraseña (Mi
//   Perfil) y las dos integraciones (WhatsApp Business API / API de IA).
//   Dirección y Ventas no administran su propia contraseña: Gerencial
//   controla las cuentas de Ventas desde Usuarios (ver, editar y cambiar
//   la contraseña de cualquiera), y Dirección no tiene ningún módulo de
//   autogestión — mismo criterio de "cero acceso a módulos operativos".

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
  | "diasFestivos"
  | "configuracion";

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
    configuracion: "no",
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
    configuracion: "completo",
  },
  ventas: {
    dashboard: "completo",
    clientes: "completo",
    cumpleanos: "completo",
    campanas: "completo",
    estrategias: "no",
    mensajeria: "completo",
    usuarios: "no",
    diasFestivos: "resumen",
    configuracion: "no",
  },
  // Administración: entre Gerencial y Ventas — pero de alcance MUY angosto,
  // a propósito. No opera nada (no registra clientes, no manda mensajes, no
  // arma campañas): solo supervisa al equipo de Ventas de los 3 negocios —
  // quién registró más, hace cuánto, y puede entrar a ver el detalle de
  // cada cliente que registraron (eso último no necesita el módulo
  // Clientes completo: la Ficha de un cliente ya es una página sin permiso
  // propio, se llega ahí solo por el enlace desde este panel). Por eso el
  // único módulo con acceso es "dashboard" — todo lo demás queda cerrado.
  administracion: {
    dashboard: "completo",
    clientes: "no",
    cumpleanos: "no",
    campanas: "no",
    estrategias: "no",
    mensajeria: "no",
    usuarios: "no",
    diasFestivos: "no",
    configuracion: "no",
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

// Crear/editar/eliminar una fecha del calendario de Días Festivos — ese
// calendario es del grupo entero, no de un negocio, así que se queda en
// Gerencial (mismo criterio que Usuarios). Ventas ve las fechas para saber
// cuándo armar una campaña (ver puedeCrearCampanas), no las administra.
export function puedeGestionarDiasFestivos(rol: RolTipo): boolean {
  return rol === "gerencial";
}

export function puedeRegistrarClientes(rol: RolTipo): boolean {
  return rol === "gerencial" || rol === "ventas";
}

// Crear/editar/eliminar el borrador de una campaña — el trabajo operativo,
// igual que registrar un cliente o armar el saludo de cumpleaños.
export function puedeCrearCampanas(rol: RolTipo): boolean {
  return rol === "gerencial" || rol === "ventas";
}

// Aprobar una campaña (congela el mensaje y habilita la cola de envío) —
// mismo permiso que crearla: Ventas también puede armar y mandar el envío
// masivo de su propio negocio, sin depender de Gerencial para aprobarlo.
export function puedeAprobarCampanas(rol: RolTipo): boolean {
  return rol === "gerencial" || rol === "ventas";
}

// Conectar/desconectar credenciales de una API externa (WhatsApp Business,
// IA, la que sea) — es un dato sensible de la cuenta del negocio, no una
// tarea operativa. Exclusivo de Gerencial, aunque Ventas sí pueda usar lo
// que esa API habilita (enviar campañas, por ejemplo).
export function puedeConectarAPIs(rol: RolTipo): boolean {
  return rol === "gerencial";
}

// Cada cuenta de Ventas pertenece a un solo negocio — cada negocio es grande
// e independiente, con su propio equipo. Dirección y Gerencial ven y
// comparan los tres negocios del grupo (Dirección solo para métricas
// agregadas; Gerencial además puede operar en cualquiera de los tres).
export function negociosPermitidos(rol: RolTipo, negocioPropio: NegocioId): NegocioId[] | "todos" {
  if (rol === "direccion" || rol === "gerencial" || rol === "administracion") return "todos";
  return [negocioPropio];
}

// Solo Gerencial cambia de negocio activamente para operar en uno u otro —
// Dirección ve los tres agregados en un solo panel, no navega por negocio.
export function puedeCambiarNegocio(rol: RolTipo): boolean {
  return rol === "gerencial";
}
