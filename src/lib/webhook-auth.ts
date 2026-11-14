// Autenticación compartida de los webhooks que reciben datos de otros
// sistemas (web pública, sorteos): header "Authorization: Bearer <secreto>",
// donde el secreto vive en una variable de entorno PROPIA de cada integración
// (WEBSITE_WEBHOOK_SECRET, SORTEO_WEBHOOK_SECRET) — un secreto por sistema,
// así se puede rotar o revocar uno sin romper al otro.
//
// Solo se importa desde rutas de servidor (src/app/api/**/route.ts).
import { createHash, timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

// Devuelve null si la petición está autorizada, o la respuesta de error que
// hay que devolver tal cual (500 si el servidor no tiene el secreto
// configurado, 401 si el header no coincide).
//
// La comparación es en tiempo constante (hash SHA-256 de ambos lados, que
// además iguala el largo): un `===` directo se demora un poquito más cuanto
// más caracteres iniciales aciertas, y eso en teoría permite ir adivinando el
// secreto de a un carácter midiendo tiempos de respuesta.
export function verificarBearer(req: NextRequest, variableEntorno: string): NextResponse | null {
  const secreto = process.env[variableEntorno];
  if (!secreto) {
    // Un secreto sin configurar NUNCA debe comportarse como "sin
    // autenticación" — falla cerrado. El detalle va al log, no a quien llama.
    console.error(`[webhook] Falta la variable de entorno ${variableEntorno} en este deploy.`);
    return NextResponse.json({ ok: false, error: "Servidor mal configurado." }, { status: 500 });
  }
  const recibido = createHash("sha256").update(req.headers.get("authorization") ?? "").digest();
  const esperado = createHash("sha256").update(`Bearer ${secreto}`).digest();
  if (!timingSafeEqual(recibido, esperado)) {
    return NextResponse.json({ ok: false, error: "No autorizado." }, { status: 401 });
  }
  return null;
}
