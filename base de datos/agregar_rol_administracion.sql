-- Ejecutar UNA VEZ en el proyecto de Supabase ya en producción, para que la
-- base de datos acepte el nuevo rol "administracion" (ya está incluido en
-- schema.sql para el próximo reset desde cero — esto es solo para aplicarlo
-- a la base de datos que ya existe, sin volver a correr todo schema.sql).

alter table usuarios drop constraint if exists usuarios_rol_tipo_check;
alter table usuarios add constraint usuarios_rol_tipo_check
  check (rol_tipo in ('direccion', 'gerencial', 'ventas', 'administracion'));
