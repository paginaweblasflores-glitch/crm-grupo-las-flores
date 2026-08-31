"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lock, Send, Sparkles, Settings2, Bot, Trash2 } from "lucide-react";
import { useApp } from "@/lib/app-context";
import { accesoA } from "@/lib/permissions";
import { Topbar } from "@/components/layout/Topbar";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { useEstrategiasChat, useConfigIA } from "@/lib/store";
import { sugerenciasPara, generarRespuesta, construirContextoDatos } from "@/lib/estrategias";
import { NegocioId } from "@/lib/types";
import { useData } from "@/lib/data-context";

export default function EstrategiasPage() {
  const { usuario, negocio } = useApp();
  const router = useRouter();

  // "Todas las sucursales" no es un negocio real — Estrategias necesita uno
  // específico para dar respuestas con datos reales, se redirige a Panel Principal.
  const fueraDeAlcance = negocio.id === "todas";

  useEffect(() => {
    if (fueraDeAlcance) router.replace("/dashboard");
  }, [fueraDeAlcance, router]);

  if (!usuario || fueraDeAlcance) return null;
  const nivel = accesoA(usuario.rolTipo, "estrategias");

  if (nivel === "no") {
    return (
      <>
        <Topbar titulo="Estrategias" descripcion={negocio.nombre} />
        <main className="flex-1 p-8">
          <Card>
            <EmptyState
              icon={<Lock size={22} />}
              title="Este módulo no está disponible para tu rol"
              description="Estrategias es una herramienta de decisión para Gerencial."
            />
          </Card>
        </main>
      </>
    );
  }

  return <EstrategiasContenido negocioId={negocio.id} negocioNombre={negocio.nombre} nombreUsuario={usuario.nombreReal ?? usuario.nombre} />;
}

function EstrategiasContenido({
  negocioId, negocioNombre, nombreUsuario,
}: { negocioId: NegocioId; negocioNombre: string; nombreUsuario: string }) {
  const { mensajes, enviar, limpiar, listo } = useEstrategiasChat(negocioId);
  const { config: configIA, listo: listoConfigIA } = useConfigIA();
  const { clientesIndividuales, clientesCorporativos, seguimientos, campanas, festividades, usuarios } = useData();
  const [texto, setTexto] = useState("");
  const [escribiendo, setEscribiendo] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [mensajes, escribiendo]);

  if (!listo || !listoConfigIA) return null;

  async function enviarPrompt(valor: string) {
    const contenido = valor.trim();
    if (!contenido) return;
    // Se calcula ANTES de agregar el mensaje del usuario a la lista — así el
    // saludo por nombre/hora solo se dispara la primera vez, no en cada mensaje.
    const esPrimerMensaje = mensajes.length === 0;
    enviar(contenido, "usuario");
    setTexto("");
    setEscribiendo(true);
    const datos = { clientesIndividuales, clientesCorporativos, seguimientos };
    // Se intenta con Gemini de verdad (vía nuestro propio endpoint, para no
    // exponer la clave al navegador) y, si falla por cualquier motivo (sin
    // clave configurada, sin internet, límite de uso alcanzado), cae de
    // vuelta a la lógica local con los mismos datos reales — el chat nunca
    // se queda sin responder.
    try {
      const contexto = construirContextoDatos(datos, campanas, festividades, usuarios, negocioId, negocioNombre);
      const resp = await fetch("/api/estrategias", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: contenido, contexto, negocioNombre, nombreUsuario, esPrimerMensaje,
          apiKeyManual: configIA?.apiKey,
        }),
      });
      if (!resp.ok) throw new Error("Respuesta no exitosa del servidor");
      const data = await resp.json();
      if (!data.texto) throw new Error("Sin texto en la respuesta");
      enviar(data.texto as string, "agente");
    } catch {
      const respuesta = generarRespuesta(contenido, datos, campanas, negocioId, negocioNombre);
      enviar(respuesta, "agente");
    } finally {
      setEscribiendo(false);
    }
  }

  return (
    <>
      <Topbar titulo="Estrategias" descripcion={`${negocioNombre} · asistente para armar campañas e ideas a partir de tus datos`} />
      <main className="flex-1 p-8 animate-fade-in">
        <Card padding="p-0" className="flex flex-col overflow-hidden h-[calc(100vh-11rem)]">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--color-gris-claro)]/30">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[var(--color-terracota)] text-white flex items-center justify-center shrink-0">
                <Sparkles size={15} />
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--color-gris)]">Asistente de Estrategias</p>
                <p className="text-[11px] text-[var(--color-gris-medio)]">
                  Conectado a Gemini — responde con IA real usando tus datos de {negocioNombre}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {mensajes.length > 0 && (
                <button
                  onClick={() => { if (confirm("¿Borrar toda la conversación de Estrategias con este negocio?")) limpiar(); }}
                  title="Limpiar chat"
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--color-gris-medio)] hover:bg-[var(--color-crema)] hover:text-[var(--color-rojo)] transition-colors"
                >
                  <Trash2 size={15} />
                </button>
              )}
              <Link
                href="/configuracion"
                title="Conectar API de IA"
                className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--color-gris-medio)] hover:bg-[var(--color-crema)] hover:text-[var(--color-gris)] transition-colors"
              >
                <Settings2 size={16} />
              </Link>
            </div>
          </div>

          {mensajes.length === 0 && (
            <div className="px-5 pt-3 flex gap-1.5 flex-wrap">
              {sugerenciasPara().map((s) => (
                <button
                  key={s}
                  onClick={() => enviarPrompt(s)}
                  className="text-xs font-medium bg-[var(--color-crema)] hover:bg-[var(--color-crema-oscuro)] text-[var(--color-gris)] rounded-full px-3 py-1.5 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-3 bg-[var(--color-crema)]/40">
            {mensajes.length === 0 && (
              <p className="text-center text-xs text-[var(--color-gris-medio)] py-10 max-w-sm mx-auto">
                Escribe qué necesitas decidir (una campaña, una promoción, cómo van los cumpleaños…) o elige una de las
                sugerencias de arriba. El agente responde usando los datos reales de {negocioNombre}.
              </p>
            )}
            {mensajes.map((m) => (
              <div key={m.id} className={`flex ${m.de === "usuario" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-line ${
                    m.de === "usuario"
                      ? "bg-[var(--color-terracota)] text-white rounded-br-sm"
                      : "bg-white text-[var(--color-gris)] rounded-bl-sm border border-[var(--color-gris-claro)]/40"
                  }`}
                >
                  {m.texto}
                </div>
              </div>
            ))}
            {escribiendo && (
              <div className="flex justify-start">
                <div className="bg-white border border-[var(--color-gris-claro)]/40 rounded-2xl rounded-bl-sm px-4 py-2.5 text-xs text-[var(--color-gris-medio)] flex items-center gap-1.5">
                  <Bot size={13} /> Pensando…
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 p-3 border-t border-[var(--color-gris-claro)]/30">
            <input
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && enviarPrompt(texto)}
              placeholder="Escribe tu pregunta o pídele que arme una campaña…"
              className="flex-1 px-3.5 py-2.5 rounded-xl border border-[var(--color-gris-claro)]/50 text-sm focus:outline-none focus:border-[var(--color-terracota)] transition-colors"
            />
            <button
              onClick={() => enviarPrompt(texto)}
              className="w-10 h-10 rounded-xl bg-[var(--color-terracota)] text-white flex items-center justify-center hover:opacity-90 transition-opacity shrink-0"
            >
              <Send size={16} />
            </button>
          </div>
        </Card>
      </main>
    </>
  );
}

