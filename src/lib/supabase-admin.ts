// Cliente de Supabase con la llave de SERVICIO — a diferencia de supabase.ts
// (llave "anon", pensada para usarse desde el navegador), esta llave ignora
// por completo Row Level Security y puede leer/escribir cualquier tabla,
// incluida usuario_credenciales (que la llave pública no puede tocar).
//
// Por eso este archivo SOLO se debe importar desde código de servidor (las
// rutas bajo src/app/api/**/route.ts) — nunca desde un componente "use
// client" ni desde nada que se ejecute en el navegador. Al no llevar el
// prefijo NEXT_PUBLIC_, SUPABASE_SERVICE_ROLE_KEY ni siquiera está definida
// del lado del cliente, así que un import accidental fallaría en tiempo de
// ejecución (no en el build) — igual, hay que evitarlo a propósito.
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  throw new Error(
    "Faltan NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY — revisa .env.local " +
    "(la llave de servicio se saca de Supabase → Project Settings → API → \"service_role secret\")."
  );
}

export const supabaseAdmin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});
