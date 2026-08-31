"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lock, Send, Sparkles, Settings2, Bot } from "lucide-react";
import { useApp } from "@/lib/app-context";
import { accesoA } from "@/lib/permissions";
import { Topbar } from "@/components/layout/Topbar";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { useEstrategiasChat, useConfigIA } from "@/lib/store";
import { sugerenciasPara, generarRespuesta } from "@/lib/estrategias";
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

  return <EstrategiasContenido negocioId={negocio.id} negocioNombre={negocio.nombre} />;
}

function EstrategiasContenido({ negocioId, negocioNombre }: { negocioId: NegocioId; negocioNombre: string }) {
  const { mensajes, enviar, listo } = useEstrategiasChat(negocioId);
  const { config, listo: listoConfig } = useConfigIA();
  const { clientesIndividuales, clientesCorporativos, seguimientos, campanas } = useData();
  const [texto, setTexto] = useState("");
  const [escribiendo, setEscribiendo] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [mensajes, escribiendo]);

  if (!listo || !listoConfig) return null;

  function enviarPrompt(valor: string) {
    const contenido = valor.trim();
    if (!contenido) return;
    enviar(contenido, "usuario");
    setTexto("");
    setEscribiendo(true);
    setTimeout(() => {
      const respuesta = generarRespuesta(
        contenido,
        { clientesIndividuales, clientesCorporativos, seguimientos },
        campanas,
        negocioId,
        negocioNombre
      );
      enviar(respuesta, "agente");
      setEscribiendo(false);
    }, 900);
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
                  {config ? `Conectado — ${config.proveedor === "openai" ? "OpenAI" : config.proveedor === "anthropic" ? "Anthropic" : "Otro proveedor"} (respuestas simuladas por ahora)` : "Respuestas simuladas con tus datos — sin API de IA conectada"}
                </p>
              </div>
            </div>
            <Link
              href="/configuracion"
              title="Conectar API de IA"
              className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--color-gris-medio)] hover:bg-[var(--color-crema)] hover:text-[var(--color-gris)] transition-colors"
            >
              <Settings2 size={16} />
            </Link>
          </div>

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

