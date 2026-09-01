-- ============================================================================
-- Seguridad de credenciales — PASO 1 de 2
-- ============================================================================
-- Hasta ahora la contraseña de cada cuenta vivía en texto plano dentro de la
-- misma tabla "usuarios", que la app entera descarga al navegador con la
-- llave pública (anon) — cualquiera que abriera el CRM (aunque fuera solo la
-- pantalla de login, sin ni siquiera entrar) podía abrir F12 → Red y ver la
-- lista completa de usuarios y contraseñas del sistema, tal cual. Además esa
-- misma llave pública tiene permiso total de lectura/escritura sobre TODAS
-- las tablas (política "permitir todo" en schema.sql), así que alguien con
-- algo de conocimiento técnico podía copiar la llave del propio código de la
-- página y consultar/editar la base directo, sin pasar por el login del CRM.
--
-- Este paso 1 crea una tabla completamente aparte para las contraseñas
-- (ya como hash, nunca en texto plano) y la deja totalmente cerrada: ni
-- siquiera la llave pública puede leerla o escribirla — solo el servidor,
-- con una llave de servicio que nunca llega al navegador, puede tocarla
-- (ver src/lib/supabase-admin.ts y las rutas src/app/api/auth y
-- src/app/api/usuarios).
--
-- Después de correr este archivo hay que correr el script de migración
-- (migrar-contrasenas.js, aparte) para llenar esta tabla con el hash de
-- cada contraseña existente. Recién cuando ese script confirme que todas
-- las cuentas quedaron migradas, se corre asegurar_credenciales_paso2.sql
-- (borra la columna vieja en texto plano).
-- ============================================================================

create table usuario_credenciales (
  usuario_id uuid primary key references usuarios(id) on delete cascade,
  contrasena_hash text not null,
  actualizada_en timestamptz not null default now()
);

alter table usuario_credenciales enable row level security;

-- A propósito, ninguna política "permitir" — sin ninguna policy, RLS
-- deniega todo por defecto. Se refuerza además revocando cualquier permiso
-- de tabla a los roles públicos, por las dudas (defensa en profundidad: aun
-- si alguna vez alguien agrega sin querer una policy abierta, esto solo se
-- destraba si además se le da GRANT explícito a anon/authenticated, algo
-- que nunca debería hacerse acá).
revoke all on usuario_credenciales from anon, authenticated;

-- Importante: esta tabla NO se agrega a la publicación "supabase_realtime"
-- (a diferencia de "usuarios", que sí sigue transmitiendo sus cambios en
-- vivo) — así el hash de la contraseña nunca viaja por el canal en tiempo
-- real hacia el navegador de nadie, bajo ninguna circunstancia.

-- ============================================================================
-- De paso, se cierra también la escritura sobre "usuarios" en sí — hasta
-- ahora la llave pública podía crear, editar o eliminar cualquier cuenta
-- directo (política "permitir todo"), sin pasar por el login del CRM ni por
-- ninguna validación de rol. De acá en adelante crear/editar/eliminar una
-- cuenta pasa siempre por el servidor (src/app/api/usuarios), que sí valida
-- que quien lo pide sea Gerencial. La llave pública se queda solo con
-- lectura (nombre, cargo, rol — nada sensible, y varias pantallas del CRM
-- todavía necesitan poder mostrar esos datos).
-- ============================================================================
drop policy if exists "permitir todo (prototipo)" on usuarios;
create policy "lectura publica" on usuarios for select using (true);
