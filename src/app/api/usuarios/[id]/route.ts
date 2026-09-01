// Editar / eliminar una cuenta — mismo criterio que la UI ya aplicaba
// (usuarios/page.tsx: solo se puede tocar una cuenta creada desde este
// módulo, no las 6 cuentas base del sistema), pero ahora reforzado del
// lado del servidor — antes esa regla vivía solo en la interfaz (ocultando
// los botones), lo cual no impedía nada si alguien llamaba a Supabase
// directo con la llave pública. Se deja una excepción: cualquiera puede
// editar SU PROPIA cuenta (es lo que usa "Mi Perfil" para cambiar su
// contraseña), sea o no una cuenta base.
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { CAMPOS_SEGUROS, mapUsuarioSeguro, usuarioDeSesion, usuarioGerencialDeSesion } from "@/lib/usuarios-server";
import { UsuarioPatch } from "@/lib/types";

async function puedeEditar(req: NextRequest, id: string) {
  const quienPide = await usuarioDeSesion(req);
  if (!quienPide) return { autorizado: false as const };
  if (quienPide.id === id) return { autorizado: true as const, quienPide };
  // No es su propia cuenta — tiene que ser Gerencial editando una cuenta
  // de Ventas que él mismo (u otro Gerencial) haya creado.
  if (quienPide.rolTipo !== "gerencial") return { autorizado: false as const };
  const { data: objetivo } = await supabaseAdmin.from("usuarios").select("creado_por").eq("id", id).maybeSingle();
  if (!objetivo?.creado_por) return { autorizado: false as const };
  return { autorizado: true as const, quienPide };
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { autorizado } = await puedeEditar(req, id);
  if (!autorizado) return NextResponse.json({ error: "No autorizado." }, { status: 403 });

  let body: UsuarioPatch;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
  }

  const { contrasena, ...resto } = body;
  const row: Record<string, unknown> = {};
  if (resto.nombre !== undefined) row.nombre = resto.nombre;
  if (resto.nombreReal !== undefined) row.nombre_real = resto.nombreReal;
  if (resto.cargo !== undefined) row.cargo = resto.cargo;
  if (resto.rolTipo !== undefined) row.rol_tipo = resto.rolTipo;
  if (resto.rolLabel !== undefined) row.rol_label = resto.rolLabel;
  if (resto.iniciales !== undefined) row.iniciales = resto.iniciales;
  if (resto.usuario !== undefined) row.usuario = resto.usuario.trim();
  if (resto.negocioId !== undefined) row.negocio_id = resto.negocioId;

  if (Object.keys(row).length > 0) {
    const { error } = await supabaseAdmin.from("usuarios").update(row).eq("id", id);
    if (error) {
      const duplicado = error.code === "23505";
      return NextResponse.json(
        { error: duplicado ? "Ese usuario ya existe — elige otro." : error.message },
        { status: duplicado ? 409 : 500 }
      );
    }
  }

  if (contrasena) {
    if (contrasena.length < 6) {
      return NextResponse.json({ error: "La contraseña debe tener al menos 6 caracteres." }, { status: 400 });
    }
    const hash = await bcrypt.hash(contrasena, 10);
    const { error } = await supabaseAdmin
      .from("usuario_credenciales")
      .upsert({ usuario_id: id, contrasena_hash: hash, actualizada_en: new Date().toISOString() });
    if (error) return NextResponse.json({ error: "No se pudo actualizar la contraseña." }, { status: 500 });
  }

  const { data: fila } = await supabaseAdmin.from("usuarios").select(CAMPOS_SEGUROS).eq("id", id).maybeSingle();
  return NextResponse.json(fila ? mapUsuarioSeguro(fila) : { ok: true });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const quienPide = await usuarioGerencialDeSesion(req);
  if (!quienPide) return NextResponse.json({ error: "No autorizado." }, { status: 403 });

  const { data: objetivo } = await supabaseAdmin.from("usuarios").select("creado_por").eq("id", id).maybeSingle();
  if (!objetivo?.creado_por) {
    return NextResponse.json({ error: "Esta cuenta no se puede eliminar." }, { status: 403 });
  }

  const { error } = await supabaseAdmin.from("usuarios").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
