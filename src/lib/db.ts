// Capa de acceso a Supabase — convierte entre las filas snake_case de
// Postgres y los tipos camelCase de la app (src/lib/types.ts), y agrupa
// todas las consultas/escrituras en un solo lugar. Reemplaza los antiguos
// mock/*.ts (datos de mentira generados en TypeScript) — ver
// "base de datos/schema.sql" para el esquema real.
"use client";

import { supabase } from "./supabase";
import {
  Negocio, NegocioId, Usuario, ClienteIndividual, ClienteCorporativo,
  Campana, Festividad, SeguimientoCumple,
} from "./types";

// Normaliza un nombre de persona a "Cada Palabra Capitalizada" sin importar
// cómo lo haya tecleado quien registró al cliente (todo minúscula, todo
// mayúscula, mezclado) — así la tabla de Clientes, la Ficha 360°, los
// mensajes de WhatsApp, etc. se ven siempre uniformes, sin tener que tocar
// cada pantalla que muestra un nombre por separado. Se aplica acá (al leer
// de Supabase), no al guardar, para que también deje parejos los datos que
// ya existían con distinta capitalización antes de este cambio.
function capitalizar(texto: string): string {
  return texto
    .trim()
    .toLocaleLowerCase("es-PE")
    .split(/\s+/)
    .map((palabra) => (palabra ? palabra.charAt(0).toLocaleUpperCase("es-PE") + palabra.slice(1) : palabra))
    .join(" ");
}

// ============================================================================
// Mappers — fila de Supabase (snake_case) → tipo de la app (camelCase)
// ============================================================================

function mapNegocio(r: Record<string, unknown>): Negocio {
  return {
    id: r.id as NegocioId,
    nombre: r.nombre as string,
    tipo: r.tipo as Negocio["tipo"],
    operando: r.operando as boolean,
    colorAcento: r.color_acento as string,
    descripcionEstado: r.descripcion_estado as string,
  };
}

export function mapUsuario(r: Record<string, unknown>): Usuario {
  return {
    id: r.id as string,
    nombre: r.nombre as string,
    nombreReal: (r.nombre_real as string) ?? undefined,
    cargo: r.cargo as string,
    rolTipo: r.rol_tipo as Usuario["rolTipo"],
    rolLabel: r.rol_label as string,
    iniciales: r.iniciales as string,
    usuario: r.usuario as string,
    contrasena: r.contrasena as string,
    negocioId: r.negocio_id as NegocioId,
    creadoPor: (r.creado_por as string) ?? undefined,
  };
}

export function mapClienteIndividual(r: Record<string, unknown>): ClienteIndividual {
  return {
    id: r.id as string,
    negocioId: r.negocio_id as NegocioId,
    numero: r.numero as number,
    fechaRegistro: r.fecha_registro as string,
    creadoEn: (r.creado_en as string) ?? undefined,
    nombres: capitalizar(r.nombres as string),
    apellidos: capitalizar(r.apellidos as string),
    fechaNacimiento: r.fecha_nacimiento as string,
    celular: r.celular as string,
    pais: r.pais as string,
    departamento: r.departamento as string,
    provincia: r.provincia as string,
    distrito: r.distrito as string,
    origen: r.origen as ClienteIndividual["origen"],
    registradoPor: (r.registrado_por as string) ?? undefined,
    tipoDocumento: (r.tipo_documento as ClienteIndividual["tipoDocumento"]) ?? undefined,
    numeroDocumento: (r.numero_documento as string) ?? undefined,
    email: (r.email as string) ?? undefined,
    genero: (r.genero as ClienteIndividual["genero"]) ?? undefined,
    aceptaComunicaciones: (r.acepta_comunicaciones as boolean) ?? undefined,
  };
}

export function mapClienteCorporativo(r: Record<string, unknown>): ClienteCorporativo {
  return {
    id: r.id as string,
    negocioId: r.negocio_id as NegocioId,
    numero: r.numero as number,
    fechaRegistro: r.fecha_registro as string,
    creadoEn: (r.creado_en as string) ?? undefined,
    razonSocial: r.razon_social as string,
    ruc: r.ruc as string,
    direccion: r.direccion as string,
    celular: r.celular as string,
    fechaAniversario: (r.fecha_aniversario as string) ?? "",
    nombreRepresentante: capitalizar(r.nombre_representante as string),
    cargoRepresentante: r.cargo_representante as string,
    pais: r.pais as string,
    departamento: r.departamento as string,
    provincia: r.provincia as string,
    distrito: r.distrito as string,
    registradoPor: (r.registrado_por as string) ?? undefined,
    aceptaComunicaciones: (r.acepta_comunicaciones as boolean) ?? undefined,
  };
}

export function mapCampana(r: Record<string, unknown>): Campana {
  return {
    id: r.id as string,
    negocios: r.alcanza_todas ? "todas" : ((r.negocio_ids as NegocioId[]) ?? []),
    nombre: r.nombre as string,
    publico: r.publico as Campana["publico"],
    mensaje: r.mensaje as string,
    estado: r.estado as Campana["estado"],
    creadaEn: r.creada_en as string,
    aprobadaEn: (r.aprobada_en as string) ?? undefined,
    clientesObjetivo: (r.clientes_objetivo as string[]) ?? undefined,
    contactados: (r.contactados as string[]) ?? [],
    registradoPor: (r.registrado_por as string) ?? undefined,
    festividadId: (r.festividad_id as string) ?? undefined,
  };
}

export function mapFestividad(r: Record<string, unknown>): Festividad {
  return {
    id: r.id as string,
    nombre: r.nombre as string,
    mesDia: r.mes_dia as string,
    tipo: r.tipo as Festividad["tipo"],
    alcance: r.alcanza_todas ? "todas" : ((r.negocio_ids as NegocioId[]) ?? []),
    descripcion: (r.descripcion as string) ?? undefined,
  };
}

export function mapSeguimiento(r: Record<string, unknown>): SeguimientoCumple {
  return {
    id: r.id as string,
    negocioId: r.negocio_id as NegocioId,
    clienteId: r.cliente_id as string,
    clienteTipo: r.cliente_tipo as SeguimientoCumple["clienteTipo"],
    nombre: r.nombre as string,
    fechaCumple: r.fecha_cumple as string,
    celular: r.celular as string,
    saludoEnviado: r.saludo_enviado as boolean,
    reservacion: r.reservacion as SeguimientoCumple["reservacion"],
    mensajePersonalizado: (r.mensaje_personalizado as string) ?? undefined,
    horaPersonalizada: (r.hora_personalizada as string) ?? undefined,
  };
}

export interface ConfigSaludoRow {
  negocioId: NegocioId;
  mensaje: string;
  hora: string;
}

export interface AprobacionMesRow {
  negocioId: NegocioId;
  anio: number;
  mes: number;
  aprobado: boolean;
}

// ============================================================================
// Carga inicial — un solo viaje de ida y vuelta por tabla, todo en paralelo.
// ============================================================================
export interface DatosApp {
  negocios: Negocio[];
  usuarios: Usuario[];
  clientesIndividuales: ClienteIndividual[];
  clientesCorporativos: ClienteCorporativo[];
  campanas: Campana[];
  festividades: Festividad[];
  seguimientos: SeguimientoCumple[];
  configsSaludo: ConfigSaludoRow[];
  aprobaciones: AprobacionMesRow[];
}

export async function cargarTodo(): Promise<DatosApp> {
  const [
    negocios, usuarios, individuales, corporativos, campanas,
    festividades, seguimientos, configsSaludo, aprobaciones,
  ] = await Promise.all([
    supabase.from("negocios").select("*"),
    // El más reciente primero — el resto de la app (Clientes, Panel
    // Gerencial, ranking de asesores, etc.) confía en el orden que ya trae
    // este arreglo, no vuelve a ordenar por su cuenta. Sin esto, un cliente
    // recién registrado aparecía al final de la lista en vez de arriba,
    // porque Postgres no garantiza ningún orden si no se pide uno explícito.
    supabase.from("usuarios").select("*").order("creado_en", { ascending: false }),
    supabase.from("clientes_individuales").select("*").order("creado_en", { ascending: false }),
    supabase.from("clientes_corporativos").select("*").order("creado_en", { ascending: false }),
    supabase.from("campanas").select("*").order("creado_en", { ascending: false }),
    supabase.from("festividades").select("*"),
    supabase.from("seguimiento_cumpleanos").select("*").order("creado_en", { ascending: false }),
    supabase.from("config_saludo_cumpleanos").select("*"),
    supabase.from("aprobacion_cumpleanos_mes").select("*"),
  ]);

  for (const r of [negocios, usuarios, individuales, corporativos, campanas, festividades, seguimientos, configsSaludo, aprobaciones]) {
    if (r.error) throw new Error(`Supabase: ${r.error.message}`);
  }

  return {
    negocios: (negocios.data ?? []).map(mapNegocio),
    usuarios: (usuarios.data ?? []).map(mapUsuario),
    clientesIndividuales: (individuales.data ?? []).map(mapClienteIndividual),
    clientesCorporativos: (corporativos.data ?? []).map(mapClienteCorporativo),
    campanas: (campanas.data ?? []).map(mapCampana),
    festividades: (festividades.data ?? []).map(mapFestividad),
    seguimientos: (seguimientos.data ?? []).map(mapSeguimiento),
    configsSaludo: (configsSaludo.data ?? []).map((r) => ({
      negocioId: r.negocio_id as NegocioId, mensaje: r.mensaje as string, hora: r.hora as string,
    })),
    aprobaciones: (aprobaciones.data ?? []).map((r) => ({
      negocioId: r.negocio_id as NegocioId, anio: r.anio as number, mes: r.mes as number, aprobado: r.aprobado as boolean,
    })),
  };
}

// ============================================================================
// Usuarios
// ============================================================================
export async function dbCrearUsuario(u: Usuario): Promise<Usuario> {
  const { data, error } = await supabase.from("usuarios").insert({
    nombre: u.nombre, nombre_real: u.nombreReal ?? null, cargo: u.cargo, rol_tipo: u.rolTipo,
    rol_label: u.rolLabel, iniciales: u.iniciales, usuario: u.usuario, contrasena: u.contrasena,
    negocio_id: u.negocioId, creado_por: u.creadoPor ?? null,
  }).select().single();
  if (error) throw new Error(error.message);
  return mapUsuario(data);
}

export async function dbActualizarUsuario(id: string, patch: Partial<Usuario>): Promise<void> {
  const row: Record<string, unknown> = {};
  if (patch.nombre !== undefined) row.nombre = patch.nombre;
  if (patch.nombreReal !== undefined) row.nombre_real = patch.nombreReal;
  if (patch.cargo !== undefined) row.cargo = patch.cargo;
  if (patch.rolTipo !== undefined) row.rol_tipo = patch.rolTipo;
  if (patch.rolLabel !== undefined) row.rol_label = patch.rolLabel;
  if (patch.iniciales !== undefined) row.iniciales = patch.iniciales;
  if (patch.usuario !== undefined) row.usuario = patch.usuario;
  if (patch.contrasena !== undefined) row.contrasena = patch.contrasena;
  if (patch.negocioId !== undefined) row.negocio_id = patch.negocioId;
  const { error } = await supabase.from("usuarios").update(row).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function dbEliminarUsuario(id: string): Promise<void> {
  const { error } = await supabase.from("usuarios").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

// ============================================================================
// Clientes individuales / corporativos
// ============================================================================
export async function dbCrearClienteIndividual(c: ClienteIndividual): Promise<ClienteIndividual> {
  const { data, error } = await supabase.from("clientes_individuales").insert({
    negocio_id: c.negocioId, numero: c.numero, fecha_registro: c.fechaRegistro, nombres: c.nombres,
    apellidos: c.apellidos, fecha_nacimiento: c.fechaNacimiento, celular: c.celular, pais: c.pais,
    departamento: c.departamento, provincia: c.provincia, distrito: c.distrito, origen: c.origen,
    registrado_por: c.registradoPor ?? null, tipo_documento: c.tipoDocumento ?? null,
    numero_documento: c.numeroDocumento ?? null, email: c.email ?? null, genero: c.genero ?? null,
    acepta_comunicaciones: c.aceptaComunicaciones ?? true,
  }).select().single();
  if (error) throw new Error(error.message);
  return mapClienteIndividual(data);
}

export async function dbCrearClienteCorporativo(c: ClienteCorporativo): Promise<ClienteCorporativo> {
  const { data, error } = await supabase.from("clientes_corporativos").insert({
    negocio_id: c.negocioId, numero: c.numero, fecha_registro: c.fechaRegistro, razon_social: c.razonSocial,
    ruc: c.ruc, direccion: c.direccion, celular: c.celular, fecha_aniversario: c.fechaAniversario || null,
    nombre_representante: c.nombreRepresentante, cargo_representante: c.cargoRepresentante, pais: c.pais,
    departamento: c.departamento, provincia: c.provincia, distrito: c.distrito,
    registrado_por: c.registradoPor ?? null, acepta_comunicaciones: c.aceptaComunicaciones ?? true,
  }).select().single();
  if (error) throw new Error(error.message);
  return mapClienteCorporativo(data);
}

// ============================================================================
// Campañas
// ============================================================================
export async function dbCrearCampana(c: Campana): Promise<Campana> {
  const { data, error } = await supabase.from("campanas").insert({
    alcanza_todas: c.negocios === "todas", negocio_ids: c.negocios === "todas" ? null : c.negocios,
    nombre: c.nombre, publico: c.publico, mensaje: c.mensaje, estado: c.estado, creada_en: c.creadaEn,
    aprobada_en: c.aprobadaEn ?? null, clientes_objetivo: c.clientesObjetivo ?? null,
    contactados: c.contactados, registrado_por: c.registradoPor ?? null, festividad_id: c.festividadId ?? null,
  }).select().single();
  if (error) throw new Error(error.message);
  return mapCampana(data);
}

export async function dbActualizarCampana(id: string, patch: Partial<Campana>): Promise<void> {
  const row: Record<string, unknown> = {};
  if (patch.negocios !== undefined) {
    row.alcanza_todas = patch.negocios === "todas";
    row.negocio_ids = patch.negocios === "todas" ? null : patch.negocios;
  }
  if (patch.nombre !== undefined) row.nombre = patch.nombre;
  if (patch.publico !== undefined) row.publico = patch.publico;
  if (patch.mensaje !== undefined) row.mensaje = patch.mensaje;
  if (patch.estado !== undefined) row.estado = patch.estado;
  if (patch.aprobadaEn !== undefined) row.aprobada_en = patch.aprobadaEn;
  if (patch.clientesObjetivo !== undefined) row.clientes_objetivo = patch.clientesObjetivo;
  if (patch.contactados !== undefined) row.contactados = patch.contactados;
  const { error } = await supabase.from("campanas").update(row).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function dbEliminarCampana(id: string): Promise<void> {
  const { error } = await supabase.from("campanas").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

// ============================================================================
// Días festivos
// ============================================================================
export async function dbCrearFestividad(f: Festividad): Promise<Festividad> {
  const { data, error } = await supabase.from("festividades").insert({
    nombre: f.nombre, mes_dia: f.mesDia, tipo: f.tipo, alcanza_todas: f.alcance === "todas",
    negocio_ids: f.alcance === "todas" ? null : f.alcance, descripcion: f.descripcion ?? null,
  }).select().single();
  if (error) throw new Error(error.message);
  return mapFestividad(data);
}

export async function dbActualizarFestividad(id: string, patch: Partial<Festividad>): Promise<void> {
  const row: Record<string, unknown> = {};
  if (patch.nombre !== undefined) row.nombre = patch.nombre;
  if (patch.mesDia !== undefined) row.mes_dia = patch.mesDia;
  if (patch.tipo !== undefined) row.tipo = patch.tipo;
  if (patch.alcance !== undefined) {
    row.alcanza_todas = patch.alcance === "todas";
    row.negocio_ids = patch.alcance === "todas" ? null : patch.alcance;
  }
  if (patch.descripcion !== undefined) row.descripcion = patch.descripcion;
  const { error } = await supabase.from("festividades").update(row).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function dbEliminarFestividad(id: string): Promise<void> {
  const { error } = await supabase.from("festividades").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

// ============================================================================
// Seguimiento de cumpleaños
// ============================================================================
export async function dbCrearSeguimiento(s: SeguimientoCumple): Promise<SeguimientoCumple> {
  const { data, error } = await supabase.from("seguimiento_cumpleanos").insert({
    negocio_id: s.negocioId, cliente_id: s.clienteId, cliente_tipo: s.clienteTipo, nombre: s.nombre,
    fecha_cumple: s.fechaCumple, celular: s.celular, saludo_enviado: s.saludoEnviado,
    reservacion: s.reservacion, mensaje_personalizado: s.mensajePersonalizado ?? null,
    hora_personalizada: s.horaPersonalizada ?? null,
  }).select().single();
  if (error) throw new Error(error.message);
  return mapSeguimiento(data);
}

export async function dbActualizarSeguimiento(id: string, patch: Partial<SeguimientoCumple>): Promise<void> {
  const row: Record<string, unknown> = {};
  if (patch.saludoEnviado !== undefined) row.saludo_enviado = patch.saludoEnviado;
  if (patch.reservacion !== undefined) row.reservacion = patch.reservacion;
  if (patch.mensajePersonalizado !== undefined) row.mensaje_personalizado = patch.mensajePersonalizado;
  if (patch.horaPersonalizada !== undefined) row.hora_personalizada = patch.horaPersonalizada;
  const { error } = await supabase.from("seguimiento_cumpleanos").update(row).eq("id", id);
  if (error) throw new Error(error.message);
}

// ============================================================================
// Configuración del saludo automático + aprobación mensual
// ============================================================================
export async function dbGuardarConfigSaludo(negocioId: NegocioId, mensaje: string, hora: string): Promise<void> {
  const { error } = await supabase.from("config_saludo_cumpleanos")
    .upsert({ negocio_id: negocioId, mensaje, hora });
  if (error) throw new Error(error.message);
}

export async function dbAprobarMes(negocioId: NegocioId, anio: number, mes: number): Promise<void> {
  const { error } = await supabase.from("aprobacion_cumpleanos_mes")
    .upsert({ negocio_id: negocioId, anio, mes, aprobado: true, aprobado_en: new Date().toISOString() });
  if (error) throw new Error(error.message);
}

// ============================================================================
// Tiempo real (Supabase Realtime) — el "cerebro" central: cuando alguien crea,
// edita o borra algo en una pestaña/sesión, esto avisa a TODAS las demás
// pestañas/sesiones abiertas al toque, sin que nadie tenga que recargar la
// página. Sin esto, cada sesión solo ve la foto del momento en que abrió el
// CRM (ver cargarTodo arriba) — exactamente el bug que reportó Mijael: un
// cliente nuevo de Ventas Uno no aparecía en la sesión de Gerente General
// hasta recargar.
//
// Requiere que las tablas estén agregadas a la publicación `supabase_realtime`
// en Postgres (ver "base de datos/schema.sql" y "habilitar_realtime.sql") —
// sin eso, Supabase no manda ningún evento aunque el código de acá esté bien.
export const TABLAS_TIEMPO_REAL = [
  "usuarios",
  "clientes_individuales",
  "clientes_corporativos",
  "campanas",
  "festividades",
  "seguimiento_cumpleanos",
  "config_saludo_cumpleanos",
  "aprobacion_cumpleanos_mes",
] as const;

export type TablaTiempoReal = (typeof TABLAS_TIEMPO_REAL)[number];
export type TipoCambio = "INSERT" | "UPDATE" | "DELETE";

export interface CambioRealtime {
  tabla: TablaTiempoReal;
  tipo: TipoCambio;
  nueva: Record<string, unknown> | null; // fila nueva (INSERT/UPDATE)
  vieja: Record<string, unknown> | null; // fila vieja (UPDATE/DELETE) — solo trae las columnas de la llave primaria
}

// Un solo canal para las 8 tablas — devuelve la función para cerrarlo
// (llamarla al desmontar el DataProvider).
export function suscribirCambios(onCambio: (c: CambioRealtime) => void): () => void {
  let canal = supabase.channel("crm-cambios");
  for (const tabla of TABLAS_TIEMPO_REAL) {
    canal = canal.on(
      "postgres_changes",
      { event: "*", schema: "public", table: tabla },
      (payload) => {
        onCambio({
          tabla,
          tipo: payload.eventType as TipoCambio,
          nueva: (payload.new as Record<string, unknown>) ?? null,
          vieja: (payload.old as Record<string, unknown>) ?? null,
        });
      }
    );
  }
  canal.subscribe();
  return () => { supabase.removeChannel(canal); };
}
