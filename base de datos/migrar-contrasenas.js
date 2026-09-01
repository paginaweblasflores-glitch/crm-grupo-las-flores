// Migración única de contraseñas: de la columna vieja "usuarios.contrasena"
// (texto plano) a la tabla nueva "usuario_credenciales" (hash con bcrypt).
//
// Cómo correrlo (desde la carpeta "crm corporativo"):
//   1. Correr primero "base de datos/asegurar_credenciales_paso1.sql" en el
//      SQL Editor de Supabase.
//   2. Tener SUPABASE_SERVICE_ROLE_KEY en .env.local (ver README de esa
//      variable en ese mismo archivo).
//   3. node --env-file=.env.local "base de datos/migrar-contrasenas.js"
//   4. Si la salida dice "Listo — X de X cuentas migradas", recién ahí
//      correr "base de datos/asegurar_credenciales_paso2.sql".
//
// Es seguro volver a correrlo: las cuentas que ya tienen su hash en
// usuario_credenciales se saltan (no se vuelven a hashear).
const { createClient } = require("@supabase/supabase-js");
const bcrypt = require("bcryptjs");

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error(
    "Faltan NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY.\n" +
    "Corré este script con: node --env-file=.env.local \"base de datos/migrar-contrasenas.js\""
  );
  process.exit(1);
}

const admin = createClient(url, serviceKey, { auth: { persistSession: false } });

async function main() {
  const { data: usuarios, error } = await admin.from("usuarios").select("id, usuario, contrasena");
  if (error) {
    console.error("No se pudo leer 'usuarios':", error.message);
    console.error("¿Ya corriste asegurar_credenciales_paso1.sql? Esta lectura necesita que la columna 'contrasena' todavía exista (paso 2 la borra).");
    process.exit(1);
  }

  const { data: yaMigradas } = await admin.from("usuario_credenciales").select("usuario_id");
  const idsYaMigrados = new Set((yaMigradas ?? []).map((r) => r.usuario_id));

  let migradas = 0;
  let saltadas = 0;
  const fallidas = [];

  for (const u of usuarios) {
    if (idsYaMigrados.has(u.id)) {
      saltadas++;
      continue;
    }
    if (!u.contrasena) {
      fallidas.push(`${u.usuario} (id ${u.id}) — no tiene contraseña en texto plano, revisar a mano.`);
      continue;
    }
    const hash = await bcrypt.hash(u.contrasena, 10);
    const { error: errInsert } = await admin
      .from("usuario_credenciales")
      .insert({ usuario_id: u.id, contrasena_hash: hash });
    if (errInsert) {
      fallidas.push(`${u.usuario} (id ${u.id}) — ${errInsert.message}`);
      continue;
    }
    migradas++;
    console.log(`  OK  ${u.usuario}`);
  }

  console.log("");
  console.log(`Migradas ahora: ${migradas}`);
  console.log(`Ya estaban migradas (saltadas): ${saltadas}`);
  if (fallidas.length > 0) {
    console.log(`Fallidas: ${fallidas.length}`);
    fallidas.forEach((f) => console.log("  FALLO " + f));
    console.log("\nNo corras el paso 2 todavía — revisa las cuentas de arriba primero.");
    process.exit(1);
  }

  console.log(`\nListo — ${usuarios.length} de ${usuarios.length} cuentas migradas. Ya puedes correr asegurar_credenciales_paso2.sql.`);
}

main();
