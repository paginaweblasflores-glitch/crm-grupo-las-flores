"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Lock, Megaphone, Clock, MessageCircle, Plus, X, Pencil, Trash2,
  CheckCircle2, ChevronDown, ChevronUp,
} from "lucide-react";
import { useApp } from "@/lib/app-context";
import { accesoA, puedeCrearCampanas, puedeAprobarCampanas, puedeCambiarNegocio } from "@/lib/permissions";
import { Topbar } from "@/components/layout/Topbar";
import { Card, CardHeader } from "@/components/ui/Card";
import { StatTile } from "@/components/ui/StatTile";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge, type Tono } from "@/components/ui/Badge";
import { campanaAlcanzaNegocio } from "@/lib/mock/campanas";
import { NEGOCIOS, getNegocio, nombreCombinadoNegocios } from "@/lib/mock/negocios";
import { useConfigWhatsAppAPI, agregarMensajeChatDirecto } from "@/lib/store";
import { useData } from "@/lib/data-context";
import { requerido, Errores } from "@/lib/validacion";
import { Campana, NegocioId } from "@/lib/types";
import { enlaceWhatsApp } from "@/lib/whatsapp";

const PUBLICO_LABEL: Record<string, string> = { todos: "Todos los clientes", natural: "Clientes naturales", corporativo: "Clientes corporativos" };

interface ClienteResuelto {
  nombre: string;
  celular: string;
  tipo: "Natural" | "Corporativo";
  negocioId: NegocioId;
}

// Mismo texto que ya usa Días Festivos para su "alcance".
function etiquetaSucursales(negocios: Campana["negocios"]): string {
  if (negocios === "todas") return "Todas las sucursales";
  return negocios.map((id) => getNegocio(id)?.nombre ?? id).join(" + ");
}

// {negocio} en un mensaje de campaña se reemplaza por el nombre real del
// negocio — igual que {negocio} en el saludo de cumpleaños, pero acá puede
// resolver a más de un nombre a la vez (ver nombreCombinadoNegocios): "para
// quién es esta campaña" cuando todavía no hay un cliente puntual (la
// tarjeta de la lista, la vista previa del formulario), o el negocio real
// de ESE cliente cuando el mensaje ya se le va a mandar a alguien en
// concreto (WhatsApp individual, envío masivo) — ahí no tiene sentido
// nombrarle a un cliente de Las Flores un negocio que nunca visitó.
function personalizarMensaje(mensaje: string, nombreNegocio: string): string {
  return mensaje.replaceAll("{negocio}", nombreNegocio);
}

export default function CampanasPage() {
  return (
    <Suspense fallback={null}>
      <CampanasInner />
    </Suspense>
  );
}

function CampanasInner() {
  const { usuario, negocio } = useApp();
  const router = useRouter();
  const searchParams = useSearchParams();
  const festividadId = searchParams.get("festividad");
  const nombreSugerido = searchParams.get("nombre");
  const [formAbierto, setFormAbierto] = useState(Boolean(festividadId));
  const [editando, setEditando] = useState<Campana | null>(null);
  const {
    campanas: todasLasCampanas, clientesIndividuales, clientesCorporativos,
    crearCampana, actualizarCampana, eliminarCampana,
  } = useData();
  const { config: configWhatsApp, listo: listoConfigWhatsApp } = useConfigWhatsAppAPI();

  // "Todas las sucursales" no es un negocio real donde se pueda crear una
  // campaña — se redirige a Panel Principal. Una campaña que llega a varias
  // sedes (o a todas) se arma desde acá, eligiendo las sucursales en el
  // formulario — no cambiando el selector del Topbar.
  const fueraDeAlcance = negocio.id === "todas";

  useEffect(() => {
    if (fueraDeAlcance) router.replace("/dashboard");
  }, [fueraDeAlcance, router]);

  // Base de clientes viva de LOS 3 negocios — hace falta completa, no solo
  // la del negocio activo, porque una campaña puede incluir clientes de
  // otras sedes.
  const individualesPorNegocio = useMemo(() => {
    const mapa = new Map<NegocioId, { id: string }[]>();
    NEGOCIOS.forEach((n) => {
      mapa.set(n.id, clientesIndividuales.filter((c) => c.negocioId === n.id));
    });
    return mapa;
  }, [clientesIndividuales]);
  const corporativosPorNeg = useMemo(() => {
    const mapa = new Map<NegocioId, { id: string }[]>();
    NEGOCIOS.forEach((n) => {
      mapa.set(n.id, clientesCorporativos.filter((c) => c.negocioId === n.id));
    });
    return mapa;
  }, [clientesCorporativos]);
  const clientesPorId = useMemo(() => {
    const mapa = new Map<string, ClienteResuelto>();
    clientesIndividuales.forEach((c) => mapa.set(c.id, { nombre: `${c.nombres} ${c.apellidos}`.trim(), celular: c.celular, tipo: "Natural", negocioId: c.negocioId }));
    clientesCorporativos.forEach((c) => mapa.set(c.id, { nombre: c.razonSocial, celular: c.celular, tipo: "Corporativo", negocioId: c.negocioId }));
    return mapa;
  }, [clientesIndividuales, clientesCorporativos]);

  function idsParaPublicoYSucursales(publico: Campana["publico"], negocios: Campana["negocios"]): string[] {
    const sedes = negocios === "todas" ? NEGOCIOS.map((n) => n.id) : negocios;
    const ids: string[] = [];
    sedes.forEach((sedeId) => {
      if (publico === "natural" || publico === "todos") ids.push(...(individualesPorNegocio.get(sedeId) ?? []).map((c) => c.id));
      if (publico === "corporativo" || publico === "todos") ids.push(...(corporativosPorNeg.get(sedeId) ?? []).map((c) => c.id));
    });
    return ids;
  }

  // Aprobar congela el segmento al momento de aprobar — así el % de
  // contactados de una campaña no se mueve solo porque después se registró
  // un cliente nuevo que nunca recibió el mensaje.
  //
  // El envío masivo real (automático, sin abrir WhatsApp uno por uno) solo
  // existe con la API de WhatsApp Business — pagada, no conectada todavía
  // (ver decisión de Mijael). Mientras tanto, "Aprobar y enviar" SIMULA que
  // ya se mandó a todo el segmento (marca el 100% como contactado al
  // instante) — igual que el resto del sistema, no se oculta que es
  // simulado: se avisa en el texto de la tarjeta. El botón de WhatsApp por
  // cliente sigue ahí y sigue siendo real, para cuando alguien quiera
  // contactar a una persona puntual de verdad.
  //
  // Cada cliente del segmento recibe además el mensaje de la campaña en su
  // chat de Mensajería (agregarMensajeChatDirecto) — así el envío masivo no
  // solo mueve el % de la tarjeta, se ve reflejado como conversación real en
  // el otro módulo, igual que ya pasa con el saludo de cumpleaños.
  function aprobarCampana(c: Campana) {
    const objetivo = idsParaPublicoYSucursales(c.publico, c.negocios);
    objetivo.forEach((clienteId) => {
      const nombreNegocio = getNegocio(clientesPorId.get(clienteId)?.negocioId ?? "")?.nombre ?? nombreCombinadoNegocios(c.negocios);
      agregarMensajeChatDirecto(clienteId, personalizarMensaje(c.mensaje, nombreNegocio), "negocio");
    });
    void actualizarCampana(c.id, {
      estado: "aprobada", aprobadaEn: new Date().toISOString().slice(0, 10),
      clientesObjetivo: objetivo, contactados: objetivo,
    });
  }

  // "Contactado" = se hizo clic en su WhatsApp desde acá — un registro
  // honesto de intención, no una confirmación de que el mensaje se mandó de
  // verdad (eso solo lo sabe quien lo envía a mano). Lo puede marcar
  // cualquiera que vea el módulo, no solo Gerencial — contactar clientes es
  // el trabajo diario de Ventas, igual que ya hace uno por uno en Clientes.
  // Mismo reflejo en Mensajería que el envío masivo, pero solo la primera
  // vez que se marca a ese cliente — para no duplicar el mensaje si alguien
  // vuelve a hacer clic en un cliente que ya estaba contactado.
  function marcarContactado(c: Campana, clienteId: string) {
    if (c.contactados.includes(clienteId)) return;
    const nombreNegocio = getNegocio(clientesPorId.get(clienteId)?.negocioId ?? "")?.nombre ?? nombreCombinadoNegocios(c.negocios);
    agregarMensajeChatDirecto(clienteId, personalizarMensaje(c.mensaje, nombreNegocio), "negocio");
    void actualizarCampana(c.id, { contactados: [...c.contactados, clienteId] });
  }

  if (!usuario || fueraDeAlcance || !listoConfigWhatsApp) return null;
  const nivel = accesoA(usuario.rolTipo, "campanas");
  const puedeCrear = puedeCrearCampanas(usuario.rolTipo);
  const puedeAprobar = puedeAprobarCampanas(usuario.rolTipo);

  if (nivel === "no") {
    return (
      <>
        <Topbar titulo="Campañas" descripcion={negocio.nombre} />
        <main className="flex-1 p-8">
          <Card>
            <EmptyState
              icon={<Lock size={22} />}
              title="Este módulo no está disponible para tu rol"
              description="Campañas las arma y envía cada negocio (Ventas y Gerencial) — tu rol no tiene acceso a este módulo."
            />
          </Card>
        </main>
      </>
    );
  }

  if (!negocio.operando) {
    return (
      <>
        <Topbar titulo="Campañas" descripcion={negocio.nombre} />
        <main className="flex-1 p-8">
          <Card><EmptyState icon={<Megaphone size={22} />} title="Este negocio aún no opera" description="Mamina Restobar no tiene campañas todavía." /></Card>
        </main>
      </>
    );
  }

  const campanas = todasLasCampanas.filter((c) => campanaAlcanzaNegocio(c, negocio.id));
  const borradoresPendientes = campanas.filter((c) => c.estado === "borrador").length;
  const totalContactados = campanas.reduce((a, c) => a + c.contactados.length, 0);

  // Borradores primero (necesitan acción), luego aprobadas por fecha
  // reciente — así lo que hay que revisar siempre queda arriba.
  const campanasOrdenadas = [...campanas].sort((a, b) => {
    if (a.estado !== b.estado) return a.estado === "borrador" ? -1 : 1;
    const fechaA = a.aprobadaEn ?? a.creadaEn;
    const fechaB = b.aprobadaEn ?? b.creadaEn;
    return fechaB.localeCompare(fechaA);
  });

  return (
    <>
      <Topbar titulo="Campañas" descripcion={`${negocio.nombre} · mensajes masivos por WhatsApp`} />
      <main className="flex-1 p-8 animate-fade-in space-y-6" id="reporte">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatTile label="Campañas" value={campanas.length} icon={<Megaphone size={18} />} tono="terracota" />
          <StatTile label="Borradores por aprobar" value={borradoresPendientes} icon={<Clock size={18} />} tono="naranja" />
          <StatTile label="Clientes contactados" value={totalContactados} icon={<MessageCircle size={18} />} tono="verde" />
        </div>

        {(formAbierto || editando) && (
          <CampanaForm
            negocioActivo={negocio.id}
            puedeElegirSucursales={puedeCambiarNegocio(usuario.rolTipo)}
            registradoPor={usuario.id}
            campana={editando}
            nombreInicial={!editando ? nombreSugerido ?? undefined : undefined}
            festividadId={!editando ? festividadId ?? undefined : undefined}
            onCancelar={() => { setFormAbierto(false); setEditando(null); }}
            onGuardar={(c) => {
              if (editando) void actualizarCampana(editando.id, c);
              else void crearCampana(c);
              setFormAbierto(false);
              setEditando(null);
            }}
          />
        )}

        <div>
          <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
            <CardHeader
              title="Campañas"
              subtitle={
                configWhatsApp
                  ? `Conectado — WhatsApp Business ${configWhatsApp.numeroTelefono} (el envío sigue simulado hasta terminar la integración)`
                  : "Mensajes masivos por WhatsApp — al aprobar se simula el envío a todo el segmento (API de WhatsApp Business todavía no conectada)"
              }
            />
            <div className="flex items-center gap-2 shrink-0">
              {puedeCrear && !formAbierto && !editando && (
                <button
                  onClick={() => setFormAbierto(true)}
                  className="flex items-center gap-2 bg-[var(--color-terracota)] text-white text-sm font-semibold rounded-xl px-4 py-2.5 hover:opacity-90 transition-opacity whitespace-nowrap"
                >
                  <Plus size={15} /> Nueva campaña
                </button>
              )}
            </div>
          </div>

          {campanasOrdenadas.length === 0 ? (
            <Card>
              <EmptyState icon={<Megaphone size={22} />} title="Sin campañas todavía" description="Crea la primera desde el botón de arriba." />
            </Card>
          ) : (
            <div className="space-y-4">
              {campanasOrdenadas.map((c) => (
                <Card key={c.id} padding="p-0">
                  <CampanaCard
                    campana={c}
                    clientesPorId={clientesPorId}
                    puedeCrear={puedeCrear}
                    puedeAprobar={puedeAprobar}
                    onEditar={() => setEditando(c)}
                    onAprobar={() => aprobarCampana(c)}
                    onEliminar={() => void eliminarCampana(c.id)}
                    onMarcarContactado={(clienteId) => marcarContactado(c, clienteId)}
                  />
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}

function CampanaCard({
  campana: c, clientesPorId, puedeCrear, puedeAprobar, onEditar, onAprobar, onEliminar, onMarcarContactado,
}: {
  campana: Campana;
  clientesPorId: Map<string, ClienteResuelto>;
  puedeCrear: boolean;
  puedeAprobar: boolean;
  onEditar: () => void;
  onAprobar: () => void;
  onEliminar: () => void;
  onMarcarContactado: (clienteId: string) => void;
}) {
  const [expandido, setExpandido] = useState(false);
  // Solo las campañas creadas desde el sistema (registradoPor presente) se
  // pueden editar/aprobar/eliminar/enviar — las históricas del mock ya
  // pasaron, quedan como archivo de referencia, no interactivas.
  const esPropia = Boolean(c.registradoPor);
  const objetivo = c.clientesObjetivo ?? [];
  const pct = objetivo.length > 0 ? Math.round((c.contactados.length / objetivo.length) * 100) : 0;
  const estadoTono: Tono = c.estado === "aprobada" ? "verde" : "gris";
  // Si llega a más de una sede, cada cliente de la cola muestra de cuál es
  // — si es de una sola sede (el caso normal), no hace falta el detalle.
  const multiSede = c.negocios === "todas" || c.negocios.length > 1;
  // Vista previa de la tarjeta: {negocio} resuelto al conjunto de sedes de
  // la campaña (no hay un cliente puntual todavía acá) — cuando el mensaje
  // sí se le manda a alguien en concreto (más abajo), se usa el negocio de
  // ESE cliente, no este combinado.
  const mensajeVistaPrevia = personalizarMensaje(c.mensaje, nombreCombinadoNegocios(c.negocios));

  return (
    <div className="px-5 py-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <Badge tono={estadoTono}>{c.estado === "aprobada" ? "Aprobada" : "Borrador"}</Badge>
            <Badge tono="azul">{PUBLICO_LABEL[c.publico]}</Badge>
            <Badge tono="naranja">{etiquetaSucursales(c.negocios)}</Badge>
          </div>
          <p className="text-sm font-semibold text-[var(--color-gris)]">{c.nombre}</p>
          <p className="text-xs text-[var(--color-gris-medio)] mt-0.5 line-clamp-2 max-w-xl">{mensajeVistaPrevia}</p>
        </div>

        {esPropia && (puedeCrear || puedeAprobar) && (
          <div className="flex items-center gap-1.5 shrink-0">
            {c.estado === "borrador" && puedeCrear && (
              <button
                onClick={onEditar}
                className="flex items-center gap-1.5 text-xs font-semibold rounded-lg px-3 py-1.5 text-[var(--color-gris-medio)] hover:bg-[var(--color-crema)] transition-colors"
              >
                <Pencil size={13} /> Editar
              </button>
            )}
            {c.estado === "borrador" && puedeAprobar && (
              <button
                onClick={onAprobar}
                className="flex items-center gap-1.5 text-xs font-semibold rounded-lg px-3 py-1.5 bg-[var(--color-verde)] text-white hover:opacity-90 transition-opacity"
              >
                <CheckCircle2 size={13} /> Aprobar y enviar
              </button>
            )}
            {puedeCrear && (
              <button onClick={onEliminar} className="p-1.5 rounded-lg hover:bg-[var(--color-rojo-claro)] text-[var(--color-rojo)]">
                <Trash2 size={13} />
              </button>
            )}
          </div>
        )}
      </div>

      {c.estado === "aprobada" && (
        <div className="mt-3 pt-3 border-t border-[var(--color-gris-claro)]/30">
          <div className="flex items-center justify-between gap-3 mb-1.5">
            <div className="flex-1">
              <div className="flex items-center justify-between text-[11px] text-[var(--color-gris-medio)] mb-1 font-semibold">
                <span>{c.contactados.length}/{objetivo.length} contactados{esPropia ? " (simulado)" : ""}</span>
                <span>{pct}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-[var(--color-crema-oscuro)] overflow-hidden">
                <div className="h-full rounded-full bg-[var(--color-verde)] transition-all" style={{ width: `${pct}%` }} />
              </div>
            </div>
            <button
              onClick={() => setExpandido((v) => !v)}
              className="flex items-center gap-1 text-xs font-semibold text-[var(--color-terracota)] hover:underline shrink-0"
            >
              Ver clientes
              {expandido ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          </div>

          {expandido && (
            <ul className="mt-2 divide-y divide-[var(--color-gris-claro)]/20 border border-[var(--color-gris-claro)]/30 rounded-xl overflow-hidden">
              {objetivo.map((id) => {
                const cliente = clientesPorId.get(id);
                const contactado = c.contactados.includes(id);
                if (!cliente) return null;
                const negocioCliente = getNegocio(cliente.negocioId);
                return (
                  <li key={id} className="flex items-center justify-between gap-3 px-3.5 py-2.5 bg-white">
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-[var(--color-gris)] truncate">{cliente.nombre}</p>
                      <p className="text-[11px] text-[var(--color-gris-medio)] flex items-center gap-1.5 flex-wrap">
                        {cliente.celular}
                        {multiSede && negocioCliente && (
                          <span className="inline-flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: negocioCliente.colorAcento }} />
                            {negocioCliente.nombre}
                          </span>
                        )}
                        {esPropia && contactado && <Badge tono="verde">Contactado (simulado)</Badge>}
                      </p>
                    </div>
                    {esPropia ? (
                      // Este botón es real (aunque el envío masivo de arriba
                      // sea simulado): abre WhatsApp de verdad con el
                      // mensaje precargado, para contactar a esta persona
                      // en concreto.
                      <a
                        href={enlaceWhatsApp(cliente.celular, personalizarMensaje(c.mensaje, negocioCliente?.nombre ?? nombreCombinadoNegocios(c.negocios)))}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => onMarcarContactado(id)}
                        className="shrink-0 flex items-center gap-1.5 text-[11px] font-semibold rounded-lg px-2.5 py-1.5 bg-[var(--color-verde)] text-white hover:opacity-90 transition-opacity"
                      >
                        <MessageCircle size={12} />
                        Enviar
                      </a>
                    ) : (
                      <Badge tono={contactado ? "verde" : "gris"}>{contactado ? "Contactado" : "No contactado"}</Badge>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function CampanaForm({
  negocioActivo, puedeElegirSucursales, registradoPor, campana, nombreInicial, festividadId, onGuardar, onCancelar,
}: {
  negocioActivo: NegocioId; puedeElegirSucursales: boolean; registradoPor: string; campana: Campana | null;
  nombreInicial?: string; festividadId?: string;
  onGuardar: (c: Campana) => void; onCancelar: () => void;
}) {
  const [nombre, setNombre] = useState(campana?.nombre ?? nombreInicial ?? "");
  const [publico, setPublico] = useState<Campana["publico"]>(campana?.publico ?? "todos");
  const [mensaje, setMensaje] = useState(campana?.mensaje ?? "");
  const [todasLasSucursales, setTodasLasSucursales] = useState(campana ? campana.negocios === "todas" : false);
  // Por defecto, solo la sede activa — Gerencial puede agregar más si
  // quiere que la campaña llegue a otras sucursales (ver
  // `puedeElegirSucursales`; Ventas solo opera la suya). El default de "la
  // sede activa" solo aplica a una campaña NUEVA — si se está editando una
  // que ya era "todas", arranca vacío: si no, el primer clic en una sede
  // puntual la SACABA en vez de agregarla (ya estaba ahí, precargada sin
  // que se viera), y la campaña terminaba sin ninguna sede elegida.
  const [sucursalesElegidas, setSucursalesElegidas] = useState<NegocioId[]>(
    campana && campana.negocios !== "todas" ? campana.negocios : campana ? [] : [negocioActivo]
  );
  const [errores, setErrores] = useState<Errores>({});

  function toggleSucursal(id: NegocioId) {
    setSucursalesElegidas((prev) => (prev.includes(id) ? prev.filter((n) => n !== id) : [...prev, id]));
  }

  function validar(): Errores {
    const err: Errores = {};
    const eNombre = requerido(nombre, "El nombre de la campaña");
    if (eNombre) err.nombre = eNombre;
    const eMensaje = requerido(mensaje, "El mensaje");
    if (eMensaje) err.mensaje = eMensaje;
    if (!todasLasSucursales && sucursalesElegidas.length === 0) err.sucursales = "Elige al menos una sucursal.";
    return err;
  }

  function guardar(e: React.FormEvent) {
    e.preventDefault();
    const err = validar();
    setErrores(err);
    if (Object.keys(err).length > 0) return;
    onGuardar({
      id: campana?.id ?? `${negocioActivo}-camp-manual-${Date.now()}`,
      negocios: todasLasSucursales ? "todas" : sucursalesElegidas,
      nombre: nombre.trim(),
      publico,
      mensaje: mensaje.trim(),
      estado: campana?.estado ?? "borrador",
      creadaEn: campana?.creadaEn ?? new Date().toISOString().slice(0, 10),
      aprobadaEn: campana?.aprobadaEn,
      clientesObjetivo: campana?.clientesObjetivo,
      contactados: campana?.contactados ?? [],
      registradoPor,
      festividadId: campana?.festividadId ?? festividadId,
    });
  }

  return (
    <Card className="animate-fade-in">
      <div className="flex items-center justify-between mb-1">
        <CardHeader
          title={campana ? "Editar campaña" : "Nueva campaña"}
          subtitle="Se crea como borrador — el mensaje se puede seguir editando hasta que la apruebes"
        />
        <button onClick={onCancelar} className="text-[var(--color-gris-medio)] hover:text-[var(--color-gris)]">
          <X size={18} />
        </button>
      </div>
      <form onSubmit={guardar} noValidate className="grid sm:grid-cols-2 gap-3">
        <Campo label="Nombre de la campaña" requerido error={errores.nombre}>
          <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej. Promoción de temporada" className="input" />
        </Campo>
        <Campo label="Público objetivo">
          <select value={publico} onChange={(e) => setPublico(e.target.value as Campana["publico"])} className="input bg-white">
            <option value="todos">{PUBLICO_LABEL.todos}</option>
            <option value="natural">{PUBLICO_LABEL.natural}</option>
            <option value="corporativo">{PUBLICO_LABEL.corporativo}</option>
          </select>
        </Campo>
        <div className="sm:col-span-2">
          <label className="block text-xs font-semibold text-[var(--color-gris-medio)] mb-1.5">Sucursales</label>
          {puedeElegirSucursales ? (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setTodasLasSucursales(true)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${todasLasSucursales ? "bg-[var(--color-terracota)] text-white" : "bg-white border border-[var(--color-gris-claro)]/50 text-[var(--color-gris-medio)]"}`}
              >
                Todas las sucursales
              </button>
              {NEGOCIOS.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  disabled={!n.operando}
                  onClick={() => { setTodasLasSucursales(false); toggleSucursal(n.id); }}
                  title={!n.operando ? "Todavía no opera" : undefined}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                    !todasLasSucursales && sucursalesElegidas.includes(n.id) ? "bg-[var(--color-terracota)] text-white" : "bg-white border border-[var(--color-gris-claro)]/50 text-[var(--color-gris-medio)]"
                  }`}
                >
                  {n.nombre}
                </button>
              ))}
            </div>
          ) : (
            // Ventas no cambia de negocio activamente (solo opera el suyo) —
            // acá solo se muestra a qué sucursales llega, de solo lectura,
            // para no perder de vista una campaña de grupo que armó
            // Gerencial si Ventas la abre para editar el mensaje.
            <p className="text-xs text-[var(--color-gris-medio)] bg-[var(--color-crema)] rounded-lg px-3 py-2">
              {etiquetaSucursales(todasLasSucursales ? "todas" : sucursalesElegidas)}
            </p>
          )}
          {errores.sucursales && <p className="text-[11px] text-[var(--color-rojo)] mt-1 font-medium">{errores.sucursales}</p>}
        </div>
        <div className="sm:col-span-2">
          <Campo label="Mensaje" requerido error={errores.mensaje}>
            <textarea value={mensaje} onChange={(e) => setMensaje(e.target.value)} rows={3} placeholder="Escribe el mensaje que se manda por WhatsApp… puedes usar {negocio} para el nombre del negocio" className="input" />
          </Campo>
          {mensaje.includes("{negocio}") && (
            <p className="text-[11px] text-[var(--color-gris-medio)] mt-1.5">
              Vista previa: <span className="italic">
                {personalizarMensaje(mensaje, nombreCombinadoNegocios(todasLasSucursales ? "todas" : sucursalesElegidas))}
              </span>
            </p>
          )}
        </div>
        <div className="sm:col-span-2 flex justify-end gap-2 pt-1">
          <button type="button" onClick={onCancelar} className="text-sm font-medium text-[var(--color-gris-medio)] px-4 py-2">Cancelar</button>
          <button type="submit" className="bg-[var(--color-terracota)] text-white text-sm font-semibold rounded-xl px-5 py-2.5 hover:opacity-90 transition-opacity">
            Guardar borrador
          </button>
        </div>
      </form>
    </Card>
  );
}

function Campo({
  label, children, requerido, error,
}: {
  label: string; children: React.ReactNode; requerido?: boolean; error?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-[var(--color-gris-medio)] mb-1">
        {label} {requerido && <span className="text-[var(--color-rojo)]">*</span>}
      </label>
      {children}
      {error && <p className="text-[11px] text-[var(--color-rojo)] mt-1 font-medium">{error}</p>}
    </div>
  );
}
