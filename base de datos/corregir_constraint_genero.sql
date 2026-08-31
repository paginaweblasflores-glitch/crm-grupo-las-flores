-- Ejecutar UNA VEZ en el proyecto de Supabase ya en producción, para quitar
-- 'Prefiere no decirlo' de las opciones válidas de género (ya está corregido
-- en schema.sql para el próximo reset desde cero). El campo sigue siendo
-- opcional — "prefiere no decir" ya lo cubre dejarlo vacío (NULL), no hace
-- falta un valor explícito para eso.

alter table clientes_individuales drop constraint if exists clientes_individuales_genero_check;
alter table clientes_individuales add constraint clientes_individuales_genero_check
  check (genero in ('Femenino', 'Masculino'));
