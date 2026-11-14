-- ============================================================================
-- Integración con el sistema de sorteos — migración de UN SOLO USO
-- ============================================================================
-- Ejecutar UNA VEZ en el SQL Editor de Supabase, ANTES de que el sistema de
-- sorteos empiece a mandar registros (POST /api/clientes/webhook-sorteo).
--
-- Qué hace:
--   1. Agrega 'sorteo' como un origen válido de un cliente (hoy: 'crm' | 'web'),
--      para que las estadísticas distingan a los clientes que llegaron por un
--      sorteo (ej. "NAVIDAD CON LAS FLORES") de los de la web o presenciales.
--   2. Agrega sorteo_slug / sorteo_nombre — de QUÉ sorteo vino cada cliente —
--      para poder contar cuántos clientes captó cada sorteo. Solo un cliente
--      con origen 'sorteo' puede (y debe) llevarlos.
--   3. Hace cumplir en la base de datos la regla de duplicados del CRM: no
--      puede haber dos clientes con el mismo celular Y la misma fecha de
--      nacimiento EN EL MISMO NEGOCIO (Las Flores y Umaru son negocios
--      separados: la misma persona puede ser cliente de los dos). Hasta ahora
--      esa regla solo la validaba el formulario manual (clientes/page.tsx) —
--      con una integración automática recibiendo registros de otro sistema, la
--      base tiene que garantizarla ella misma (también si dos peticiones
--      iguales llegan al mismo tiempo).
--      Verificado antes de escribir esto, con la base real: 0 pares repetidos,
--      así que el índice se puede crear sin tocar ningún dato.
--      (Si ya corriste una versión anterior de este archivo que creaba el
--      índice sobre todo el grupo, corre además duplicados_por_negocio.sql.)

-- 1) origen: permitir 'sorteo' -------------------------------------------------
-- El nombre de la restricción se busca en vez de asumirlo (mismo criterio que
-- quitar_unicidad_celular_individuales.sql).
do $$
declare
  nombre_check text;
begin
  select conname into nombre_check
  from pg_constraint
  where conrelid = 'clientes_individuales'::regclass
    and contype = 'c'
    and pg_get_constraintdef(oid) ilike '%origen%';
  if nombre_check is not null then
    execute format('alter table clientes_individuales drop constraint %I', nombre_check);
  end if;
end $$;

alter table clientes_individuales
  add constraint clientes_individuales_origen_check
  check (origen in ('crm', 'web', 'sorteo'));

-- 2) de qué sorteo vino ----------------------------------------------------------
alter table clientes_individuales add column if not exists sorteo_slug text;
alter table clientes_individuales add column if not exists sorteo_nombre text;

-- Coherencia: origen 'sorteo' <=> lleva sorteo_slug.
alter table clientes_individuales
  drop constraint if exists clientes_individuales_sorteo_coherente;
alter table clientes_individuales
  add constraint clientes_individuales_sorteo_coherente
  check ((origen = 'sorteo') = (sorteo_slug is not null));

create index if not exists idx_clientes_individuales_sorteo
  on clientes_individuales(sorteo_slug) where sorteo_slug is not null;

-- 3) duplicados: mismo negocio + mismo celular + misma fecha de nacimiento --------
drop index if exists idx_clientes_individuales_celular_nacimiento; -- versión anterior (todo el grupo)
create unique index if not exists idx_clientes_individuales_negocio_celular_nacimiento
  on clientes_individuales(negocio_id, celular, fecha_nacimiento);
