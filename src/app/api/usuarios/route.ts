// Crear una cuenta — antes esto lo hacía el navegador directo contra
// Supabase con la llave pública (sin verificar ni el rol de quien lo pedía
// ni nada más). Acá se exige sesión de Gerencial, se valida lo básico, y la
// contraseña se hashea antes de guardarla — nunca en texto plano, y nunca
// en la misma tabla que el resto de los datos de la cuenta (ver
// usuario_credenciales en base de datos/schema.sql).
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { CAMPOS_SEGUROS, mapUsuarioSeguro, usuarioGerencialDeSesion } from "@/lib/usuarios-server";
import { UsuarioNuevo } from "@/lib/types";

export async function POST(req: NextRequest) {
  const quienPide = await usuarioGerencialDeSesion(req);
  if (!quienPide) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  let body: Partial<UsuarioNuevo>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
  }

  const { nombre, cargo, rolTipo, rolLabel, iniciales, usuario, contrasena, negocioId } = body;
  if (!nombre || !cargo || !rolTipo || !rolLabel || !iniciales || !usuario || !contrasena || !negocioId) {
    return NextResponse.json({ error: "Faltan campos obligatorios." }, { status: 400 });
  }
  if (contrasena.length < 6) {
    return NextResponse.json({ error: "La contraseña debe tener al menos 6 caracteres." }, { status: 400 });
  }

  const { data: fila, error } = await supabaseAdmin
    .from("usuarios")
    .insert({
      nombre, nombre_real: body.nombreReal ?? null, cargo, rol_tipo: rolTipo, rol_label: rolLabel,
      iniciales, usuario: usuario.trim(), negocio_id: negocioId, creado_por: quienPide.id,
    })
    .select(CAMPOS_SEGUROS)
    .single();

  if (error || !fila) {
    const duplicado = error?.code === "23505";
    return NextResponse.json(
      { error: duplicado ? "Ese usuario ya existe — elige otro." : (error?.message ?? "No se pudo crear la cuenta.") },
      { status: duplicado ? 409 : 500 }
    );
  }

  const hash = await bcrypt.hash(contrasena, 10);
  const { error: errorCredencial } = await supabaseAdmin
    .from("usuario_credenciales")
    .insert({ usuario_id: fila.id, contrasena_hash: hash });

  if (errorCredencial) {
    // Sin contraseña la cuenta quedaría inservible (nadie podría entrar) —
    // mejor deshacer la creación y que Gerencial lo intente de nuevo, que
    // dejar una cuenta a medias dando vueltas.
    await supabaseAdmin.from("usuarios").delete().eq("id", fila.id);
    return NextResponse.json({ error: "No se pudo guardar la contraseña — inténtalo de nuevo." }, { status: 500 });
  }

  return NextResponse.json(mapUsuarioSeguro(fila), { status: 201 });
}
