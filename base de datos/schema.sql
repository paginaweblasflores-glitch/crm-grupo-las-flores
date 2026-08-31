-- ============================================================================
-- CRM Grupo Las Flores — esquema de base de datos (Supabase / PostgreSQL)
-- ============================================================================
-- Refleja los tipos de src/lib/types.ts. Cubre todo el sistema salvo
-- Mensajería (el chat de WhatsApp sigue simulado a propósito — es el
-- simulacro de la futura API de WhatsApp Business, no data que deba vivir
-- acá todavía).
--
-- Cómo ejecutar: pega este archivo completo en Supabase → SQL Editor → Run.
-- Después corre seed.sql (aparte) para cargar los datos de prueba.
--
-- Seguridad: cada tabla tiene RLS (Row Level Security) activado con una
-- política abierta ("permitir todo") para que la app pueda leer/escribir
-- directo con la llave "anon" sin backend propio — es lo correcto para este
-- prototipo interno (nadie fuera del equipo tiene la URL ni la llave), pero
-- antes de manejar datos realmente sensibles habría que reemplazar esas
-- políticas por unas que sí validen quién es el usuario.
-- ============================================================================

-- --- Negocios (las 3 sedes del grupo) ---------------------------------------
-- "todas" (vista consolidada de Dirección/Gerencial) es un valor de UI, no
-- una fila real acá.
create table negocios (
  id text primary key,                    -- 'las-flores' | 'umaru' | 'mamina'
  nombre text not null,
  tipo text not null check (tipo in ('restaurante', 'hotel', 'restobar')),
  operando boolean not null default true,
  color_acento text not null,
  descripcion_estado text
);

-- --- Usuarios (cuentas del sistema) -----------------------------------------
-- Cuentas de ÁREA/CARGO, no de persona (excepto Gerente General, que además
-- guarda nombre_real). La contraseña queda en texto plano a propósito —
-- este prototipo no usa Supabase Auth todavía, es autenticación simple
-- contra esta tabla. No exponer esta tabla a nadie fuera del equipo.
create table usuarios (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  nombre_real text,
  cargo text not null,
  rol_tipo text not null check (rol_tipo in ('direccion', 'gerencial', 'ventas')),
  rol_label text not null,
  iniciales text not null,
  usuario text not null unique,           -- usuario de acceso (login)
  contrasena text not null,
  negocio_id text not null references negocios(id),
  creado_por uuid references usuarios(id),
  creado_en timestamptz not null default now()
);

-- --- Clientes individuales ---------------------------------------------------
create table clientes_individuales (
  id uuid primary key default gen_random_uuid(),
  negocio_id text not null references negocios(id),
  numero integer not null,
  fecha_registro date not null default current_date,
  nombres text not null,
  apellidos text not null,
  fecha_nacimiento date not null,
  celular text not null unique,
  -- Procedencia en cascada País → Departamento → Provincia → Distrito.
  -- Solo país es obligatorio de verdad; el resto queda en '' cuando no
  -- aplica (cliente fuera de Perú, o de Ayacucho/Huamanga dentro de Perú).
  pais text not null default 'Perú',
  departamento text not null default '',
  provincia text not null default '',
  distrito text not null default '',
  -- 'crm' = registrado desde el formulario (presencial). 'web' = capturado
  -- por la futura integración con la página de cada negocio.
  origen text not null default 'crm' check (origen in ('crm', 'web')),
  registrado_por uuid references usuarios(id),
  tipo_documento text check (tipo_documento in ('DNI', 'Carné de extranjería', 'Pasaporte')),
  numero_documento text,
  email text,
  genero text check (genero in ('Femenino', 'Masculino', 'Prefiere no decirlo')),
  acepta_comunicaciones boolean not null default true,
  creado_en timestamptz not null default now()
);
create index idx_clientes_individuales_negocio on clientes_individuales(negocio_id);

-- --- Clientes corporativos ----------------------------------------------------
create table clientes_corporativos (
  id uuid primary key default gen_random_uuid(),
  negocio_id text not null references negocios(id),
  numero integer not null,
  fecha_registro date not null default current_date,
  razon_social text not null,
  ruc text not null unique,
  direccion text not null,
  celular text not null unique,           -- del representante: es a quien Ventas contacta
  fecha_aniversario date,
  nombre_representante text not null,
  cargo_representante text not null default 'Gerente General',
  pais text not null default 'Perú',
  departamento text not null default '',
  provincia text not null default '',
  distrito text not null default '',
  registrado_por uuid references usuarios(id),
  acepta_comunicaciones boolean not null default true,
  creado_en timestamptz not null default now()
);
create index idx_clientes_corporativos_negocio on clientes_corporativos(negocio_id);

-- --- Días festivos y fechas comerciales ---------------------------------------
create table festividades (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  mes_dia text not null check (mes_dia ~ '^\d{2}-\d{2}$'),  -- 'MM-DD', se repite cada año
  tipo text not null check (tipo in ('religioso', 'civico', 'comercial')),
  -- alcanza_todas = true → todas las sedes. false → solo las de negocio_ids.
  alcanza_todas boolean not null default true,
  negocio_ids text[],
  descripcion text
);

-- --- Campañas (mensajes masivos por WhatsApp) ---------------------------------
create table campanas (
  id uuid primary key default gen_random_uuid(),
  alcanza_todas boolean not null default false,
  negocio_ids text[],                     -- sedes a las que llega, si no es "todas"
  nombre text not null,
  publico text not null check (publico in ('todos', 'natural', 'corporativo')),
  mensaje text not null,
  estado text not null default 'borrador' check (estado in ('borrador', 'aprobada')),
  creada_en date not null default current_date,
  aprobada_en date,
  clientes_objetivo uuid[],               -- congelado al aprobar
  contactados uuid[] not null default '{}',
  registrado_por uuid references usuarios(id),
  festividad_id uuid references festividades(id),
  creado_en timestamptz not null default now()
);

-- --- Seguimiento de cumpleaños -------------------------------------------------
-- cliente_id es polimórfico (individual o corporativo, ver cliente_tipo) —
-- por eso no lleva foreign key directa; la app resuelve contra la tabla que
-- corresponda según cliente_tipo.
create table seguimiento_cumpleanos (
  id uuid primary key default gen_random_uuid(),
  negocio_id text not null references negocios(id),
  cliente_id uuid not null,
  cliente_tipo text not null default 'individual' check (cliente_tipo in ('individual', 'corporativo')),
  nombre text not null,
  fecha_cumple date not null,
  celular text not null,
  -- Estado lo marca el sistema solo (AutoEnvioCumpleanos), nunca a mano.
  saludo_enviado boolean not null default false,
  -- Reservación la actualiza Ventas a mano después de hablar con el cliente.
  reservacion text not null default 'pendiente' check (reservacion in ('si', 'no', 'pendiente')),
  -- Personalización del saludo para ESTE cliente — si son null, se usa la
  -- plantilla/hora general del negocio (config_saludo_cumpleanos).
  mensaje_personalizado text,
  hora_personalizada text,
  creado_en timestamptz not null default now()
);
create index idx_seguimiento_negocio on seguimiento_cumpleanos(negocio_id);
create index idx_seguimiento_cliente on seguimiento_cumpleanos(cliente_id);

-- --- Aprobación mensual del envío automático de cumpleaños --------------------
-- Se reinicia sola cada mes calendario (la llave es negocio + año + mes) —
-- aprobar agosto no aprueba septiembre. Sin esta aprobación, el saludo
-- automático no se manda aunque hoy sea el cumpleaños de alguien.
create table aprobacion_cumpleanos_mes (
  negocio_id text not null references negocios(id),
  anio integer not null,
  mes integer not null check (mes between 1 and 12),
  aprobado boolean not null default false,
  aprobado_en timestamptz,
  primary key (negocio_id, anio, mes)
);

-- --- Configuración general del saludo automático de cumpleaños ----------------
-- Plantilla + hora que se aplican a todos los clientes de un negocio, salvo
-- que un cliente tenga su propia personalización (ver seguimiento_cumpleanos).
create table config_saludo_cumpleanos (
  negocio_id text primary key references negocios(id),
  mensaje text not null,
  hora text not null default '09:00'      -- 'HH:mm'
);

-- ============================================================================
-- Row Level Security — abierto para el prototipo (ver nota de seguridad arriba)
-- ============================================================================
alter table negocios enable row level security;
alter table usuarios enable row level security;
alter table clientes_individuales enable row level security;
alter table clientes_corporativos enable row level security;
alter table festividades enable row level security;
alter table campanas enable row level security;
alter table seguimiento_cumpleanos enable row level security;
alter table aprobacion_cumpleanos_mes enable row level security;
alter table config_saludo_cumpleanos enable row level security;

create policy "permitir todo (prototipo)" on negocios for all using (true) with check (true);
create policy "permitir todo (prototipo)" on usuarios for all using (true) with check (true);
create policy "permitir todo (prototipo)" on clientes_individuales for all using (true) with check (true);
create policy "permitir todo (prototipo)" on clientes_corporativos for all using (true) with check (true);
create policy "permitir todo (prototipo)" on festividades for all using (true) with check (true);
create policy "permitir todo (prototipo)" on campanas for all using (true) with check (true);
create policy "permitir todo (prototipo)" on seguimiento_cumpleanos for all using (true) with check (true);
create policy "permitir todo (prototipo)" on aprobacion_cumpleanos_mes for all using (true) with check (true);
create policy "permitir todo (prototipo)" on config_saludo_cumpleanos for all using (true) with check (true);

-- ============================================================================
-- Tiempo real (Supabase Realtime) — sin esto, un cambio hecho en una sesión
-- (ej. Ventas Uno registra un cliente) no se refleja en las demás sesiones
-- abiertas (ej. Gerente General) hasta que alguien recarga la página a mano.
-- Con esto, cada mutación (crear/editar/eliminar) se transmite al toque a
-- toda pestaña/sesión que tenga el CRM abierto — ver suscribirCambios() en
-- src/lib/db.ts, que es quien recibe estos eventos del lado de la app.
-- ============================================================================
alter publication supabase_realtime add table usuarios;
alter publication supabase_realtime add table clientes_individuales;
alter publication supabase_realtime add table clientes_corporativos;
alter publication supabase_realtime add table campanas;
alter publication supabase_realtime add table festividades;
alter publication supabase_realtime add table seguimiento_cumpleanos;
alter publication supabase_realtime add table config_saludo_cumpleanos;
alter publication supabase_realtime add table aprobacion_cumpleanos_mes;
