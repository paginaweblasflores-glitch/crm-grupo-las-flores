// POST /api/clientes/webhook-sorteo — recibe a cada persona que se registra en
// un sorteo (sistema de sorteos, proyecto aparte) y la crea como cliente del
// CRM, para hacerle seguimiento y fidelización sin registrarla a mano.
//
// Por qué un endpoint propio y no reutilizar /api/clientes/webhook (el de la
// web): es otra fuente con otro nivel de confianza (secreto propio, que se
// puede rotar sin tocar a la web), manda datos distintos (nombres y apellidos
// ya separados, distrito, qué sorteo y para qué negocio — la web siempre es de
// Las Flores) y aplica la regla de duplicados del CRM (celular + fecha de
// nacimiento, en todo el grupo) en vez de solo celular. Lo común vive en
// lib/webhook-auth.ts y lib/clientes-webhook.ts.
//
// Contrato completo (campos, respuestas, reintentos, pruebas): ver
// sorteo-las-flores/integracion-crm/INDICACIONES-CRM.md.
//
// Regla clave: si la persona YA existe en el CRM (mismo celular y misma fecha
// de nacimiento), NO se crea ni se modifica nada — se responde 200 con
// resultado "duplicado". No es un error: el sorteo no debe reintentar.
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { verificarBearer } from "@/lib/webhook-auth";
import {
  errorFechaNacimiento, esDuplicadoDeLaBase, existeCliente, fechaHoyLima, limpiarTexto,
} from "@/lib/clientes-webhook";
import { celularPeru, nombrePersona, soloDigitos } from "@/lib/validacion";
import { NEGOCIOS } from "@/lib/mock/negocios";
import { NegocioId } from "@/lib/types";

const NEGOCIO_IDS: string[] = NEGOCIOS.map((n) => n.id);
const SLUG_REGEX = /^[a-z0-9][a-z0-9_-]{1,79}$/;

interface DatosSorteo {
  negocioId: NegocioId;
  sorteoSlug: string;
  sorteoNombre: string;
  nombres: string;
  apellidos: string;
  celular: string;
  fechaNacimiento: string;
  departamento: string;
  provincia: string;
  distrito: string;
  aceptaComunicaciones: boolean;
  fechaRegistro: string;
  requestId: string | null;
  modoPrueba: boolean;
}

type Validacion = { datos: DatosSorteo } | { campo: string; error: string };

const rechazo = (campo: string, error: string): Validacion => ({ campo, error });

function validar(body: unknown): Validacion {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return rechazo("body", "El cuerpo debe ser un objeto JSON.");
  }
  const b = body as Record<string, unknown>;

  if (typeof b.negocio !== "string" || !NEGOCIO_IDS.includes(b.negocio)) {
    return rechazo("negocio", `negocio debe ser uno de: ${NEGOCIO_IDS.join(", ")}.`);
  }

  const sorteoSlug = typeof b.sorteo_slug === "string" ? b.sorteo_slug.trim().toLowerCase() : "";
  if (!SLUG_REGEX.test(sorteoSlug)) {
    return rechazo("sorteo_slug", "sorteo_slug es obligatorio (2 a 80 caracteres: minúsculas, números, - y _).");
  }
  const sorteoNombre = limpiarTexto(b.sorteo_nombre);
  if (sorteoNombre.length < 2 || sorteoNombre.length > 120) {
    return rechazo("sorteo_nombre", "sorteo_nombre es obligatorio (2 a 120 caracteres).");
  }

  const nombres = limpiarTexto(b.nombres);
  const apellidos = limpiarTexto(b.apellidos);
  for (const [campo, valor] of [["nombres", nombres], ["apellidos", apellidos]] as const) {
    const problema = nombrePersona(valor, campo);
    if (problema) return rechazo(campo, problema);
    if (valor.length < 2 || valor.length > 60) return rechazo(campo, `${campo} debe tener entre 2 y 60 caracteres.`);
  }

  if (typeof b.telefono !== "string") return rechazo("telefono", "telefono es obligatorio (texto, 9 dígitos).");
  const problemaCelular = celularPeru(b.telefono);
  if (problemaCelular) return rechazo("telefono", problemaCelular);
  const celular = soloDigitos(b.telefono);

  const problemaFecha = errorFechaNacimiento(b.fecha_nacimiento);
  if (problemaFecha) return rechazo("fecha_nacimiento", `fecha_nacimiento ${problemaFecha}`);

  const lugares: Record<"departamento" | "provincia" | "distrito", string> = { departamento: "", provincia: "", distrito: "" };
  for (const campo of ["departamento", "provincia", "distrito"] as const) {
    if (b[campo] === undefined || b[campo] === null) continue;
    const texto = limpiarTexto(b[campo]);
    if (typeof b[campo] !== "string" || texto.length > 60) return rechazo(campo, `${campo} debe ser un texto de hasta 60 caracteres.`);
    lugares[campo] = texto;
  }

  // El consentimiento para promociones/saludos por WhatsApp es APARTE de
  // aceptar los términos del sorteo — solo se marca si el sorteo lo manda de
  // forma explícita. Sin el campo, queda en false (lo seguro).
  if (b.acepta_comunicaciones !== undefined && typeof b.acepta_comunicaciones !== "boolean") {
    return rechazo("acepta_comunicaciones", "acepta_comunicaciones debe ser true o false.");
  }

  // Fecha de registro en el CRM = el día (hora de Lima) en que la persona se
  // registró en el sorteo. Si el envío se demoró por reintentos, se respeta
  // el día original; sin created_at, es hoy. Nunca una fecha futura.
  let fechaRegistro = fechaHoyLima();
  if (b.created_at !== undefined && b.created_at !== null) {
    const momento = typeof b.created_at === "string" ? new Date(b.created_at) : null;
    if (!momento || Number.isNaN(momento.getTime())) {
      return rechazo("created_at", "created_at debe ser una fecha y hora ISO 8601 (ej. 2026-11-13T16:08:00-05:00).");
    }
    const dia = fechaHoyLima(momento);
    if (dia < fechaRegistro) fechaRegistro = dia;
  }

  if (b.modo_prueba !== undefined && typeof b.modo_prueba !== "boolean") {
    return rechazo("modo_prueba", "modo_prueba debe ser true o false.");
  }

  return {
    datos: {
      negocioId: b.negocio as NegocioId,
      sorteoSlug,
      sorteoNombre,
      nombres,
      apellidos,
      celular,
      fechaNacimiento: (b.fecha_nacimiento as string).trim(),
      departamento: lugares.departamento,
      provincia: lugares.provincia,
      distrito: lugares.distrito,
      aceptaComunicaciones: b.acepta_comunicaciones === true,
      fechaRegistro,
      // Solo para el log (trazabilidad de un envío concreto) — no se guarda.
      requestId: typeof b.request_id === "string" ? limpiarTexto(b.request_id).slice(0, 64) || null : null,
      modoPrueba: b.modo_prueba === true,
    },
  };
}

export async function POST(req: NextRequest) {
  const noAutorizado = verificarBearer(req, "SORTEO_WEBHOOK_SECRET");
  if (noAutorizado) return noAutorizado;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "El cuerpo debe ser JSON válido.", campo: "body" }, { status: 400 });
  }

  const validacion = validar(body);
  if ("error" in validacion) {
    return NextResponse.json({ ok: false, error: validacion.error, campo: validacion.campo }, { status: 400 });
  }
  const d = validacion.datos;

  // Sin datos personales en el log: solo qué pasó y de dónde.
  const responder = (resultado: "creado" | "duplicado") => {
    console.info("[webhook-sorteo]", JSON.stringify({
      resultado, sorteo: d.sorteoSlug, negocio: d.negocioId, request_id: d.requestId, modo_prueba: d.modoPrueba,
    }));
    return NextResponse.json({ ok: true, resultado, ...(d.modoPrueba ? { modo_prueba: true } : {}) });
  };

  const { existe, error: errorBusqueda } = await existeCliente(d.celular, d.fechaNacimiento);
  if (errorBusqueda) {
    console.error("[webhook-sorteo] No se pudo buscar duplicados:", errorBusqueda);
    return NextResponse.json({ ok: false, error: "No se pudo procesar el registro. Reintenta más tarde." }, { status: 500 });
  }
  if (existe) return responder("duplicado");

  // Prueba en seco: toda la validación y la búsqueda de duplicados real, pero
  // sin escribir nada — para que el sistema de sorteos pruebe su integración
  // sin crear contactos de verdad (el CRM no tiene un entorno de pruebas aparte).
  if (d.modoPrueba) return responder("creado");

  const { error: errorCrear } = await supabaseAdmin.from("clientes_individuales").insert({
    negocio_id: d.negocioId,
    numero: 0,
    fecha_registro: d.fechaRegistro,
    nombres: d.nombres,
    apellidos: d.apellidos,
    fecha_nacimiento: d.fechaNacimiento,
    celular: d.celular,
    departamento: d.departamento,
    provincia: d.provincia,
    distrito: d.distrito,
    origen: "sorteo",
    sorteo_slug: d.sorteoSlug,
    sorteo_nombre: d.sorteoNombre,
    registrado_por: null,
    acepta_comunicaciones: d.aceptaComunicaciones,
  });

  if (esDuplicadoDeLaBase(errorCrear)) return responder("duplicado");
  if (errorCrear) {
    console.error("[webhook-sorteo] No se pudo crear el cliente:", errorCrear.message);
    return NextResponse.json({ ok: false, error: "No se pudo procesar el registro. Reintenta más tarde." }, { status: 500 });
  }
  return responder("creado");
}
