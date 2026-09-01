-- ============================================================================
-- Clientes individuales: el celular deja de ser único por sí solo
-- ============================================================================
-- Hasta ahora el sistema bloqueaba registrar un cliente individual si su
-- celular ya pertenecía a otro cliente, sin importar nada más. Los datos
-- reales que se subieron (Restaurante Las Flores) mostraron casos genuinos
-- de dos personas DISTINTAS compartiendo un mismo celular — un teléfono
-- familiar o de la casa. La app ahora exige que coincidan celular Y fecha
-- de nacimiento a la vez para considerarlo "el mismo cliente" (ver
-- clientes/page.tsx y NuevoClienteForm.tsx) — eso sí identifica de verdad
-- a la misma persona, sin bloquear a un familiar que comparte el número.
--
-- Este script busca el nombre real de la restricción UNIQUE sobre esa
-- columna (por si no se llama exactamente como se esperaba) y la elimina.
-- ============================================================================
do $$
declare
  nombre_constraint text;
begin
  select tc.constraint_name into nombre_constraint
  from information_schema.table_constraints tc
  join information_schema.key_column_usage kcu
    on tc.constraint_name = kcu.constraint_name and tc.table_schema = kcu.table_schema
  where tc.table_schema = 'public'
    and tc.table_name = 'clientes_individuales'
    and tc.constraint_type = 'UNIQUE'
    and kcu.column_name = 'celular';

  if nombre_constraint is not null then
    execute format('alter table clientes_individuales drop constraint %I', nombre_constraint);
    raise notice 'Restricción % eliminada.', nombre_constraint;
  else
    raise notice 'No se encontró ninguna restricción UNIQUE sobre celular — puede que ya se haya quitado antes.';
  end if;
end $$;
