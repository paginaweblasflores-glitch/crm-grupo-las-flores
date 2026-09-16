// POST /api/clientes/webhook — recibe clientes nuevos desde la web pública
// de Restaurante Las Flores (proyecto aparte, otro repo) cada vez que
// alguien completa su perfil por primera vez ahí (login con Google/
// Facebook + celular). Un solo aviso por cliente — así se puede hacer
// seguimiento y fidelización desde acá sin tener que registrarlos a mano.
//
// Autenticación: header "Authorization: Bearer <WEBSITE_WEBHOOK_SECRET>" —
// clave compartida guardada en las variables de entorno (nunca en el
// código), la misma que se le entrega al equipo de la web para que la use
// al llamar a este endpoint. Si no coincide, 401.
//
// fecha_de_nacimiento es OBLIGATORIA acá, igual que para un registro hecho
// a mano desde el CRM (la columna es NOT NULL y todo el módulo Cumpleaños
// —calendario, saludo automático, duplicados— depende de tener una fecha
// real). El equipo de la web se comprometió a pedirla como obligatoria en
// su formulario, así que este endpoint nunca debería recibir un registro
// sin ella; si igual llega vacía o mal formada, se rechaza con 400 en vez
// de guardar un cliente con una fecha inventada.
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

// La web pública que manda estos avisos es solo la de Restaurante Las
// Flores — este webhook es exclusivo de ese negocio (Umaru/Mamina no tienen
// web propia todavía).
const NEGOCIO_ID = "las-flores";

const FECHA_REGEX = /^\d{4}-\d{2}-\d{2}$/;

// Separa "Nombre Nombre Apellido Apellido" en nombres/apellidos — mismo
// criterio que tipearía alguien de Ventas a mano: con 1 sola palabra, se usa
// como nombre y el apellido queda vacío; con 2, la primera es nombre y la
// segunda apellido; con 3 o más, las ÚLTIMAS 2 son los apellidos (paterno +
// materno, el patrón más común en Perú) y el resto son nombres. No es
// perfecto (un nombre compuesto de 3 palabras sin apellido doble lo
// separaría distinto), pero cubre el caso normal sin pedirle a la web que
// mande los campos ya separados.
function separarNombreCompleto(nombreCompleto: string): { nombres: string; apellidos: string } {
  const palabras = nombreCompleto.trim().split(/\s+/).filter(Boolean);
  if (palabras.length === 0) return { nombres: "", apellidos: "" };
  if (palabras.length === 1) return { nombres: palabras[0], apellidos: "" };
  if (palabras.length === 2) return { nombres: palabras[0], apellidos: palabras[1] };
  return { nombres: palabras.slice(0, -2).join(" "), apellidos: palabras.slice(-2).join(" ") };
}

interface BodyWebhook {
  nombre_completo?: string;
  celular?: string;
  correo?: string;
  fecha_de_nacimiento?: string | null;
  fuente?: string;
}

export async function POST(req: NextRequest) {
  const secreto = process.env.WEBSITE_WEBHOOK_SECRET;
  if (!secreto) {
    return NextResponse.json({ error: "El servidor no tiene configurado WEBSITE_WEBHOOK_SECRET." }, { status: 500 });
  }
  if (req.headers.get("authorization") !== `Bearer ${secreto}`) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  let body: BodyWebhook;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Solicitud inválida — el body debe ser JSON." }, { status: 400 });
  }

  const celular = body.celular?.trim();
  if (!celular) {
    return NextResponse.json({ error: "Falta el celular." }, { status: 400 });
  }

  const fechaNacimiento = body.fecha_de_nacimiento?.trim();
  if (!fechaNacimiento || !FECHA_REGEX.test(fechaNacimiento)) {
    return NextResponse.json({ error: "Falta o es inválida fecha_de_nacimiento (formato YYYY-MM-DD)." }, { status: 400 });
  }

  // Idempotente por celular — dedup pedida así por el equipo de la web
  // (cada cliente les manda este aviso una sola vez, pero un reintento de
  // red no debe duplicarlo acá). A diferencia del formulario manual de
  // Clientes (que exige celular + fecha de nacimiento juntos, porque
  // familias reales comparten teléfono), acá alcanza con el celular: es un
  // canal donde cada persona completa su PROPIO perfil autenticado.
  const { data: existente, error: errorBusqueda } = await supabaseAdmin
    .from("clientes_individuales")
    .select("id")
    .eq("negocio_id", NEGOCIO_ID)
    .eq("celular", celular)
    .maybeSingle();

  if (errorBusqueda) {
    return NextResponse.json({ error: errorBusqueda.message }, { status: 500 });
  }
  if (existente) {
    return NextResponse.json({ ok: true, duplicado: true });
  }

  const { nombres, apellidos } = separarNombreCompleto(body.nombre_completo ?? "");

  const { error: errorCrear } = await supabaseAdmin.from("clientes_individuales").insert({
    negocio_id: NEGOCIO_ID,
    numero: 0,
    nombres,
    apellidos,
    fecha_nacimiento: fechaNacimiento,
    celular,
    email: body.correo?.trim() || null,
    origen: "web",
    registrado_por: null,
  });

  if (errorCrear) {
    return NextResponse.json({ error: errorCrear.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
