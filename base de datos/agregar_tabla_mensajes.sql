-- ============================================================================
-- Mensajería real — reemplaza el chat simulado en localStorage
-- ============================================================================
-- Antes cada mensaje "enviado" (saludo de cumpleaños, campaña, o escrito a
-- mano en Mensajería) se guardaba solo en el localStorage del navegador de
-- quien lo mandó — nunca en la base de datos. Eso traía dos problemas reales:
--   1. Cada dispositivo tenía su propia copia: un mensaje mandado desde la
--      compu de Ventas no se veía en el celular de Gerencial, y viceversa.
--   2. Para saber "qué clientes tienen conversación" y en qué orden,
--      Mensajería tenía que recalcular en el navegador, para CADA cliente,
--      si aparecía en el arreglo `contactados` de cada campaña — con miles
--      de clientes reales y una campaña aprobada a "todos", eso se volvía
--      millones de comparaciones y el módulo se ponía notoriamente lento al
--      cambiar de pantalla (caso real: Restaurante Las Flores, set. 2026).
--
-- Con esta tabla, un mensaje es una fila real, indexada por cliente — nada
-- que recalcular al vuelo cruzando arreglos.
--
-- Ejecutar UNA VEZ en el SQL Editor de Supabase.

create table mensajes (
  id uuid primary key default gen_random_uuid(),
  negocio_id text not null references negocios(id),
  cliente_id uuid not null,               -- polimórfico (individual o corporativo), igual que seguimiento_cumpleanos
  cliente_tipo text not null default 'individual' check (cliente_tipo in ('individual', 'corporativo')),
  de text not null check (de in ('negocio', 'cliente')),
  texto text not null,
  -- De dónde vino — solo para trazabilidad/depuración, nunca se muestra al
  -- cliente. origen_id es el id del seguimiento o la campaña que lo generó
  -- (null si "manual", escrito a mano desde Mensajería).
  origen text not null check (origen in ('cumpleanos', 'campana', 'manual')),
  origen_id uuid,
  creado_en timestamptz not null default now()
);

create index idx_mensajes_cliente on mensajes(cliente_id, creado_en desc);
create index idx_mensajes_negocio on mensajes(negocio_id, creado_en desc);
-- Evita mandar el mismo saludo/campaña dos veces al mismo cliente si dos
-- sesiones disparan el mismo envío casi al mismo tiempo (mismo criterio que
-- ya usaba el `idEstable` del chat simulado en localStorage).
create unique index idx_mensajes_origen_unico on mensajes(cliente_id, origen, origen_id) where origen_id is not null;

alter table mensajes enable row level security;
create policy "permitir todo (prototipo)" on mensajes for all using (true) with check (true);

alter publication supabase_realtime add table mensajes;
