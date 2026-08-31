"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Gift, MessageCircle, CheckCircle2, Settings2, Pencil, RotateCcw, ChevronLeft, ChevronRight, Clock, Lock } from "lucide-react";
import { useApp } from "@/lib/app-context";
import { puedeAutorizar } from "@/lib/permissions";
import { Topbar } from "@/components/layout/Topbar";
import { Card, CardHeader } from "@/components/ui/Card";
import { StatTile } from "@/components/ui/StatTile";
import { Badge } from "@/components/ui/Badge";
import { Table, Thead, Th, Tr, Td } from "@/components/ui/Table";
import { EmptyState } from "@/components/ui/EmptyState";
import { seguimientosPorNegocio } from "@/lib/mock/seguimiento";
import { clientesIndividualesPorNegocio } from "@/lib/mock/clientes";
import { BASE_DATE } from "@/lib/mock/seed";
import { resumenCumpleanosMes } from "@/lib/metrics";
import { agregarMensajeChatDirecto } from "@/lib/store";
import { useData } from "@/lib/data-context";
import { PLANTILLA_CUMPLEANOS_DEFECTO, HORA_ENVIO_DEFECTO, interpolarPlantilla } from "@/lib/mensajes";
import {
  seguimientosConNuevos, seguimientoDefectoPara, proximosCumpleanosDe, clientesPorDia, esHoy,
} from "@/lib/seguimiento-helpers";
import { ClienteIndividual, SeguimientoCumple } from "@/lib/types";

const MESES_LABEL = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Setiembre", "Octubre", "Noviembre", "Diciembre",
];

interface ConfigSaludo { mensaje: string; hora: string }

// Cualquier edición sobre un seguimiento (marcar enviado, reservación,
// personalizar mensaje/hora) puede caer en dos casos: la fila ya existe de
// verdad en Supabase (UPDATE normal), o todavía es una fila "de vista"
// armada al vuelo por seguimientoDefectoPara para un cliente que aún no
// tenía seguimiento propio (hay que crearla primero). Este helper decide
// cuál toca, sin que cada llamador tenga que saberlo.
async function guardarSeguimiento(
  s: SeguimientoCumple,
  patch: Partial<SeguimientoCumple>,
  reales: SeguimientoCumple[],
  crearSeguimiento: (s: SeguimientoCumple) => Promise<SeguimientoCumple>,
  actualizarSeguimiento: (id: string, patch: Partial<SeguimientoCumple>) => Promise<void>
): Promise<void> {
  const yaExiste = reales.some((r) => r.id === s.id);
  if (yaExiste) {
    await actualizarSeguimiento(s.id, patch);
  } else {
    await crearSeguimiento({ ...s, ...patch });
  }
}

export default function CumpleanosPage() {
  const { usuario, negocio } = useApp();
  const router = useRouter();
  const {
    clientesIndividuales, clientesCorporativos, seguimientos: seguimientosReales, configsSaludo, aprobaciones, listo: datosListos,
    crearSeguimiento, actualizarSeguimiento, guardarConfigSaludo, aprobarMes,
  } = useData();

  // "Todas las sucursales" no es un negocio real — se redirige a Panel Principal.
  const fueraDeAlcance = negocio.id === "todas";

  useEffect(() => {
    if (fueraDeAlcance) router.replace("/dashboard");
  }, [fueraDeAlcance, router]);

  if (!usuario || fueraDeAlcance || !datosListos) return null;
  const esAdmin = puedeAutorizar(usuario.rolTipo);
  const editable = usuario.rolTipo === "ventas" || usuario.rolTipo === "gerencial";

  if (!negocio.operando) {
    return (
      <>
        <Topbar titulo="Cumpleaños" descripcion={negocio.nombre} />
        <main className="flex-1 p-8">
          <Card><EmptyState icon={<Gift size={22} />} title="Este negocio aún no opera" description="Mamina Restobar todavía no tiene clientes registrados." /></Card>
        </main>
      </>
    );
  }

  const todosLosClientes = clientesIndividualesPorNegocio(clientesIndividuales, negocio.id);
  const hoy = proximosCumpleanosDe(todosLosClientes, BASE_DATE, 0);
  const proximos = proximosCumpleanosDe(todosLosClientes, BASE_DATE, 10).filter((p) => p.diffDias > 0);
  const seguimientos = seguimientosConNuevos(seguimientosPorNegocio(seguimientosReales, negocio.id), todosLosClientes, negocio.id);
  const resumenMes = resumenCumpleanosMes({ clientesIndividuales, clientesCorporativos, seguimientos: seguimientosReales }, negocio.id);

  const config: ConfigSaludo = configsSaludo.find((c) => c.negocioId === negocio.id)
    ?? { mensaje: PLANTILLA_CUMPLEANOS_DEFECTO, hora: HORA_ENVIO_DEFECTO };
  const guardarConfig = (c: ConfigSaludo) => void guardarConfigSaludo(negocio.id, c.mensaje, c.hora);

  const anio = BASE_DATE.getFullYear();
  const mesActual = BASE_DATE.getMonth() + 1;
  const aprobado = aprobaciones.some((a) => a.negocioId === negocio.id && a.anio === anio && a.mes === mesActual && a.aprobado);
  const aprobar = () => void aprobarMes(negocio.id, anio, mesActual);

  const guardar = (s: SeguimientoCumple, patch: Partial<SeguimientoCumple>) =>
    guardarSeguimiento(s, patch, seguimientosReales, crearSeguimiento, actualizarSeguimiento);

  return (
    <>
      <Topbar titulo="Cumpleaños" descripcion={`${negocio.nombre} · seguimiento y chat con clientes`} />
      <main className="flex-1 p-8 animate-fade-in space-y-6">
        <AutoEnvioCumpleanos
          negocioNombre={negocio.nombre}
          seguimientos={seguimientos}
          config={config}
          aprobado={aprobado}
          reales={seguimientosReales}
          crearSeguimiento={crearSeguimiento}
          actualizarSeguimiento={actualizarSeguimiento}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <StatTile label="Cumplen hoy" value={hoy.length} icon={<Gift size={18} />} tono="terracota" />
          <StatTile label="Próximos 10 días" value={proximos.length} icon={<Gift size={18} />} tono="naranja" />
        </div>

        <AprobacionMes
          totalDelMes={resumenMes.totalDelMes}
          aprobado={aprobado}
          aprobar={aprobar}
          puedeAprobar={esAdmin}
        />

        <ConfiguracionSaludoGeneral
          negocioNombre={negocio.nombre}
          editable={editable}
          config={config}
          guardarConfig={guardarConfig}
        />

        <CalendarioCumpleanos
          clientes={todosLosClientes}
          seguimientos={seguimientos}
          negocioNombre={negocio.nombre}
          editable={editable}
          config={config}
          onGuardar={guardar}
        />

        <Card>
          <CardHeader title="Próximos cumpleaños" subtitle="Abre el chat para saludar sin salir del sistema — mismo lugar donde queda registrada la conversación" />
          {proximos.length === 0 && hoy.length === 0 ? (
            <p className="text-sm text-[var(--color-gris-medio)] py-6 text-center">Nadie cumple años en los próximos 10 días.</p>
          ) : (
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
              {[...hoy, ...proximos].map(({ cliente, diffDias }) => (
                <div key={cliente.id} className="rounded-xl border border-[var(--color-gris-claro)]/40 p-4">
                  <div className="flex items-start justify-between mb-2">
                    <p className="font-medium text-sm text-[var(--color-gris)]">{cliente.nombres} {cliente.apellidos}</p>
                    <Badge tono={diffDias === 0 ? "terracota" : "gris"}>{diffDias === 0 ? "Hoy" : `En ${diffDias} días`}</Badge>
                  </div>
                  <p className="text-xs text-[var(--color-gris-medio)] mb-3">{cliente.celular}</p>
                  <Link
                    href={`/mensajeria?cliente=${cliente.id}`}
                    className="flex items-center justify-center gap-1.5 text-xs font-semibold bg-[var(--color-verde)] text-white rounded-lg py-2 hover:opacity-90 transition-opacity"
                  >
                    <MessageCircle size={13} /> Abrir chat
                  </Link>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card padding="p-0 pt-5">
          <div className="px-5">
            <CardHeader title="Seguimiento" subtitle="Solo los clientes a los que ya se les envió el saludo — el Estado lo marca el sistema, la Reservación la actualiza Ventas" />
          </div>
          <SeguimientoTabla seguimientos={seguimientos} editable={editable} onGuardar={guardar} />
        </Card>
      </main>
    </>
  );
}

// --- Envío automático: al montar, revisa quién cumple hoy, todavía no tiene
// el saludo marcado como enviado, y ya pasó su hora programada (general o
// personalizada) — si es así, lo "envía" (queda escrito en su chat real) y
// marca saludoEnviado, exactamente como se vería con la API de WhatsApp ya
// conectada. Se re-evalúa cada minuto mientras la página esté abierta.
//
// Todo esto depende de `aprobado` (ver AprobacionMes) — sin la aprobación de
// Gerencial de ESTE mes, nadie recibe nada, aunque hoy sea su cumpleaños. La
// aprobación se reinicia sola cada mes calendario (negocio + año + mes en
// Supabase), así que aprobar agosto no dispara el envío en septiembre.
//
// Esto es independiente de Campañas: una campaña también puede escribirle a
// este mismo cliente (agregarMensajeChatDirecto), pero eso no toca
// `saludoEnviado` ni la fila de seguimiento — son dos fuentes de mensajes
// distintas que comparten el chat, no el seguimiento. El seguimiento de
// cumpleaños (esta tabla) solo se mueve por el saludo de cumpleaños, nunca
// por una campaña.
function AutoEnvioCumpleanos({
  negocioNombre, seguimientos, config, aprobado, reales, crearSeguimiento, actualizarSeguimiento,
}: {
  negocioNombre: string; seguimientos: SeguimientoCumple[];
  config: ConfigSaludo; aprobado: boolean; reales: SeguimientoCumple[];
  crearSeguimiento: (s: SeguimientoCumple) => Promise<SeguimientoCumple>;
  actualizarSeguimiento: (id: string, patch: Partial<SeguimientoCumple>) => Promise<void>;
}) {
  const [, forceTick] = useState(0);
  // Guarda de la sesión: qué seguimientos ya se mandaron a crear/actualizar
  // desde este montaje del componente, para no volver a mandarlos si el
  // efecto se dispara dos veces seguidas ANTES de que `reales` (el estado
  // real de Supabase) alcance a reflejar el primer envío — sin esto, un
  // cliente sin fila de seguimiento propia todavía (el caso normal de "recién
  // registrado, cumple hoy") podía terminar con DOS filas en la base de
  // datos, una por cada disparo, porque ambos veían el mismo estado
  // "seguimiento virtual, sin crear todavía" al mismo tiempo.
  const enProceso = useRef<Set<string>>(new Set());

  useEffect(() => {
    const id = setInterval(() => forceTick((n) => n + 1), 60000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!aprobado) return;
    const ahora = new Date();
    const minutosAhora = ahora.getHours() * 60 + ahora.getMinutes();
    seguimientos.forEach((s) => {
      if (!esHoy(s.fechaCumple)) return;
      if (s.saludoEnviado) return;
      if (enProceso.current.has(s.id)) return;
      enProceso.current.add(s.id);
      const horaProgramada = s.horaPersonalizada || config.hora;
      const [h, m] = horaProgramada.split(":").map(Number);
      if (h * 60 + (m || 0) > minutosAhora) return;
      const plantilla = s.mensajePersonalizado || config.mensaje;
      const texto = interpolarPlantilla(plantilla, s.nombre.split(" ")[0], negocioNombre);
      // La hora "real" del saludo es la HORA PROGRAMADA (ej. 9:00 en punto),
      // no el instante en que este efecto revisó y encontró que ya tocaba
      // mandarlo — eso podía ser cualquier momento después de las 9:00,
      // según cuándo alguien tuviera el sistema abierto. El estándar es
      // 9:00 para todos salvo personalización, y así se va a comportar de
      // verdad cuando esto se conecte a la API real de WhatsApp (un envío
      // programado, no reactivo a que alguien abra la página).
      const enviado = new Date(ahora);
      enviado.setHours(h, m || 0, 0, 0);
      const enviadoEn = enviado.toISOString();
      agregarMensajeChatDirecto(s.clienteId, texto, "negocio", `${s.id}-auto-saludo`, enviadoEn);
      void guardarSeguimiento(s, { saludoEnviado: true, saludoEnviadoEn: enviadoEn }, reales, crearSeguimiento, actualizarSeguimiento);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aprobado, seguimientos.length, config.hora, config.mensaje, reales]);

  return null;
}

function ConfiguracionSaludoGeneral({
  negocioNombre, editable, config, guardarConfig,
}: {
  negocioNombre: string; editable: boolean;
  config: ConfigSaludo; guardarConfig: (c: ConfigSaludo) => void;
}) {
  const [abierto, setAbierto] = useState(false);
  const [mensaje, setMensaje] = useState(config.mensaje);
  const [hora, setHora] = useState(config.hora);

  return (
    <Card>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <CardHeader
          title="Saludo automático — general"
          subtitle={`Se aplica a todos, salvo que personalices uno individual · hoy se envía a las ${config.hora}`}
        />
        {editable && (
          <button
            onClick={() => {
              if (!abierto) { setMensaje(config.mensaje); setHora(config.hora); }
              setAbierto((v) => !v);
            }}
            className="flex items-center gap-1.5 text-xs font-semibold text-[var(--color-terracota)] hover:underline"
          >
            <Settings2 size={13} /> {abierto ? "Cerrar" : "Editar"}
          </button>
        )}
      </div>

      {!abierto && (
        <p className="text-sm text-[var(--color-gris-medio)] bg-[var(--color-crema)] rounded-xl p-3 whitespace-pre-line">
          {interpolarPlantilla(config.mensaje, "{nombre}", negocioNombre)}
        </p>
      )}

      {abierto && editable && (
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-[var(--color-gris-medio)] mb-1">
              Mensaje (usa {"{nombre}"} para el nombre del cliente)
            </label>
            <textarea value={mensaje} onChange={(e) => setMensaje(e.target.value)} rows={3} className="input" />
          </div>
          <div className="flex items-end gap-3">
            <div>
              <label className="block text-xs font-semibold text-[var(--color-gris-medio)] mb-1">Hora de envío</label>
              <input type="time" value={hora} onChange={(e) => setHora(e.target.value)} className="input w-32" />
            </div>
            <button
              onClick={() => { guardarConfig({ mensaje, hora }); setAbierto(false); }}
              className="bg-[var(--color-terracota)] text-white text-xs font-semibold rounded-lg px-4 py-2.5 hover:opacity-90 transition-opacity"
            >
              Guardar cambios
            </button>
          </div>
        </div>
      )}
    </Card>
  );
}

function CalendarioCumpleanos({
  clientes, seguimientos, negocioNombre, editable, config, onGuardar,
}: {
  clientes: ClienteIndividual[]; seguimientos: SeguimientoCumple[];
  negocioNombre: string; editable: boolean;
  config: ConfigSaludo; onGuardar: (s: SeguimientoCumple, patch: Partial<SeguimientoCumple>) => Promise<void>;
}) {
  const [mes, setMes] = useState(BASE_DATE.getMonth() + 1);
  const [diaSeleccionado, setDiaSeleccionado] = useState<number | null>(BASE_DATE.getDate());

  const anioRef = mes >= BASE_DATE.getMonth() + 1 ? BASE_DATE.getFullYear() : BASE_DATE.getFullYear() + 1;
  const diasEnMes = new Date(anioRef, mes, 0).getDate();
  const primerDiaSemana = new Date(anioRef, mes - 1, 1).getDay();

  // Solo el mes actual tiene seguimiento armado (es el único en automatización
  // activa) — por eso el mapa clienteId → seguimiento solo tiene sentido ahí.
  const seguimientoPorCliente = useMemo(() => new Map(seguimientos.map((s) => [s.clienteId, s])), [seguimientos]);

  const porDia = useMemo(() => {
    const mapa = new Map<number, ClienteIndividual[]>();
    clientes.forEach((c) => {
      const [, m, d] = c.fechaNacimiento.split("-").map(Number);
      if (m !== mes) return;
      mapa.set(d, [...(mapa.get(d) ?? []), c]);
    });
    return mapa;
  }, [clientes, mes]);

  const clientesDelDia = diaSeleccionado ? clientesPorDia(clientes, mes, diaSeleccionado) : [];

  return (
    <Card>
      <CardHeader title="Calendario de cumpleaños" subtitle="Elige un día para ver quién cumple años y a qué hora se le envía el saludo" />
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,320px)_1fr] gap-5">
        <div>
          <div className="flex items-center justify-between mb-2">
            <button onClick={() => setMes((m) => (m === 1 ? 12 : m - 1))} className="p-1.5 rounded-lg hover:bg-[var(--color-crema)] text-[var(--color-gris-medio)]">
              <ChevronLeft size={16} />
            </button>
            <p className="text-sm font-semibold text-[var(--color-gris)]">{MESES_LABEL[mes - 1]}</p>
            <button onClick={() => setMes((m) => (m === 12 ? 1 : m + 1))} className="p-1.5 rounded-lg hover:bg-[var(--color-crema)] text-[var(--color-gris-medio)]">
              <ChevronRight size={16} />
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-semibold text-[var(--color-gris-medio)] mb-1">
            {["D", "L", "M", "M", "J", "V", "S"].map((d, i) => <span key={i}>{d}</span>)}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: primerDiaSemana }).map((_, i) => <span key={`vacio-${i}`} />)}
            {Array.from({ length: diasEnMes }, (_, i) => i + 1).map((dia) => {
              const cantidad = porDia.get(dia)?.length ?? 0;
              const esHoyCelda = mes === BASE_DATE.getMonth() + 1 && dia === BASE_DATE.getDate();
              return (
                <button
                  key={dia}
                  onClick={() => setDiaSeleccionado(dia)}
                  className={`relative aspect-square rounded-lg text-xs font-medium flex items-center justify-center transition-colors ${
                    diaSeleccionado === dia
                      ? "bg-[var(--color-terracota)] text-white"
                      : esHoyCelda
                        ? "bg-[var(--color-naranja-claro)]/50 text-[var(--color-gris)]"
                        : "hover:bg-[var(--color-crema)] text-[var(--color-gris)]"
                  }`}
                >
                  {dia}
                  {cantidad > 0 && (
                    <span className={`absolute bottom-0.5 w-1.5 h-1.5 rounded-full ${diaSeleccionado === dia ? "bg-white" : "bg-[var(--color-terracota)]"}`} />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          {diaSeleccionado === null ? (
            <p className="text-sm text-[var(--color-gris-medio)] py-6 text-center">Elige un día del calendario.</p>
          ) : clientesDelDia.length === 0 ? (
            <p className="text-sm text-[var(--color-gris-medio)] py-6 text-center">
              Nadie cumple años el {diaSeleccionado} de {MESES_LABEL[mes - 1].toLowerCase()}.
            </p>
          ) : (
            <div className="space-y-2">
              {clientesDelDia.map((c) => {
                const seguimiento = seguimientoPorCliente.get(c.id) ?? seguimientoDefectoPara(c);
                return (
                  <ClienteDelDia
                    key={c.id}
                    seguimiento={seguimiento}
                    negocioNombre={negocioNombre}
                    configGeneral={config}
                    onGuardar={onGuardar}
                    editable={editable}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

function ClienteDelDia({
  seguimiento, negocioNombre, configGeneral, onGuardar, editable,
}: {
  seguimiento: SeguimientoCumple; negocioNombre: string;
  configGeneral: ConfigSaludo;
  onGuardar: (s: SeguimientoCumple, patch: Partial<SeguimientoCumple>) => Promise<void>;
  editable: boolean;
}) {
  const [editando, setEditando] = useState(false);
  const mensajeEfectivo = seguimiento.mensajePersonalizado || configGeneral.mensaje;
  const horaEfectiva = seguimiento.horaPersonalizada || configGeneral.hora;
  const [mensaje, setMensaje] = useState(mensajeEfectivo);
  const [hora, setHora] = useState(horaEfectiva);
  const personalizado = Boolean(seguimiento.mensajePersonalizado || seguimiento.horaPersonalizada);

  return (
    <div className="rounded-xl border border-[var(--color-gris-claro)]/40 p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-medium text-[var(--color-gris)] truncate">{seguimiento.nombre}</p>
          <p className="text-xs text-[var(--color-gris-medio)]">{seguimiento.celular}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Badge tono={personalizado ? "naranja" : "gris"}>
            <Clock size={11} /> {horaEfectiva}
          </Badge>
          {personalizado && <Badge tono="azul">Personalizado</Badge>}
          {editable && (
            <button onClick={() => setEditando((v) => !v)} className="p-1.5 rounded-lg hover:bg-[var(--color-crema)] text-[var(--color-gris-medio)]">
              <Pencil size={13} />
            </button>
          )}
        </div>
      </div>

      {!editando && (
        <p className="text-xs text-[var(--color-gris-medio)] mt-2 line-clamp-2">
          {interpolarPlantilla(mensajeEfectivo, seguimiento.nombre.split(" ")[0], negocioNombre)}
        </p>
      )}

      {editando && editable && (
        <div className="mt-2 space-y-2">
          <textarea value={mensaje} onChange={(e) => setMensaje(e.target.value)} rows={2} className="input text-xs" />
          <div className="flex items-center gap-2">
            <input type="time" value={hora} onChange={(e) => setHora(e.target.value)} className="input w-28 text-xs" />
            <button
              onClick={() => { void onGuardar(seguimiento, { mensajePersonalizado: mensaje, horaPersonalizada: hora }); setEditando(false); }}
              className="text-xs font-semibold bg-[var(--color-terracota)] text-white rounded-lg px-3 py-1.5 hover:opacity-90 transition-opacity"
            >
              Guardar
            </button>
            {personalizado && (
              <button
                onClick={() => {
                  void onGuardar(seguimiento, { mensajePersonalizado: undefined, horaPersonalizada: undefined });
                  setMensaje(configGeneral.mensaje); setHora(configGeneral.hora); setEditando(false);
                }}
                className="flex items-center gap-1 text-xs font-medium text-[var(--color-gris-medio)] hover:text-[var(--color-gris)]"
              >
                <RotateCcw size={12} /> Usar el general
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Gerencial aprueba (o no) el envío automático de ESTE mes calendario — sin
// aprobar, AutoEnvioCumpleanos no manda nada, aunque hoy alguien cumpla
// años. Ventas no puede aprobar, pero sí necesita ver por qué el saludo
// automático no se está mandando — por eso esta tarjeta se muestra para los
// dos roles, solo que Ventas ve el estado, no el botón.
function AprobacionMes({
  totalDelMes, aprobado, aprobar, puedeAprobar,
}: {
  totalDelMes: number; aprobado: boolean; aprobar: () => void; puedeAprobar: boolean;
}) {
  return (
    <Card>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="text-sm font-semibold text-[var(--color-gris)]">Aprobación del envío automático de este mes</p>
          <p className="text-xs text-[var(--color-gris-medio)] mt-0.5">
            {totalDelMes} clientes cumplen años este mes.{" "}
            {aprobado
              ? "El saludo se manda solo, cada quien el día de su cumpleaños."
              : puedeAprobar
                ? "Revisa el detalle abajo y aprueba para que el saludo se mande solo, cada quien el día de su cumpleaños."
                : "El saludo automático de este mes todavía no se manda — falta que Gerencial lo apruebe."}
          </p>
        </div>
        {aprobado ? (
          <Badge tono="verde"><CheckCircle2 size={12} /> Aprobado por Gerencial</Badge>
        ) : puedeAprobar ? (
          <button
            onClick={aprobar}
            className="flex items-center gap-1.5 bg-[var(--color-terracota)] text-white text-xs font-semibold rounded-lg px-3.5 py-2 hover:opacity-90 transition-opacity"
          >
            <CheckCircle2 size={14} /> Aprobar mes
          </button>
        ) : (
          <Badge tono="naranja"><Lock size={12} /> Pendiente de aprobación</Badge>
        )}
      </div>
    </Card>
  );
}

// Solo dos campos, cada uno con un dueño claro: Estado lo marca el sistema
// solo (se pone "Enviado" en cuanto AutoEnvioCumpleanos manda el saludo — no
// se edita a mano), Reservación la marca Ventas a mano después de hablar con
// el cliente (¿aceptó volver? ¿se concretó la reserva?).
function SeguimientoTabla({
  seguimientos, editable, onGuardar,
}: {
  seguimientos: SeguimientoCumple[]; editable: boolean;
  onGuardar: (s: SeguimientoCumple, patch: Partial<SeguimientoCumple>) => Promise<void>;
}) {
  // Antes de que se le mande el saludo no hay nada que dar seguimiento —
  // mostrarlo acá solo genera ruido y confunde (para eso está "Próximos
  // cumpleaños" arriba, que sí lista a los que todavía no les toca).
  const enviados = seguimientos.filter((s) => s.saludoEnviado);

  return (
    <>
      <Table>
        <Thead>
          <Th>Nombre</Th><Th>Celular</Th><Th>Estado</Th><Th>Reservación</Th>
        </Thead>
        <tbody>
          {enviados.map((s) => (
            <Tr key={s.id}>
              <Td className="font-medium">{s.nombre}</Td>
              <Td>{s.celular}</Td>
              <Td><Badge tono="verde"><CheckCircle2 size={11} /> Enviado</Badge></Td>
              <Td>
                {editable ? (
                  <select
                    value={s.reservacion}
                    onChange={(e) => void onGuardar(s, { reservacion: e.target.value as "si" | "no" | "pendiente" })}
                    className="text-xs border border-[var(--color-gris-claro)]/50 rounded-lg px-2 py-1 bg-white"
                  >
                    <option value="pendiente">—</option>
                    <option value="si">Sí</option>
                    <option value="no">No</option>
                  </select>
                ) : (
                  <>
                    {s.reservacion === "si" && <Badge tono="verde">Sí</Badge>}
                    {s.reservacion === "no" && <Badge tono="rojo">No</Badge>}
                    {s.reservacion === "pendiente" && <Badge tono="gris">—</Badge>}
                  </>
                )}
              </Td>
            </Tr>
          ))}
        </tbody>
      </Table>
      {enviados.length === 0 && (
        <p className="text-center text-sm text-[var(--color-gris-medio)] py-10">
          Todavía no se le mandó el saludo a nadie este mes.
        </p>
      )}
    </>
  );
}
