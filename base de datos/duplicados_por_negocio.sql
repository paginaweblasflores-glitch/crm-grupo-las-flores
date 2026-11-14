-- ============================================================================
-- Duplicados de clientes: por NEGOCIO, no en todo el grupo — migración de UN
-- SOLO USO
-- ============================================================================
-- Ejecutar UNA VEZ en el SQL Editor de Supabase (se puede repetir sin problema),
-- DESPUÉS de integracion_sorteos.sql.
--
-- Qué cambia: integracion_sorteos.sql creó un índice único sobre
-- (celular, fecha_nacimiento) en todo el grupo. Eso impedía que una persona que
-- ya es cliente de Las Flores se registrara también como cliente de Umaru
-- (por ejemplo, al participar en un sorteo de Umaru). Pero Las Flores y Umaru
-- son negocios separados: cada uno atiende y le escribe a sus clientes por su
-- cuenta, y la misma persona puede serlo de los dos. Lo que NO puede pasar es
-- tener al mismo cliente dos veces en un mismo negocio.
--
-- Además quita la restricción UNIQUE antigua sobre `celular` SOLA
-- (clientes_individuales_celular_key), que en producción seguía activa: es la
-- que quitar_unicidad_celular_individuales.sql debía eliminar. Mientras exista,
-- el mismo número no puede estar en dos negocios ni compartirlo dos familiares.
--
-- Después de esto, el duplicado es: mismo negocio + mismo celular + misma fecha
-- de nacimiento. Es más permisivo que lo anterior (todo lo que ya existe lo
-- cumple), así que no puede fallar por datos existentes.

-- Restricción UNIQUE antigua solo sobre celular (se busca por nombre real).
do $$
declare
  nombre_constraint text;
begin
  for nombre_constraint in
    select tc.constraint_name
    from information_schema.table_constraints tc
    join information_schema.key_column_usage kcu
      on tc.constraint_name = kcu.constraint_name and tc.table_schema = kcu.table_schema
    where tc.table_schema = 'public'
      and tc.table_name = 'clientes_individuales'
      and tc.constraint_type = 'UNIQUE'
    group by tc.constraint_name
    having count(*) = 1 and max(kcu.column_name) = 'celular'
  loop
    execute format('alter table clientes_individuales drop constraint %I', nombre_constraint);
    raise notice 'Restricción % eliminada.', nombre_constraint;
  end loop;
end $$;

drop index if exists idx_clientes_individuales_celular_nacimiento;

create unique index if not exists idx_clientes_individuales_negocio_celular_nacimiento
  on clientes_individuales(negocio_id, celular, fecha_nacimiento);
