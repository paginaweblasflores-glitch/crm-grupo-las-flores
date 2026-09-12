"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Send, Lock, MessageCircle, CalendarClock, MessagesSquare } from "lucide-react";
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
import { plantillaCumpleanos } from "@/lib/mensajes";
import { useData } from "@/lib/data-context";
import { seguimientosConNuevos } from "@/lib/seguimiento-helpers";
import { Mensaje, NegocioId, SeguimientoCumple } from "@/lib/types";

// Mismo criterio simple que la tabla de Cumpleaños: Estado lo pone el
// sistema solo (Enviado, en cuanto se manda el saludo), Reservación la marca
// Ventas a mano después de hablar con el cliente. Ya no hay "Visto" ni
// "Respondió/no respondió" — eran demasiado detalle y se prestaban a
// confusión con la respuesta real del cliente en el chat.
function estadoSeguimiento(s: SeguimientoCumple): { texto: string; tono: Tono } {
  if (!s.saludoEnviado) return { texto: "Programado", tono: "gris" };
  if (s.reservacion === "si") return { texto: "Reserva confirmada", tono: "verde" };
  if (s.reservacion === "no") return { texto: "No volvió", tono: "naranja" };
  return { texto: "Enviado", tono: "azul" };
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
  const { clientesIndividuales, seguimientos: seguimientosReales, mensajes: todosLosMensajes, crearMensaje } = useData();

  const { clientes, seguimientos, filtrados, mensajesPorCliente } = useMemo(() => {
    if (!usuario) {
      return {
        clientes: [], seguimientos: [] as SeguimientoCumple[],
        filtrados: [], mensajesPorCliente: new Map<string, Mensaje[]>(),
      };
    }
    const clientes = clientesIndividualesPorNegocio(clientesIndividuales, negocio.id);
    // Cubre el caso de un cliente cuyo cumpleaños cae este mes pero todavía
    // no tiene una fila de seguimiento propia (por ejemplo, recién
    // registrado) — arma una de vista, sin guardarla, hasta que se envíe el
    // saludo de verdad (ver AutoEnvioCumpleanos en cumpleanos/page.tsx).
    const seguimientos = seguimientosConNuevos(seguimientosPorNegocio(seguimientosReales, negocio.id), clientes, negocio.id);

    // Mensajes reales de este negocio, agrupados por cliente — ya vienen
    // ordenados ascendente (más viejo primero, ver cargarTodo en db.ts), así
    // que solo hace falta repartirlos, no reordenarlos. Esto es O(mensajes
    // reales que existen), no un cruce cliente×campaña como antes — con
    // miles de clientes y ninguna campaña de por medio, es instantáneo (el
    // cruce viejo fue justo lo que puso lento el módulo con datos reales,
    // ver commit de esta migración).
    const mensajesPorCliente = new Map<string, Mensaje[]>();
    todosLosMensajes.forEach((m) => {
      if (m.negocioId !== negocio.id) return;
      const lista = mensajesPorCliente.get(m.clienteId);
      if (lista) lista.push(m);
      else mensajesPorCliente.set(m.clienteId, [m]);
    });

    // Lista de conversaciones, no la agenda completa de clientes — solo
    // entra quien ya tiene al menos un mensaje real. Un cliente recién
    // registrado, al que nadie le escribió nada todavía, no aparece acá
    // hasta que alguien le mande el primer mensaje (desde su Ficha 360° o
    // desde Cumpleaños/Campañas).
    const ultimaDe = (id: string) => {
      const lista = mensajesPorCliente.get(id);
      return lista ? lista[lista.length - 1].hora : "";
    };
    const clientesConConversacion = clientes.filter((c) => mensajesPorCliente.has(c.id));
    // Como WhatsApp/Telegram: la conversación con actividad más reciente va
    // primero.
    const clientesOrdenados = [...clientesConConversacion].sort((a, b) => {
      const ua = ultimaDe(a.id);
      const ub = ultimaDe(b.id);
      if (ua !== ub) return ub.localeCompare(ua);
      return `${a.nombres} ${a.apellidos}`.localeCompare(`${b.nombres} ${b.apellidos}`);
    });
    const filtrados = clientesOrdenados.filter((c) =>
      `${c.nombres} ${c.apellidos} ${c.celular}`.toLowerCase().includes(busqueda.toLowerCase())
    );
    return { clientes, seguimientos, filtrados, mensajesPorCliente };
  }, [negocio.id, busqueda, usuario, clientesIndividuales, seguimientosReales, todosLosMensajes]);

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
  // "Mensajes programados" es la cola de lo que TODAVÍA falta enviar — en
  // cuanto se manda (AutoEnvioCumpleanos lo marca saludoEnviado=true), sale
  // de esta lista sola. Su historial se sigue viendo en la tabla
  // "Seguimiento" del módulo Cumpleaños, no acá.
  const seguimientosPendientes = seguimientos.filter((s) => !s.saludoEnviado);

  return (
    <>
      <Topbar titulo="Mensajería" descripcion={`${negocio.nombre} · conversaciones y mensajes programados de cumpleaños`} />
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
            <CalendarClock size={14} /> Mensajes programados ({seguimientosPendientes.length})
          </button>
        </div>

        {vista === "programados" ? (
          <MensajesProgramados seguimientos={seguimientosPendientes} negocioNombre={negocio.nombre} onVerChat={(id) => { setClienteId(id); setVista("chats"); }} />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-5 h-[calc(100vh-15rem)]">
            <Card padding="p-0" className="flex flex-col overflow-hidden">
              <div className="p-3 border-b border-[var(--color-gris-claro)]/30">
                <SearchInput value={busqueda} onChange={setBusqueda} placeholder="Buscar cliente…" />
              </div>
              <div className="flex-1 overflow-y-auto">
                {filtrados.map((c) => {
                  // Sin etiqueta de Estado/Reservación acá — esas dos son
                  // para la estadística (tabla de Cumpleaños), no para la
                  // lista de chats; mostrarlas ahí solo generaba ruido.
                  const lista = mensajesPorCliente.get(c.id);
                  const hora = lista ? lista[lista.length - 1].hora : undefined;
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
                        {hora && <span className="text-[10px] text-[var(--color-gris-medio)] shrink-0">{formatearFechaLista(hora)}</span>}
                      </div>
                      <p className="text-xs text-[var(--color-gris-medio)] truncate mt-0.5">{c.celular}</p>
                    </button>
                  );
                })}
              </div>
            </Card>

            {clienteActivo ? (
              <ChatPanel
                clienteId={clienteActivo.id}
                clienteNombre={`${clienteActivo.nombres} ${clienteActivo.apellidos}`}
                negocioId={negocio.id}
                mensajes={mensajesPorCliente.get(clienteActivo.id) ?? []}
                crearMensaje={crearMensaje}
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
          <Th>Cliente</Th><Th>Fecha de cumpleaños</Th><Th>Mensaje</Th><Th>Estado</Th><Th>{" "}</Th>
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
        <p className="text-center text-sm text-[var(--color-gris-medio)] py-10">
          No hay saludos pendientes de enviar — nadie cumple años este mes todavía, o ya se les mandó a todos.
        </p>
      )}
    </Card>
  );
}

function ChatPanel({
  clienteId, clienteNombre, negocioId, mensajes, crearMensaje,
}: {
  clienteId: string;
  clienteNombre: string;
  negocioId: NegocioId;
  mensajes: Mensaje[];
  crearMensaje: (m: {
    negocioId: NegocioId; clienteId: string; clienteTipo: "individual" | "corporativo";
    de: "negocio" | "cliente"; texto: string; origen: "cumpleanos" | "campana" | "manual"; origenId?: string; hora?: string;
  }) => Promise<void>;
}) {
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function enviarMensaje() {
    const valor = texto.trim();
    if (!valor || enviando) return;
    setEnviando(true);
    setTexto("");
    try {
      // Esta página solo maneja clientes individuales (ver
      // clientesIndividualesPorNegocio arriba), así que clienteTipo siempre
      // es "individual" acá.
      await crearMensaje({ negocioId, clienteId, clienteTipo: "individual", de: "negocio", texto: valor, origen: "manual" });
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Card padding="p-0" className="flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--color-gris-claro)]/30">
        <div>
          <p className="text-sm font-semibold text-[var(--color-gris)]">{clienteNombre}</p>
          <p className="text-[11px] text-[var(--color-gris-medio)]">Conversación simulada — no sale de WhatsApp real</p>
        </div>
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
          disabled={enviando}
          className="flex-1 px-3.5 py-2.5 rounded-xl border border-[var(--color-gris-claro)]/50 text-sm focus:outline-none focus:border-[var(--color-terracota)] transition-colors disabled:opacity-60"
        />
        <button
          onClick={enviarMensaje}
          disabled={enviando}
          className="w-10 h-10 rounded-xl bg-[var(--color-terracota)] text-white flex items-center justify-center hover:opacity-90 transition-opacity shrink-0 disabled:opacity-60"
        >
          <Send size={16} />
        </button>
      </div>
    </Card>
  );
}

// Diferencia en días de CALENDARIO (no en bloques de 24 horas) — "ayer"
// significa el día calendario anterior, no "entre 24 y 48 horas atrás". Esto
// se recalcula cada vez que se abre la página contra la fecha real de hoy,
// así que un mensaje de hoy pasa a decir "Ayer" solo mañana, sin que nadie
// tenga que tocar nada.
function diasDeDiferencia(fecha: Date, ahora: Date): number {
  const inicioFecha = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
  const inicioAhora = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
  return Math.round((inicioAhora.getTime() - inicioFecha.getTime()) / 86400000);
}

// Para la lista de conversaciones (como WhatsApp/Telegram): hoy solo la
// hora, ayer dice "Ayer", esta semana el día ("Lunes"), más atrás la fecha
// completa — nunca dos formatos a la vez, igual que en la app real.
function formatearFechaLista(hora: string): string {
  const fecha = new Date(hora);
  const dias = diasDeDiferencia(fecha, new Date());
  if (dias <= 0) return fecha.toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" });
  if (dias === 1) return "Ayer";
  if (dias < 7) {
    const dia = fecha.toLocaleDateString("es-PE", { weekday: "long" });
    return dia.charAt(0).toUpperCase() + dia.slice(1);
  }
  return fecha.toLocaleDateString("es-PE", { day: "2-digit", month: "2-digit", year: "numeric" });
}

// Para cada mensaje dentro de una conversación abierta: siempre incluye la
// hora (ahí sí hace falta saber a qué hora, no solo qué día), con la misma
// escala relativa que la lista.
function formatearFechaMensaje(hora: string): string {
  const fecha = new Date(hora);
  const dias = diasDeDiferencia(fecha, new Date());
  const horaTexto = fecha.toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" });
  if (dias <= 0) return horaTexto;
  if (dias === 1) return `Ayer, ${horaTexto}`;
  if (dias < 7) {
    const dia = fecha.toLocaleDateString("es-PE", { weekday: "long" });
    return `${dia.charAt(0).toUpperCase() + dia.slice(1)}, ${horaTexto}`;
  }
  return fecha.toLocaleDateString("es-PE", { day: "2-digit", month: "short" }) + " · " + horaTexto;
}
