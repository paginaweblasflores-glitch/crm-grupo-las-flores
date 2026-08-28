import { Usuario } from "@/lib/types";

// Cuentas base del prototipo — son cuentas de ÁREA/CARGO, no de persona (así
// lo pidió Mijael: "ya no más con nombres reales sino con los nombres de
// áreas"). La única excepción es Gerente General, que además guarda
// `nombreReal` — el perfil (Topbar, saludo) lo muestra tal cual una vez
// dentro del sistema, aunque el selector de login siga mostrando el nombre
// del cargo como todas las demás cuentas.
// Las 3 cuentas de Ventas llevan `creadoPor: "mijael"` a propósito, para que
// el módulo de Usuarios las trate como gestionables (editar/cambiar
// contraseña) igual que cualquier cuenta nueva, no como "cuenta base"
// bloqueada.
export const USUARIOS: Usuario[] = [
  {
    id: "socios",
    nombre: "Directorio",
    cargo: "Dirección — Grupo Las Flores",
    rolTipo: "direccion",
    rolLabel: "Dirección",
    iniciales: "D",
    usuario: "directorio",
    contrasena: "directorio2026",
    negocioId: "las-flores",
  },
  {
    id: "mijael",
    nombre: "Gerente General",
    nombreReal: "Mijail Rodríguez",
    cargo: "Gerente General — Grupo Las Flores",
    rolTipo: "gerencial",
    rolLabel: "Gerencial",
    iniciales: "MR",
    usuario: "gerentegeneral",
    contrasena: "gerentegeneral2026",
    negocioId: "las-flores",
  },
  {
    id: "betsy",
    nombre: "Ventas Uno",
    cargo: "Ventas — Restaurante Las Flores",
    rolTipo: "ventas",
    rolLabel: "Ventas",
    iniciales: "VU",
    usuario: "ventasuno",
    contrasena: "ventasuno2026",
    negocioId: "las-flores",
    creadoPor: "mijael",
  },
  {
    id: "melisa",
    nombre: "Ventas Dos",
    cargo: "Ventas — Restaurante Las Flores",
    rolTipo: "ventas",
    rolLabel: "Ventas",
    iniciales: "VD",
    usuario: "ventasdos",
    contrasena: "ventasdos2026",
    negocioId: "las-flores",
    creadoPor: "mijael",
  },
  {
    id: "carla",
    nombre: "Ventas Tres",
    cargo: "Ventas — Hotel Umaru",
    rolTipo: "ventas",
    rolLabel: "Ventas",
    iniciales: "VT",
    usuario: "ventastres",
    contrasena: "ventastres2026",
    negocioId: "umaru",
    creadoPor: "mijael",
  },
];

export function getUsuario(id: string): Usuario | undefined {
  return USUARIOS.find((u) => u.id === id);
}
