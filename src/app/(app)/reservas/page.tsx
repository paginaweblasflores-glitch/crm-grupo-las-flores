"use client";

import { useMemo, useState } from "react";
import { Download, CalendarCheck, CheckCircle2, XCircle, ShieldCheck, Plus, Globe2, X } from "lucide-react";
import { useApp } from "@/lib/app-context";
import { puedeAutorizar, puedeCrearReservasDelivery } from "@/lib/permissions";
import { useAutorizaciones, useReservasCreadas } from "@/lib/store";
import { Topbar } from "@/components/layout/Topbar";
import { Card, CardHeader } from "@/components/ui/Card";
import { StatTile } from "@/components/ui/StatTile";
import { SearchInput } from "@/components/ui/SearchInput";
import { Badge, type Tono } from "@/components/ui/Badge";
import { Table, Thead, Th, Tr, Td } from "@/components/ui/Table";
import { EmptyState } from "@/components/ui/EmptyState";
import { reservasPorNegocio } from "@/lib/mock/reservas";
import { reservasSemana, tasaConversionReservas } from "@/lib/metrics";
import { exportarCSV } from "@/lib/export-csv";
import { requerido, celularPeru, soloLetras, nombrePersona, Errores } from "@/lib/validacion";
import { EstadoReserva, Reserva } from "@/lib/types";

const ESTADO_TONO: Record<EstadoReserva, Tono> = {
  confirmada: "azul",
  atendida: "verde",
  cancelada: "rojo",
  "no-llego": "gris",
};
const ESTADO_LABEL: Record<EstadoReserva, string> = {
  confirmada: "Confirmada",
  atendida: "Atendida",
  cancelada: "Cancelada",
  "no-llego": "No llegó",
};
const HORAS = ["12:30", "13:00", "13:30", "19:00", "19:30", "20:00", "20:30"];

export default function ReservasPage() {
  const { usuario, negocio } = useApp();
  const [busqueda, setBusqueda] = useState("");
  const [filtro, setFiltro] = useState<EstadoReserva | "todas">("todas");
  const [formAbierto, setFormAbierto] = useState(false);
  const { autorizadas, autorizar, listo: listoAutorizaciones } = useAutorizaciones();
  const { items: creadas, add: agregarReserva } = useReservasCreadas();

  const todas = useMemo(
    () => [...creadas.filter((r) => r.negocioId === negocio.id), ...reservasPorNegocio(negocio.id)],
    [creadas, negocio.id]
  );
  const filtradas = useMemo(() => {
    let items = todas;
    if (filtro !== "todas") items = items.filter((r) => r.estado === filtro);
    const q = busqueda.trim().toLowerCase();
    if (q) items = items.filter((r) => r.clienteNombre.toLowerCase().includes(q));
    return items;
  }, [todas, filtro, busqueda]);

  if (!usuario) return null;

  if (!negocio.operando) {
    return (
      <>
        <Topbar titulo="Reservas" descripcion={negocio.nombre} />
        <main className="flex-1 p-8">
          <Card><EmptyState icon={<CalendarCheck size={22} />} title="Este negocio aún no opera" description="Mamina Restobar no tiene reservas todavía — no hay fecha de apertura definida." /></Card>
        </main>
      </>
    );
  }

  const semana = reservasSemana(negocio.id);
  const conversion = tasaConversionReservas(negocio.id);

  function exportar() {
    exportarCSV(
      `reservas-${negocio.id}`,
      ["Cliente", "Fecha", "Hora", "Personas", "Tipo", "Canal", "Estado", "Monto"],
      filtradas.map((r) => [r.clienteNombre, r.fecha, r.hora, r.personas, r.tipo, r.canal, r.estado, r.monto ?? ""])
    );
  }

  return (
    <>
      <Topbar titulo="Reservas" descripcion={`${negocio.nombre} · simulado, pendiente de conexión real a la web`} />
      <main className="flex-1 p-8 animate-fade-in space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatTile label="Reservas esta semana" value={semana.total} icon={<CalendarCheck size={18} />} tono="terracota" />
          <StatTile label="Confirmadas / atendidas" value={semana.confirmadas} icon={<CheckCircle2 size={18} />} tono="verde" />
          <StatTile label="Tasa de conversión" value={`${conversion}%`} icon={<XCircle size={18} />} tono="naranja" />
        </div>

        {formAbierto && (
          <NuevaReservaForm
            negocioId={negocio.id}
            registradoPor={usuario.nombre}
            onCancelar={() => setFormAbierto(false)}
            onGuardar={(r) => { agregarReserva(r); setFormAbierto(false); }}
          />
        )}

        <div className="flex flex-wrap items-center gap-3 justify-between">
          <div className="flex gap-1.5 flex-wrap">
            {(["todas", "confirmada", "atendida", "cancelada", "no-llego"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFiltro(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  filtro === f ? "bg-[var(--color-terracota)] text-white" : "bg-white border border-[var(--color-gris-claro)]/50 text-[var(--color-gris-medio)]"
                }`}
              >
                {f === "todas" ? "Todas" : ESTADO_LABEL[f]}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <SearchInput value={busqueda} onChange={setBusqueda} placeholder="Buscar cliente…" />
            {puedeCrearReservasDelivery(usuario.rolTipo) && !formAbierto && (
              <button
                onClick={() => setFormAbierto(true)}
                className="flex items-center gap-2 bg-[var(--color-terracota)] text-white text-sm font-semibold rounded-xl px-4 py-2.5 hover:opacity-90 transition-opacity whitespace-nowrap"
              >
                <Plus size={15} /> Nueva reserva
              </button>
            )}
            <button onClick={exportar} className="flex items-center gap-2 bg-[var(--color-verde)] text-white text-sm font-semibold rounded-xl px-4 py-2.5 hover:opacity-90 transition-opacity whitespace-nowrap">
              <Download size={15} /> Exportar
            </button>
          </div>
        </div>

        <Card padding="p-0 pt-5">
          <Table>
            <Thead>
              <Th>Cliente</Th><Th>Fecha</Th><Th>Hora</Th><Th>Personas</Th><Th>Tipo</Th><Th>Canal</Th><Th>Estado</Th><Th>Monto</Th><Th>Autorización</Th><Th>{" "}</Th>
            </Thead>
            <tbody>
              {filtradas.map((r) => {
                const necesitaAutorizacion = r.requiereAutorizacion && r.estado !== "cancelada" && r.estado !== "no-llego";
                const autorizada = autorizadas.has(r.id);
                return (
                  <Tr key={r.id}>
                    <Td className="font-medium">{r.clienteNombre}</Td>
                    <Td>{new Date(r.fecha).toLocaleDateString("es-PE")}</Td>
                    <Td>{r.hora}</Td>
                    <Td>{r.personas}</Td>
                    <Td className="capitalize">{r.tipo}</Td>
                    <Td className="capitalize">{r.canal}</Td>
                    <Td><Badge tono={ESTADO_TONO[r.estado]}>{ESTADO_LABEL[r.estado]}</Badge></Td>
                    <Td>{r.monto ? `S/ ${r.monto}` : "—"}</Td>
                    <Td>
                      {!necesitaAutorizacion ? (
                        <span className="text-[var(--color-gris-medio)] text-xs">—</span>
                      ) : autorizada ? (
                        <Badge tono="verde"><ShieldCheck size={11} /> Autorizada</Badge>
                      ) : puedeAutorizar(usuario.rolTipo) ? (
                        <button
                          onClick={() => listoAutorizaciones && autorizar(r.id)}
                          className="text-xs font-semibold bg-[var(--color-terracota)] text-white rounded-lg px-2.5 py-1 hover:opacity-90 transition-opacity"
                        >
                          Autorizar
                        </button>
                      ) : (
                        <Badge tono="naranja">Pendiente de Gerencial</Badge>
                      )}
                    </Td>
                    <Td>
                      {r.enviadoAWeb && (
                        <span title="Enviado a la web de Las Flores" className="inline-flex items-center gap-1 text-[10px] font-semibold text-[var(--color-azul)]">
                          <Globe2 size={12} /> Web
                        </span>
                      )}
                    </Td>
                  </Tr>
                );
              })}
            </tbody>
          </Table>
          {filtradas.length === 0 && <p className="text-center text-sm text-[var(--color-gris-medio)] py-10">Sin resultados.</p>}
        </Card>
      </main>
    </>
  );
}

function NuevaReservaForm({
  negocioId, registradoPor, onGuardar, onCancelar,
}: {
  negocioId: string; registradoPor: string; onGuardar: (r: Reserva) => void; onCancelar: () => void;
}) {
  const [clienteNombre, setClienteNombre] = useState("");
  const [celular, setCelular] = useState("");
  const [fecha, setFecha] = useState("");
  const [hora, setHora] = useState(HORAS[3]);
  const [personas, setPersonas] = useState(2);
  const [canal, setCanal] = useState<Reserva["canal"]>("telefono");
  const [errores, setErrores] = useState<Errores>({});

  function validar(): Errores {
    const err: Errores = {};
    const eNombre = nombrePersona(clienteNombre, "El nombre del cliente");
    if (eNombre) err.clienteNombre = eNombre;
    const eCelular = celularPeru(celular);
    if (eCelular) err.celular = eCelular;
    const eFecha = requerido(fecha, "La fecha");
    if (eFecha) err.fecha = eFecha;
    return err;
  }

  function guardar(e: React.FormEvent) {
    e.preventDefault();
    const err = validar();
    setErrores(err);
    if (Object.keys(err).length > 0) return;
    const tipo: Reserva["tipo"] = personas > 8 ? "evento" : "mesa";
    onGuardar({
      id: `${negocioId}-res-manual-${Date.now()}`,
      negocioId: negocioId as Reserva["negocioId"],
      clienteId: `manual-${Date.now()}`,
      clienteNombre: clienteNombre.trim(),
      fecha,
      hora,
      personas,
      tipo,
      canal,
      estado: "confirmada",
      registradoEn: new Date().toISOString(),
      requiereAutorizacion: tipo === "evento",
      registradoPor,
      enviadoAWeb: true,
    });
  }

  return (
    <Card className="animate-fade-in">
      <div className="flex items-center justify-between mb-1">
        <CardHeader title="Nueva reserva" subtitle="Al guardar se marca como enviada a la web de Las Flores" />
        <button onClick={onCancelar} className="text-[var(--color-gris-medio)] hover:text-[var(--color-gris)]">
          <X size={18} />
        </button>
      </div>
      <form onSubmit={guardar} noValidate className="grid sm:grid-cols-2 gap-3">
        <Campo label="Nombre del cliente" requerido error={errores.clienteNombre}>
          <input value={clienteNombre} onChange={(e) => setClienteNombre(soloLetras(e.target.value))} className="input" />
        </Campo>
        <Campo label="Celular" requerido error={errores.celular}>
          <input value={celular} onChange={(e) => setCelular(e.target.value.replace(/\D/g, "").slice(0, 9))} maxLength={9} inputMode="numeric" placeholder="9XXXXXXXX" className="input" />
        </Campo>
        <Campo label="Fecha" requerido error={errores.fecha}>
          <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className="input" />
        </Campo>
        <Campo label="Hora" requerido>
          <select value={hora} onChange={(e) => setHora(e.target.value)} className="input bg-white">
            {HORAS.map((h) => <option key={h} value={h}>{h}</option>)}
          </select>
        </Campo>
        <Campo label="Personas" requerido>
          <input
            type="number" min={1} max={40} value={personas}
            onChange={(e) => setPersonas(Math.max(1, Number(e.target.value)))}
            className="input"
          />
          {personas > 8 && (
            <p className="text-[11px] text-[var(--color-naranja)] mt-1">Más de 8 personas: queda como evento, necesita autorización de Gerencial.</p>
          )}
        </Campo>
        <Campo label="Canal">
          <select value={canal} onChange={(e) => setCanal(e.target.value as Reserva["canal"])} className="input bg-white">
            <option value="telefono">Teléfono</option>
            <option value="whatsapp">WhatsApp</option>
            <option value="web">Web</option>
            <option value="presencial">Presencial</option>
          </select>
        </Campo>
        <div className="sm:col-span-2 flex justify-end gap-2 pt-1">
          <button type="button" onClick={onCancelar} className="text-sm font-medium text-[var(--color-gris-medio)] px-4 py-2">Cancelar</button>
          <button type="submit" className="bg-[var(--color-terracota)] text-white text-sm font-semibold rounded-xl px-5 py-2.5 hover:opacity-90 transition-opacity">Guardar reserva</button>
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
