// Helpers de servidor compartidos por las rutas de autenticación
// (src/app/api/auth) y de gestión de cuentas (src/app/api/usuarios) — leer
// la sesión de la cookie, resolver el usuario detrás de ella, y exigir que
// tenga el rol correcto antes de dejarlo crear/editar/eliminar una cuenta.
import { NextRequest } from "next/server";
import { supabaseAdmin } from "./supabase-admin";
import { verificarSesion, COOKIE_SESION } from "./sesion";
import { Usuario } from "./types";

// Los mismos campos que ya devolvía mapUsuario() en db.ts, sin
// "contrasena" — ese campo ya no existe en la tabla "usuarios" (vive
// aparte, como hash, en usuario_credenciales).
export const CAMPOS_SEGUROS =
  "id, nombre, nombre_real, cargo, rol_tipo, rol_label, iniciales, usuario, negocio_id, creado_por";

export function mapUsuarioSeguro(r: Record<string, unknown>): Usuario {
  return {
    id: r.id as string,
    nombre: r.nombre as string,
    nombreReal: (r.nombre_real as string) ?? undefined,
    cargo: r.cargo as string,
    rolTipo: r.rol_tipo as Usuario["rolTipo"],
    rolLabel: r.rol_label as string,
    iniciales: r.iniciales as string,
    usuario: r.usuario as string,
    negocioId: r.negocio_id as Usuario["negocioId"],
    creadoPor: (r.creado_por as string) ?? undefined,
  };
}

// Lee la cookie de la petición, la verifica, y trae el usuario detrás de
// ella — null si no hay sesión válida (cookie ausente, alterada, vencida,
// o apunta a una cuenta que ya no existe).
export async function usuarioDeSesion(req: NextRequest): Promise<Usuario | null> {
  const token = req.cookies.get(COOKIE_SESION)?.value;
  const usuarioId = await verificarSesion(token);
  if (!usuarioId) return null;

  const { data } = await supabaseAdmin
    .from("usuarios")
    .select(CAMPOS_SEGUROS)
    .eq("id", usuarioId)
    .maybeSingle();
  return data ? mapUsuarioSeguro(data) : null;
}

// Igual que usuarioDeSesion(), pero además exige rol Gerencial — es quien
// administra las cuentas de Ventas (ver permissions.ts). Sin este chequeo
// del lado del servidor, la restricción de antes (ocultar el módulo en la
// UI si el rol no es Gerencial) era solo cosmética: cualquiera con la
// llave pública podía crear/editar/eliminar una cuenta igual, sin pasar
// por ninguna pantalla.
export async function usuarioGerencialDeSesion(req: NextRequest): Promise<Usuario | null> {
  const usuario = await usuarioDeSesion(req);
  return usuario && usuario.rolTipo === "gerencial" ? usuario : null;
}
