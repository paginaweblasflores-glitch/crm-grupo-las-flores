import { createClient } from "@supabase/supabase-js";

// Cliente único de Supabase — la app le habla directo desde el navegador con
// la llave "anon" (no hay backend propio todavía). Las tablas tienen RLS
// abierto a propósito para este prototipo interno (ver base de datos/schema.sql).
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  throw new Error(
    "Faltan NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY — revisa .env.local"
  );
}

export const supabase = createClient(url, anonKey);
