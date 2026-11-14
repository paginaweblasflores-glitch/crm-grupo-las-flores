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
-- Después de esto, el duplicado es: mismo negocio + mismo celular + misma fecha
-- de nacimiento. Es más permisivo que el índice anterior (todo lo que ya existe
-- lo cumple), así que no puede fallar por datos existentes.

drop index if exists idx_clientes_individuales_celular_nacimiento;

create unique index if not exists idx_clientes_individuales_negocio_celular_nacimiento
  on clientes_individuales(negocio_id, celular, fecha_nacimiento);
