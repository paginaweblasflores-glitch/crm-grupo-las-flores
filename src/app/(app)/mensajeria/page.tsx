"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Send, Lock, MessageCircle, Bot, User, CalendarClock, MessagesSquare } from "lucide-react";
import { useApp } from "@/lib/app-context";
import { accesoA } from "@/lib/permissions";
import { Topbar } from "@/components/layout/Topbar";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge, type Tono } from "@/components/ui/Badge";
import { Table, Thead, Th, Tr, Td } from "@/components/ui/Table";
import { EmptyState } from "@/components/ui/EmptyState";
import { SearchInput } from "@/components/ui/SearchInput";
import { clientesIndividualesPorNegocio } from "@/lib/mock/clientes";
import { seguimientosPorNegocio } from "@/lib/mock/seguimiento";
import { plantillaCumpleanos, semillaConversacion } from "@/lib/mensajes";
import { useChat, useModoAutomatico, useClientesCreados } from "@/lib/store";
import { seguimientosConNuevos } from "@/lib/seguimiento-helpers";
import { SeguimientoCumple } from "@/lib/types";

const RESPUESTAS_AUTO = [
  "¡Hola! Muchas gracias por el saludo 🌸",
  "Qué lindo detalle, gracias. ¿Tienen mesa disponible este fin de semana?",
  "Justo estaba pensando en ir a celebrar ahí, gracias por escribir.",
  "Genial, ¿el descuento aplica si somos un grupo grande?",
];

function estadoSeguimiento(s: SeguimientoCumple): { texto: string; tono: Tono } {
  if (!s.saludoEnviado) return { texto: "Programado", tono: "gris" };
  if (s.reservacion === "si") return { texto: "Reserva confirmada", tono: "verde" };
  if (s.respuesta === "si") return { texto: "Respondió", tono: "azul" };
  if (s.respuesta === "no") return { texto: "Respondió: no por ahora", tono: "naranja" };
  return { texto: "Enviado, sin respuesta", tono: "gris" };
}

export default function MensajeriaPage() {
  return (
    <Suspense fallback={null}>
      <MensajeriaInner />
    </Suspense>
  );
}

function MensajeriaInner() {
  const { usuario, negocio } = useApp();
  const router = useRouter();
  const searchParams = useSearchParams();
  const clienteInicial = searchParams.get("cliente");
  const [vista, setVista] = useState<"chats" | "programados">("chats");
  const [busqueda, setBusqueda] = useState("");
  const [clienteId, setClienteId] = useState<string | null>(clienteInicial);
  const { items: creados } = useClientesCreados();

  const clientesCreadosNegocio = useMemo(
    () => (usuario ? creados.filter((c) => c.negocioId === negocio.id) : []),
    [creados, negocio.id, usuario]
  );
  const { clientes, seguimientos, seguimientoPorCliente, filtrados } = useMemo(() => {
    if (!usuario) {
      return {
        clientes: [], seguimientos: [],
        seguimientoPorCliente: new Map<string, SeguimientoCumple>(), filtrados: [],
      };
    }
    const clientes = [...clientesIndividualesPorNegocio(negocio.id), ...clientesCreadosNegocio];
    const seguimientos = seguimientosConNuevos(seguimientosPorNegocio(negocio.id), clientesCreadosNegocio, negocio.id);
    const seguimientoPorCliente = new Map(seguimientos.map((s) => [s.clienteId, s]));
    const clientesOrdenados = [...clientes].sort((a, b) => {
      const sa = seguimientoPorCliente.has(a.id) ? 1 : 0;
      const sb = seguimientoPorCliente.has(b.id) ? 1 : 0;
      return sb - sa;
    });
    const filtrados = clientesOrdenados.filter((c) =>
      `${c.nombres} ${c.apellidos} ${c.celular}`.toLowerCase().includes(busqueda.toLowerCase())
    );
    return { clientes, seguimientos, seguimientoPorCliente, filtrados };
  }, [negocio.id, clientesCreadosNegocio, busqueda, usuario]);

  // "Todas las sucursales" no es un negocio real — se redirige a Panel Principal.
  const fueraDeAlcance = negocio.id === "todas";

  useEffect(() => {
    if (fueraDeAlcance) router.replace("/dashboard");
  }, [fueraDeAlcance, router]);

  if (!usuario || fueraDeAlcance) return null;
  const nivel = accesoA(usuario.rolTipo, "mensajeria");

  if (nivel === "no") {
    return (
      <>
        <Topbar titulo="Mensajería" descripcion={negocio.nombre} />
        <main className="flex-1 p-8">
          <Card>
            <EmptyState
              icon={<Lock size={22} />}
              title="Este módulo no está disponible para Dirección"
              description="Responder mensajes es trabajo operativo de Ventas — Dirección solo revisa los números que salen de esas conversaciones."
            />
          </Card>
        </main>
      </>
    );
  }

  const clienteActivo = clientes.find((c) => c.id === clienteId) ?? filtrados[0] ?? null;
  const seguimientoActivo = clienteActivo ? seguimientoPorCliente.get(clienteActivo.id) : undefined;

  return (
    <>
      <Topbar titulo="Mensajería" descripcion={`${negocio.nombre} · chat simulado y mensajes programados de cumpleaños`} />
      <main className="flex-1 p-8 animate-fade-in space-y-5">
        <div className="flex bg-white rounded-xl border border-[var(--color-gris-claro)]/50 p-1 w-fit">
          <button
            onClick={() => setVista("chats")}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${vista === "chats" ? "bg-[var(--color-terracota)] text-white" : "text-[var(--color-gris-medio)]"}`}
          >
            <MessagesSquare size={14} /> Conversaciones
          </button>
          <button
            onClick={() => setVista("programados")}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${vista === "programados" ? "bg-[var(--color-terracota)] text-white" : "text-[var(--color-gris-medio)]"}`}
          >
            <CalendarClock size={14} /> Mensajes programados ({seguimientos.length})
          </button>
        </div>

        {vista === "programados" ? (
          <MensajesProgramados seguimientos={seguimientos} negocioNombre={negocio.nombre} onVerChat={(id) => { setClienteId(id); setVista("chats"); }} />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-5 h-[calc(100vh-15rem)]">
            <Card padding="p-0" className="flex flex-col overflow-hidden">
              <div className="p-3 border-b border-[var(--color-gris-claro)]/30">
                <SearchInput value={busqueda} onChange={setBusqueda} placeholder="Buscar cliente…" />
              </div>
              <div className="flex-1 overflow-y-auto">
                {filtrados.map((c) => {
                  const seg = seguimientoPorCliente.get(c.id);
                  const estado = seg ? estadoSeguimiento(seg) : null;
                  return (
                    <button
                      key={c.id}
                      onClick={() => setClienteId(c.id)}
                      className={`w-full text-left px-4 py-3 border-b border-[var(--color-gris-claro)]/20 hover:bg-[var(--color-crema)] transition-colors ${
                        clienteActivo?.id === c.id ? "bg-[var(--color-crema)]" : ""
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium text-[var(--color-gris)] truncate">{c.nombres} {c.apellidos}</p>
                        {estado && <Badge tono={estado.tono}>{estado.texto}</Badge>}
                      </div>
                      <p className="text-xs text-[var(--color-gris-medio)]">{c.celular}</p>
                    </button>
                  );
                })}
              </div>
            </Card>

            {clienteActivo ? (
              <ChatPanel
                clienteId={clienteActivo.id}
                clienteNombre={`${clienteActivo.nombres} ${clienteActivo.apellidos}`}
                seguimiento={seguimientoActivo}
                negocioNombre={negocio.nombre}
              />
            ) : (
              <Card><EmptyState icon={<MessageCircle size={22} />} title="Sin clientes" description="No hay clientes para chatear todavía." /></Card>
            )}
          </div>
        )}
      </main>
    </>
  );
}

function MensajesProgramados({
  seguimientos, negocioNombre, onVerChat,
}: {
  seguimientos: SeguimientoCumple[]; negocioNombre: string; onVerChat: (clienteId: string) => void;
}) {
  return (
    <Card padding="p-0 pt-5">
      <div className="px-5">
        <CardHeader
          title="Mensajes programados de cumpleaños"
          subtitle="Mismo mensaje base, personalizado con el nombre de cada cliente — así se vería con la plantilla aprobada de la API de WhatsApp"
        />
      </div>
      <Table>
        <Thead>
          <Th>Cliente</Th><Th>Fecha de cumpleaños</Th><Th>Mensaje</Th><Th>Estado</Th><Th>{" "}</Th>
        </Thead>
        <tbody>
          {seguimientos.map((s) => {
            const estado = estadoSeguimiento(s);
            const mensaje = plantillaCumpleanos(s.nombre.split(" ")[0], negocioNombre);
            return (
              <Tr key={s.id}>
                <Td className="font-medium">{s.nombre}</Td>
                <Td>{new Date(s.fechaCumple).toLocaleDateString("es-PE", { day: "2-digit", month: "long" })}</Td>
                <Td className="max-w-sm">
                  <span className="text-xs text-[var(--color-gris-medio)] line-clamp-2">{mensaje}</span>
                </Td>
                <Td><Badge tono={estado.tono}>{estado.texto}</Badge></Td>
                <Td>
                  <button onClick={() => onVerChat(s.clienteId)} className="text-xs font-semibold text-[var(--color-terracota)] hover:underline">
                    Ver chat
                  </button>
                </Td>
              </Tr>
            );
          })}
        </tbody>
      </Table>
      {seguimientos.length === 0 && (
        <p className="text-center text-sm text-[var(--color-gris-medio)] py-10">Nadie cumple años este mes todavía.</p>
      )}
    </Card>
  );
}

function ChatPanel({
  clienteId, clienteNombre, seguimiento, negocioNombre,
}: {
  clienteId: string; clienteNombre: string; seguimiento?: SeguimientoCumple; negocioNombre: string;
}) {
  const semilla = useMemo(
    () => (seguimiento ? semillaConversacion(seguimiento, negocioNombre) : []),
    [seguimiento, negocioNombre]
  );
  const { mensajes, enviar, listo } = useChat(clienteId, semilla);
  const { modo, setModo, listo: listoModo } = useModoAutomatico();
  const [texto, setTexto] = useState("");

  if (!listo || !listoModo) return null;

  function enviarMensaje() {
    if (!texto.trim()) return;
    enviar(texto.trim(), "negocio");
    setTexto("");
    if (modo) {
      setTimeout(() => {
        const respuesta = RESPUESTAS_AUTO[Math.floor(Math.random() * RESPUESTAS_AUTO.length)];
        enviar(respuesta, "cliente");
      }, 1200);
    }
  }

  return (
    <Card padding="p-0" className="flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--color-gris-claro)]/30">
        <div>
          <p className="text-sm font-semibold text-[var(--color-gris)]">{clienteNombre}</p>
          <p className="text-[11px] text-[var(--color-gris-medio)]">Conversación simulada — no sale de WhatsApp real</p>
        </div>
        <button
          onClick={() => setModo(!modo)}
          className={`flex items-center gap-1.5 text-xs font-semibold rounded-lg px-3 py-1.5 transition-colors ${
            modo ? "bg-[var(--color-verde)] text-white" : "bg-[var(--color-crema-oscuro)] text-[var(--color-gris-medio)]"
          }`}
        >
          {modo ? <Bot size={13} /> : <User size={13} />}
          {modo ? "Automático (API)" : "Manual"}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-3 bg-[var(--color-crema)]/40">
        {mensajes.length === 0 && (
          <p className="text-center text-xs text-[var(--color-gris-medio)] py-10">
            Todavía no hay mensajes con este cliente. Escribe el primero abajo.
          </p>
        )}
        {mensajes.map((m) => (
          <div key={m.id} className={`flex ${m.de === "negocio" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[70%] rounded-2xl px-4 py-2.5 text-sm ${
                m.de === "negocio"
                  ? "bg-[var(--color-terracota)] text-white rounded-br-sm"
                  : "bg-white text-[var(--color-gris)] rounded-bl-sm border border-[var(--color-gris-claro)]/40"
              }`}
            >
              {m.texto}
              <span className={`block text-[10px] mt-1 ${m.de === "negocio" ? "text-white/70" : "text-[var(--color-gris-medio)]"}`}>
                {formatearFechaMensaje(m.hora)}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 p-3 border-t border-[var(--color-gris-claro)]/30">
        <input
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && enviarMensaje()}
          placeholder="Escribe un mensaje…"
          className="flex-1 px-3.5 py-2.5 rounded-xl border border-[var(--color-gris-claro)]/50 text-sm focus:outline-none focus:border-[var(--color-terracota)] transition-colors"
        />
        <button
          onClick={enviarMensaje}
          className="w-10 h-10 rounded-xl bg-[var(--color-terracota)] text-white flex items-center justify-center hover:opacity-90 transition-opacity shrink-0"
        >
          <Send size={16} />
        </button>
      </div>
    </Card>
  );
}

function formatearFechaMensaje(hora: string): string {
  const fecha = new Date(hora);
  const hoy = new Date();
  const esHoy = fecha.toDateString() === hoy.toDateString();
  if (esHoy) return fecha.toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" });
  return fecha.toLocaleDateString("es-PE", { day: "2-digit", month: "short" }) + " · " +
    fecha.toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" });
}
