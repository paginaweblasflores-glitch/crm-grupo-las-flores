-- Vacía TODAS las tablas del CRM (deja la estructura intacta) para poder
-- volver a ejecutar seed.sql desde cero. CASCADE se encarga del orden de
-- las llaves foráneas automáticamente.
--
-- ADVERTENCIA: esto borra TODOS los datos actuales (clientes, campañas,
-- usuarios, seguimientos, etc.) de forma permanente. Después de correr
-- esto, ejecuta seed.sql para volver a poblar la base con los ~58 datos
-- de prueba.

truncate table
  negocios,
  usuarios,
  clientes_individuales,
  clientes_corporativos,
  campanas,
  festividades,
  seguimiento_cumpleanos,
  aprobacion_cumpleanos_mes,
  config_saludo_cumpleanos
cascade;
