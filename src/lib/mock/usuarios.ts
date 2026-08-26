import { Usuario } from "@/lib/types";

// Cuentas base del prototipo. Mijael (Gerencial) puede crear cuentas nuevas
// de Ventas para cualquiera de los 3 negocios desde el módulo de Usuarios —
// esas se guardan aparte (ver lib/store.ts) y se combinan con esta lista al
// iniciar sesión.
export const USUARIOS: Usuario[] = [
  {
    id: "socios",
    nombre: "Directorio",
    cargo: "Dirección — Grupo Las Flores",
    rolTipo: "direccion",
    rolLabel: "Dirección",
    iniciales: "D",
    usuario: "socios",
    contrasena: "direccion2026",
    negocioId: "las-flores",
  },
  {
    id: "mijael",
    nombre: "Mijael Rodrigues",
    cargo: "Gerente General — Grupo Las Flores",
    rolTipo: "gerencial",
    rolLabel: "Gerencial",
    iniciales: "MR",
    usuario: "mijael",
    contrasena: "gerencial2026",
    negocioId: "las-flores",
  },
  {
    id: "betsy",
    nombre: "Betsy",
    cargo: "Administración y Ventas — Restaurante Las Flores",
    rolTipo: "ventas",
    rolLabel: "Ventas",
    iniciales: "BT",
    usuario: "betsy",
    contrasena: "ventas2026",
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
  {
    id: "carla",
    nombre: "Carla Huamán",
    cargo: "Recepcionista — Hotel Umaru",
    rolTipo: "ventas",
    rolLabel: "Ventas",
    iniciales: "CH",
    usuario: "carla",
    contrasena: "umaru2026",
    negocioId: "umaru",
  },
  {
    id: "valeria",
    nombre: "Valeria Castro",
    cargo: "Ventas y Atención — Mamina Restobar",
    rolTipo: "ventas",
    rolLabel: "Ventas",
    iniciales: "VC",
    usuario: "valeria",
    contrasena: "mamina2026",
    negocioId: "mamina",
  },
];

export function getUsuario(id: string): Usuario | undefined {
  return USUARIOS.find((u) => u.id === id);
}
