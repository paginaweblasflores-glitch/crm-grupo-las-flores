-- Ejecutar UNA VEZ en el proyecto de Supabase ya en producción, para activar
-- el "cerebro central": que un cambio hecho en una sesión (ej. Ventas Uno
-- registra un cliente) se refleje al toque en cualquier otra sesión abierta
-- (ej. Gerente General), sin recargar la página.
--
-- (Ya está incluido en schema.sql para el próximo reset desde cero — esto es
-- solo para aplicarlo a la base de datos que ya existe, sin volver a correr
-- todo schema.sql.)

alter publication supabase_realtime add table usuarios;
alter publication supabase_realtime add table clientes_individuales;
alter publication supabase_realtime add table clientes_corporativos;
alter publication supabase_realtime add table campanas;
alter publication supabase_realtime add table festividades;
alter publication supabase_realtime add table seguimiento_cumpleanos;
alter publication supabase_realtime add table config_saludo_cumpleanos;
alter publication supabase_realtime add table aprobacion_cumpleanos_mes;
