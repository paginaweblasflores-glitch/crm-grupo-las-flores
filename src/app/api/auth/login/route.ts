// Login real, del lado del servidor — reemplaza la comparación que antes
// hacía el propio navegador contra la lista completa de usuarios (que
// además viajaba con la contraseña de todos en texto plano). Acá:
//   1. Se busca la cuenta por su nombre de usuario (con la llave de
//      servicio — usuario_credenciales no es visible con la llave pública).
//   2. Se compara la contraseña recibida contra el hash guardado, con
//      bcrypt (nunca se guarda ni se compara en texto plano).
//   3. Si coincide, se firma una cookie de sesión HttpOnly — el navegador
//      la manda solo, pero su JavaScript no puede leerla ni editarla.
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { firmarSesion, COOKIE_SESION, DURACION_SEGUNDOS } from "@/lib/sesion";
import { CAMPOS_SEGUROS, mapUsuarioSeguro } from "@/lib/usuarios-server";

export async function POST(req: NextRequest) {
  let body: { usuario?: string; contrasena?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
  }
  const { usuario, contrasena } = body;
  if (!usuario || !contrasena) {
    return NextResponse.json({ error: "Faltan usuario o contraseña." }, { status: 400 });
  }

  const { data: perfil } = await supabaseAdmin
    .from("usuarios")
    .select(CAMPOS_SEGUROS)
    .ilike("usuario", usuario.trim())
    .maybeSingle();

  // Mismo mensaje de error tanto si el usuario no existe como si la
  // contraseña está mal — no hay que darle a quien intenta entrar ninguna
  // pista de cuál de las dos cosas falló (evita que alguien use el login
  // para averiguar qué nombres de usuario existen de verdad).
  const ERROR_GENERICO = NextResponse.json({ error: "Usuario o contraseña incorrectos." }, { status: 401 });
  if (!perfil) return ERROR_GENERICO;

  const { data: credencial } = await supabaseAdmin
    .from("usuario_credenciales")
    .select("contrasena_hash")
    .eq("usuario_id", perfil.id)
    .maybeSingle();
  if (!credencial) return ERROR_GENERICO;

  const valido = await bcrypt.compare(contrasena, credencial.contrasena_hash);
  if (!valido) return ERROR_GENERICO;

  const token = await firmarSesion(perfil.id as string);
  const res = NextResponse.json(mapUsuarioSeguro(perfil));
  res.cookies.set(COOKIE_SESION, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: DURACION_SEGUNDOS,
  });
  return res;
}
