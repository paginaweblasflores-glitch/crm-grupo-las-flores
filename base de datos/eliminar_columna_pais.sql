-- Ejecutar UNA VEZ en el proyecto de Supabase ya en producción, para quitar
-- la columna "pais" que ya no se usa (ya está quitada en schema.sql para el
-- próximo reset desde cero — esto es solo para aplicarlo a la base de datos
-- que ya existe, sin volver a correr todo schema.sql).
--
-- Decisión de Mijael: el negocio solo atiende clientes de Perú, así que el
-- campo País no hace falta ni en el formulario ni en la base de datos.

alter table clientes_individuales drop column if exists pais;
alter table clientes_corporativos drop column if exists pais;
