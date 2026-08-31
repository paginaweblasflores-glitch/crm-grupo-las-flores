-- Ejecutar UNA VEZ en el proyecto de Supabase ya en producción, para agregar
-- la columna que faltaba a la tabla que ya existe (ya está incluida en
-- schema.sql para el próximo reset desde cero — esto es solo para aplicarla
-- a la base de datos que ya existe, sin volver a correr todo schema.sql).
--
-- Guarda la hora REAL en que se mandó el saludo de cumpleaños, para que el
-- chat de Mensajería muestre la hora verdadera en vez de fabricar una fecha
-- relativa inventada (ver semillaConversacion en src/lib/mensajes.ts).

alter table seguimiento_cumpleanos add column if not exists saludo_enviado_en timestamptz;

-- Backfill: para filas que YA estaban marcadas como enviadas antes de que
-- existiera esta columna (ej. el saludo de Carlos), usa creado_en como la
-- mejor aproximación disponible a la hora real de envío — la fila se crea
-- en el mismo momento en que AutoEnvioCumpleanos manda el saludo, así que
-- es un proxy razonable, mejor que dejarlo en blanco.
update seguimiento_cumpleanos
set saludo_enviado_en = creado_en
where saludo_enviado = true and saludo_enviado_en is null;
