-- ============================================================================
-- Seguridad de credenciales — PASO 2 de 2
-- ============================================================================
-- ¡OJO! Correr esto SOLO después de:
--   1. Haber corrido asegurar_credenciales_paso1.sql
--   2. Haber corrido el script migrar-contrasenas.js y que haya confirmado
--      "listo" para TODAS las cuentas (revisa la salida del script — si
--      falta alguna cuenta, avisa antes de seguir)
--
-- Esto borra para siempre la columna vieja de contraseña en texto plano de
-- "usuarios" — a partir de acá esa contraseña solo existe como hash, en la
-- tabla aparte y totalmente cerrada usuario_credenciales.
-- ============================================================================

alter table usuarios drop column contrasena;
