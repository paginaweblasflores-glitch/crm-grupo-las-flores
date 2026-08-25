// Cliente de Supabase — PLACEHOLDER, sin conectar todavía.
//
// Tal como se acordó, la conexión real a Supabase se hace en la siguiente etapa,
// junto con Joel. Este archivo queda listo para cuando llegue ese momento:
//
//   1. npm install @supabase/supabase-js
//   2. Crear un archivo .env.local con:
//        NEXT_PUBLIC_SUPABASE_URL=...
//        NEXT_PUBLIC_SUPABASE_ANON_KEY=...
//   3. Descomentar el cliente de abajo.
//   4. Reemplazar, uno por uno, los archivos de src/lib/mock/*.ts por funciones
//      que consulten las tablas reales — las páginas y componentes no cambian,
//      porque ya consumen esas funciones como si fueran la fuente de verdad.
//
// import { createClient } from "@supabase/supabase-js";
//
// export const supabase = createClient(
//   process.env.NEXT_PUBLIC_SUPABASE_URL!,
//   process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
// );

export const SUPABASE_CONECTADO = false;
