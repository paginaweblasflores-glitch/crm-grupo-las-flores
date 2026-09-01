// Restaura la sesión al abrir la app — reemplaza al viejo "leer el id de
// usuario de localStorage y confiar en él a ciegas" (cualquiera podía abrir
// F12 → Application → Local Storage y escribir el id de otra cuenta ahí
// para "ser" esa persona, sin saber su contraseña). Acá la única fuente de
// verdad es la cookie firmada — si no está, o está alterada, o venció, no
// hay sesión, punto.
import { NextRequest, NextResponse } from "next/server";
import { usuarioDeSesion } from "@/lib/usuarios-server";

export async function GET(req: NextRequest) {
  const usuario = await usuarioDeSesion(req);
  if (!usuario) return NextResponse.json(null, { status: 401 });
  return NextResponse.json(usuario);
}
