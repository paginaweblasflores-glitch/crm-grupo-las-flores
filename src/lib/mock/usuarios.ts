import { Usuario } from "@/lib/types";

// Cuentas base del prototipo. Betsy puede crear cuentas nuevas de Ventas o
// Administración desde el módulo de Usuarios — esas se guardan aparte (ver
// lib/store.ts) y se combinan con esta lista al iniciar sesión.
export const USUARIOS: Usuario[] = [
  {
    id: "mijael",
    nombre: "Mijael Rodrigues",
    cargo: "Dirección — Grupo Las Flores",
    rolTipo: "direccion",
    rolLabel: "Dirección",
    iniciales: "MR",
    usuario: "mijael",
    contrasena: "direccion2026",
    negocioId: "las-flores",
  },
  {
    id: "betsy",
    nombre: "Betsy",
    cargo: "Jefa Administrativa — Restaurante Las Flores",
    rolTipo: "administracion",
    rolLabel: "Administración",
    iniciales: "BT",
    usuario: "betsy",
    contrasena: "admin2026",
    negocioId: "las-flores",
  },
  {
    id: "melisa",
    nombre: "Melisa",
    cargo: "Ventas — Restaurante Las Flores",
    rolTipo: "ventas",
    rolLabel: "Ventas",
    iniciales: "ML",
    usuario: "melisa",
    contrasena: "ventas2026",
    negocioId: "las-flores",
  },
];

export function getUsuario(id: string): Usuario | undefined {
  return USUARIOS.find((u) => u.id === id);
}
