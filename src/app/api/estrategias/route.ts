// Route Handler — corre en el servidor, nunca en el navegador. Es el único
// lugar donde se lee GEMINI_API_KEY: si esa clave viviera en un componente
// "use client" o en localStorage, cualquiera que abriera las herramientas
// de desarrollador del navegador podría copiarla del tráfico de red o del
// código — acá el navegador solo le habla a ESTE endpoint (mismo origen,
// sin la clave), y este endpoint es el único que le habla a Gemini.
import { NextRequest, NextResponse } from "next/server";

// gemini-3.6-flash confirmado funcionando con la clave real (200 OK) al
// probarlo — gemini-3.7-flash devolvía 503 (saturado) y gemini-2.5-flash ya
// no acepta cuentas nuevas (404, Google recomienda 3.6-flash en su lugar).
const MODELO = "gemini-3.6-flash";

export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "GEMINI_API_KEY no está configurada en el servidor." }, { status: 500 });
  }

  const body = await req.json().catch(() => null);
  const prompt = typeof body?.prompt === "string" ? body.prompt : undefined;
  const contexto = typeof body?.contexto === "string" ? body.contexto : undefined;
  const negocioNombre = typeof body?.negocioNombre === "string" ? body.negocioNombre : undefined;

  if (!prompt) {
    return NextResponse.json({ error: "Falta 'prompt' en el cuerpo de la solicitud." }, { status: 400 });
  }

  const instrucciones =
    `Eres el asistente de Estrategias del CRM interno de Grupo Las Flores ` +
    `(Restaurante Las Flores, Hotel Umaru, Mamina Restobar), en Ayacucho, Perú. ` +
    `Hablas en español informal y cercano, directo al grano, con quien está a cargo de ${negocioNombre ?? "el negocio"}. ` +
    `Ayudas a decidir: campañas de WhatsApp, seguimiento de cumpleaños, y cómo conseguir o retener clientes. ` +
    `Usa SIEMPRE los datos reales de abajo — nunca inventes cifras ni asumas datos que no te dieron. ` +
    `Responde corto y concreto (máximo ~120 palabras), y termina con una sugerencia accionable. ` +
    `No uses títulos con # ni tablas — solo texto plano, con saltos de línea si hace falta.\n\n` +
    `Datos reales de hoy:\n${contexto ?? "(sin datos disponibles)"}`;

  try {
    const resp = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODELO}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: instrucciones }] },
          contents: [{ role: "user", parts: [{ text: prompt }] }],
        }),
      }
    );

    if (!resp.ok) {
      const errBody = await resp.text();
      console.error("Gemini API error:", resp.status, errBody);
      return NextResponse.json({ error: "Gemini no respondió correctamente." }, { status: 502 });
    }

    const data = await resp.json();
    const texto: string =
      data?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? "").join("") ?? "";

    if (!texto.trim()) {
      return NextResponse.json({ error: "Gemini no devolvió texto (puede haber bloqueado la respuesta)." }, { status: 502 });
    }

    return NextResponse.json({ texto: texto.trim() });
  } catch (e) {
    console.error("Error llamando a Gemini:", e);
    return NextResponse.json({ error: "Error de red al llamar a Gemini." }, { status: 502 });
  }
}
