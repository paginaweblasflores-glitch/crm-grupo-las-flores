"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Lock, Megaphone, Send, Percent, Plus, X, Pencil, Trash2 } from "lucide-react";
import { useApp } from "@/lib/app-context";
import { accesoA, puedeGestionarCampanas } from "@/lib/permissions";
import { Topbar } from "@/components/layout/Topbar";
import { Card, CardHeader } from "@/components/ui/Card";
import { StatTile } from "@/components/ui/StatTile";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge } from "@/components/ui/Badge";
import { campanasPorNegocio } from "@/lib/mock/campanas";
import { clientesIndividualesPorNegocio, corporativosPorNegocio } from "@/lib/mock/clientes";
import { BASE_DATE } from "@/lib/mock/seed";
import { useCampanasCreadas } from "@/lib/store";
import { requerido, Errores } from "@/lib/validacion";
import { Campana, NegocioId } from "@/lib/types";
import dynamic from "next/dynamic";
const BarChartSerie = dynamic(() => import("@/components/charts/BarChartSerie").then((m) => m.BarChartSerie), { ssr: false, loading: () => <div className="h-[220px]" /> });
const DonutChart = dynamic(() => import("@/components/charts/DonutChart").then((m) => m.DonutChart), { ssr: false, loading: () => <div className="h-[220px]" /> });

const MESES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Setiembre", "Octubre", "Noviembre", "Diciembre"];
const CANAL_LABEL: Record<string, string> = { whatsapp: "WhatsApp", instagram: "Instagram", facebook: "Facebook" };
const PUBLICO_LABEL: Record<string, string> = { todos: "Todos los clientes", natural: "Clientes naturales", corporativo: "Clientes corporativos" };

export default function CampanasPage() {
  return (
    <Suspense fallback={null}>
      <CampanasInner />
    </Suspense>
  );
}

function CampanasInner() {
  const { usuario, negocio } = useApp();
  const searchParams = useSearchParams();
  const festividadId = searchParams.get("festividad");
  const nombreSugerido = searchParams.get("nombre");
  const [formAbierto, setFormAbierto] = useState(Boolean(festividadId));
  const [editando, setEditando] = useState<Campana | null>(null);
  const { items: creadas, add: agregarCampana, update: editarCampana, remove: eliminarCampana } = useCampanasCreadas();

  if (!usuario) return null;
  const nivel = accesoA(usuario.rolTipo, "campanas");
  const puedeGestionar = puedeGestionarCampanas(usuario.rolTipo);

  if (nivel === "no") {
    return (
      <>
        <Topbar titulo="Campañas" descripcion={negocio.nombre} />
        <main className="flex-1 p-8">
          <Card>
            <EmptyState
              icon={<Lock size={22} />}
              title="Este módulo no está disponible para tu rol"
              description="Campañas las gestiona Gerencial — tu equipo puede verlas, no crearlas ni editarlas."
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

  const campanas = [...campanasPorNegocio(negocio.id), ...creadas.filter((c) => c.negocioId === negocio.id)];
  const totalEnviados = campanas.reduce((a, c) => a + c.enviados, 0);
  const totalClientesBase = campanas.reduce((a, c) => a + c.totalClientes, 0);
  const alcancePromedio = totalClientesBase ? Math.round((totalEnviados / totalClientesBase) * 100) : 0;
  const serie = campanas.map((c) => ({ mes: c.mes, enviados: c.enviados, total: c.totalClientes }));
  const porCanal: Record<string, number> = {};
  campanas.forEach((c) => { porCanal[c.canal] = (porCanal[c.canal] ?? 0) + 1; });
  const distribucionCanal = Object.entries(porCanal).map(([canal, valor]) => ({ nombre: CANAL_LABEL[canal] ?? canal, valor }));

  return (
    <>
      <Topbar titulo="Campañas" descripcion={`${negocio.nombre} · promociones y catálogos mensuales`} />
      <main className="flex-1 p-8 animate-fade-in space-y-6" id="reporte">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatTile label="Campañas del año" value={campanas.length} icon={<Megaphone size={18} />} tono="terracota" />
          <StatTile label="Total de envíos" value={totalEnviados} icon={<Send size={18} />} tono="azul" />
          <StatTile label="Alcance promedio" value={`${alcancePromedio}%`} icon={<Percent size={18} />} tono="verde" />
        </div>

        {(formAbierto || editando) && (
          <CampanaForm
            negocioId={negocio.id}
            registradoPor={usuario.nombre}
            campana={editando}
            nombreInicial={!editando ? nombreSugerido ?? undefined : undefined}
            festividadId={!editando ? festividadId ?? undefined : undefined}
            onCancelar={() => { setFormAbierto(false); setEditando(null); }}
            onGuardar={(c) => {
              if (editando) editarCampana((x) => x.id === c.id, () => c);
              else agregarCampana(c);
              setFormAbierto(false);
              setEditando(null);
            }}
          />
        )}

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
          <Card className="xl:col-span-2 romper-pagina">
            <CardHeader title="Control mensual" subtitle="Enviados vs. base de clientes, por campaña" />
            <BarChartSerie
              data={serie}
              series={[{ key: "enviados", nombre: "Enviados", color: "#8C3A25" }, { key: "total", nombre: "Base de clientes", color: "#B8AFA6" }]}
            />
          </Card>
          <Card className="romper-pagina">
            <CardHeader title="Canal más usado" subtitle="Campañas por canal" />
            <DonutChart data={distribucionCanal} />
          </Card>
        </div>

        <Card>
          <div className="flex items-center justify-between mb-3">
            <CardHeader title="Campañas" subtitle="Catálogos y promociones del año" />
            {puedeGestionar && !formAbierto && !editando && (
              <button
                onClick={() => setFormAbierto(true)}
                className="flex items-center gap-2 bg-[var(--color-terracota)] text-white text-sm font-semibold rounded-xl px-4 py-2.5 hover:opacity-90 transition-opacity whitespace-nowrap shrink-0"
              >
                <Plus size={15} /> Nueva campaña
              </button>
            )}
          </div>
          <div className="space-y-3">
            {campanas.map((c) => {
              const pct = Math.round((c.enviados / c.totalClientes) * 100);
              const esPropia = Boolean(c.registradoPor);
              return (
                <div key={c.id} className="flex items-center gap-4 py-2">
                  <div className="w-32 shrink-0">
                    <p className="text-sm font-medium text-[var(--color-gris)]">{c.nombre || c.mes}</p>
                    <Badge tono="gris">{CANAL_LABEL[c.canal] ?? c.canal}</Badge>
                  </div>
                  <div className="flex-1">
                    <div className="h-2.5 rounded-full bg-[var(--color-crema-oscuro)] overflow-hidden">
                      <div className="h-full rounded-full bg-[var(--color-terracota)] transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                  <div className="w-28 shrink-0 text-right text-xs text-[var(--color-gris-medio)]">
                    {c.enviados}/{c.totalClientes} enviados
                  </div>
                  {puedeGestionar && esPropia && (
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => setEditando(c)} className="p-1.5 rounded-lg hover:bg-[var(--color-crema)] text-[var(--color-gris-medio)]">
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={() => eliminarCampana((x) => x.id === c.id)}
                        className="p-1.5 rounded-lg hover:bg-[var(--color-rojo-claro)] text-[var(--color-rojo)]"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      </main>
    </>
  );
}

function CampanaForm({
  negocioId, registradoPor, campana, nombreInicial, festividadId, onGuardar, onCancelar,
}: {
  negocioId: NegocioId; registradoPor: string; campana: Campana | null;
  nombreInicial?: string; festividadId?: string;
  onGuardar: (c: Campana) => void; onCancelar: () => void;
}) {
  const [nombre, setNombre] = useState(campana?.nombre ?? nombreInicial ?? "");
  const [mes, setMes] = useState(campana?.mes ?? MESES[BASE_DATE.getMonth()]);
  const [canal, setCanal] = useState<Campana["canal"]>(campana?.canal ?? "whatsapp");
  const [publico, setPublico] = useState<NonNullable<Campana["publico"]>>(campana?.publico ?? "todos");
  const [mensaje, setMensaje] = useState(campana?.mensaje ?? "");
  const [errores, setErrores] = useState<Errores>({});

  const totalClientesPara = (p: Campana["publico"]) => {
    const individuales = clientesIndividualesPorNegocio(negocioId).length;
    const corporativos = corporativosPorNegocio(negocioId).length;
    if (p === "natural") return individuales;
    if (p === "corporativo") return corporativos;
    return individuales + corporativos;
  };

  function validar(): Errores {
    const err: Errores = {};
    const eNombre = requerido(nombre, "El nombre de la campaña");
    if (eNombre) err.nombre = eNombre;
    const eMensaje = requerido(mensaje, "El mensaje");
    if (eMensaje) err.mensaje = eMensaje;
    return err;
  }

  function guardar(e: React.FormEvent) {
    e.preventDefault();
    const err = validar();
    setErrores(err);
    if (Object.keys(err).length > 0) return;
    const total = totalClientesPara(publico);
    onGuardar({
      id: campana?.id ?? `${negocioId}-camp-manual-${Date.now()}`,
      negocioId,
      nombre: nombre.trim(),
      mes,
      totalClientes: total,
      enviados: total, // "Enviar" es simulado — se marca enviada a toda la base elegida
      canal,
      mensaje: mensaje.trim(),
      publico,
      registradoPor,
      festividadId: campana?.festividadId ?? festividadId,
    });
  }

  return (
    <Card className="animate-fade-in">
      <div className="flex items-center justify-between mb-1">
        <CardHeader title={campana ? "Editar campaña" : "Nueva campaña"} subtitle="El envío es simulado — no sale un mensaje real" />
        <button onClick={onCancelar} className="text-[var(--color-gris-medio)] hover:text-[var(--color-gris)]">
          <X size={18} />
        </button>
      </div>
      <form onSubmit={guardar} noValidate className="grid sm:grid-cols-2 gap-3">
        <Campo label="Nombre de la campaña" requerido error={errores.nombre}>
          <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej. Promoción de temporada" className="input" />
        </Campo>
        <Campo label="Mes">
          <select value={mes} onChange={(e) => setMes(e.target.value)} className="input bg-white">
            {MESES.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </Campo>
        <Campo label="Canal">
          <select value={canal} onChange={(e) => setCanal(e.target.value as Campana["canal"])} className="input bg-white">
            <option value="whatsapp">WhatsApp</option>
            <option value="instagram">Instagram</option>
            <option value="facebook">Facebook</option>
          </select>
        </Campo>
        <Campo label="Público objetivo">
          <select value={publico} onChange={(e) => setPublico(e.target.value as NonNullable<Campana["publico"]>)} className="input bg-white">
            <option value="todos">{PUBLICO_LABEL.todos}</option>
            <option value="natural">{PUBLICO_LABEL.natural}</option>
            <option value="corporativo">{PUBLICO_LABEL.corporativo}</option>
          </select>
        </Campo>
        <div className="sm:col-span-2">
          <Campo label="Mensaje" requerido error={errores.mensaje}>
            <textarea value={mensaje} onChange={(e) => setMensaje(e.target.value)} rows={3} placeholder="Escribe el mensaje de la campaña…" className="input" />
          </Campo>
        </div>
        <div className="sm:col-span-2 flex justify-end gap-2 pt-1">
          <button type="button" onClick={onCancelar} className="text-sm font-medium text-[var(--color-gris-medio)] px-4 py-2">Cancelar</button>
          <button type="submit" className="bg-[var(--color-terracota)] text-white text-sm font-semibold rounded-xl px-5 py-2.5 hover:opacity-90 transition-opacity">
            {campana ? "Guardar cambios" : "Crear y enviar campaña"}
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
