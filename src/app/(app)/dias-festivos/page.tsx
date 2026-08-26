"use client";

import { useState } from "react";
import Link from "next/link";
import { Lock, PartyPopper, Plus, Pencil, Trash2, X, Megaphone } from "lucide-react";
import { useApp } from "@/lib/app-context";
import { accesoA } from "@/lib/permissions";
import { Topbar } from "@/components/layout/Topbar";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { useFestividades } from "@/lib/store";
import { proximaFecha } from "@/lib/mock/festividades";
import { BASE_DATE } from "@/lib/mock/seed";
import { NEGOCIOS } from "@/lib/mock/negocios";
import { requerido, Errores } from "@/lib/validacion";
import { Festividad, TipoFestividad, NegocioId } from "@/lib/types";

const TIPO_LABEL: Record<TipoFestividad, string> = { religioso: "Religioso", civico: "Cívico", comercial: "Comercial" };
const TIPO_TONO: Record<TipoFestividad, "azul" | "verde" | "naranja"> = { religioso: "azul", civico: "verde", comercial: "naranja" };
const MESES_LABEL = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Setiembre", "Octubre", "Noviembre", "Diciembre"];

export default function DiasFestivosPage() {
  const { usuario, negocio } = useApp();
  const [formAbierto, setFormAbierto] = useState(false);
  const [editando, setEditando] = useState<Festividad | null>(null);
  const { festividades, add, update, remove, listo } = useFestividades();

  if (!usuario) return null;
  const nivel = accesoA(usuario.rolTipo, "diasFestivos");

  if (nivel === "no") {
    return (
      <>
        <Topbar titulo="Días Festivos" descripcion={negocio.nombre} />
        <main className="flex-1 p-8">
          <Card>
            <EmptyState icon={<Lock size={22} />} title="Este módulo no está disponible para tu rol" description="Días Festivos lo gestiona Gerencial." />
          </Card>
        </main>
      </>
    );
  }

  if (!listo) return null;

  const ordenadas = [...festividades]
    .map((f) => ({ f, ...proximaFecha(f.mesDia, BASE_DATE) }))
    .sort((a, b) => a.diffDias - b.diffDias);

  return (
    <>
      <Topbar titulo="Días Festivos" descripcion="Fechas comerciales, religiosas y cívicas del grupo" />
      <main className="flex-1 p-8 animate-fade-in space-y-5">
        {(formAbierto || editando) && (
          <FestividadForm
            festividad={editando}
            onCancelar={() => { setFormAbierto(false); setEditando(null); }}
            onGuardar={(f) => {
              if (editando) update(editando.id, f);
              else add({ ...f, id: `fest-manual-${Date.now()}` });
              setFormAbierto(false);
              setEditando(null);
            }}
          />
        )}

        <div className="flex justify-end">
          {!formAbierto && !editando && (
            <button
              onClick={() => setFormAbierto(true)}
              className="flex items-center gap-2 bg-[var(--color-terracota)] text-white text-sm font-semibold rounded-xl px-4 py-2.5 hover:opacity-90 transition-opacity"
            >
              <Plus size={15} /> Nueva fecha
            </button>
          )}
        </div>

        <Card padding="p-0 pt-5">
          <div className="px-5">
            <CardHeader title="Todas las fechas" subtitle={`${ordenadas.length} registradas — ordenadas por la más próxima`} />
          </div>
          <div className="divide-y divide-[var(--color-gris-claro)]/20">
            {ordenadas.map(({ f, fecha, diffDias }) => (
              <div key={f.id} className="flex items-center gap-4 px-5 py-3.5">
                <div className="w-14 h-14 rounded-xl bg-[var(--color-crema)] flex flex-col items-center justify-center shrink-0">
                  <span className="text-[10px] font-bold uppercase text-[var(--color-terracota)]">{MESES_LABEL[fecha.getMonth()].slice(0, 3)}</span>
                  <span className="text-base font-bold text-[var(--color-gris)] leading-none">{fecha.getDate()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--color-gris)]">{f.nombre}</p>
                  <p className="text-xs text-[var(--color-gris-medio)] mt-0.5">
                    {f.alcance === "todas" ? "Todos los negocios" : f.alcance.map((id) => NEGOCIOS.find((n) => n.id === id)?.nombre ?? id).join(", ")}
                    {f.descripcion ? ` · ${f.descripcion}` : ""}
                  </p>
                </div>
                <Badge tono={TIPO_TONO[f.tipo]}>{TIPO_LABEL[f.tipo]}</Badge>
                <Badge tono={diffDias <= 7 ? "naranja" : "gris"}>{diffDias === 0 ? "Hoy" : `En ${diffDias} días`}</Badge>
                <Link
                  href={`/campanas?festividad=${f.id}&nombre=${encodeURIComponent(f.nombre)}`}
                  title="Crear campaña para esta fecha"
                  className="p-1.5 rounded-lg hover:bg-[var(--color-crema)] text-[var(--color-terracota)]"
                >
                  <Megaphone size={15} />
                </Link>
                <button onClick={() => setEditando(f)} className="p-1.5 rounded-lg hover:bg-[var(--color-crema)] text-[var(--color-gris-medio)]">
                  <Pencil size={13} />
                </button>
                <button onClick={() => remove(f.id)} className="p-1.5 rounded-lg hover:bg-[var(--color-rojo-claro)] text-[var(--color-rojo)]">
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
            {ordenadas.length === 0 && (
              <p className="text-center text-sm text-[var(--color-gris-medio)] py-10">
                <PartyPopper size={20} className="mx-auto mb-2 text-[var(--color-gris-claro)]" />
                Sin fechas registradas todavía.
              </p>
            )}
          </div>
        </Card>
      </main>
    </>
  );
}

function FestividadForm({
  festividad, onGuardar, onCancelar,
}: {
  festividad: Festividad | null; onGuardar: (f: Omit<Festividad, "id">) => void; onCancelar: () => void;
}) {
  const [nombre, setNombre] = useState(festividad?.nombre ?? "");
  const [mes, setMes] = useState(festividad ? Number(festividad.mesDia.split("-")[0]) : 1);
  const [dia, setDia] = useState(festividad ? Number(festividad.mesDia.split("-")[1]) : 1);
  const [tipo, setTipo] = useState<TipoFestividad>(festividad?.tipo ?? "comercial");
  const [alcanceTodas, setAlcanceTodas] = useState(festividad ? festividad.alcance === "todas" : true);
  const [negociosElegidos, setNegociosElegidos] = useState<NegocioId[]>(
    festividad && festividad.alcance !== "todas" ? festividad.alcance : []
  );
  const [descripcion, setDescripcion] = useState(festividad?.descripcion ?? "");
  const [errores, setErrores] = useState<Errores>({});

  function toggleNegocio(id: NegocioId) {
    setNegociosElegidos((prev) => (prev.includes(id) ? prev.filter((n) => n !== id) : [...prev, id]));
  }

  function validar(): Errores {
    const err: Errores = {};
    const eNombre = requerido(nombre, "El nombre");
    if (eNombre) err.nombre = eNombre;
    if (!alcanceTodas && negociosElegidos.length === 0) err.alcance = "Elige al menos un negocio.";
    return err;
  }

  function guardar(e: React.FormEvent) {
    e.preventDefault();
    const err = validar();
    setErrores(err);
    if (Object.keys(err).length > 0) return;
    const pad = (n: number) => String(n).padStart(2, "0");
    onGuardar({
      nombre: nombre.trim(),
      mesDia: `${pad(mes)}-${pad(dia)}`,
      tipo,
      alcance: alcanceTodas ? "todas" : negociosElegidos,
      descripcion: descripcion.trim() || undefined,
    });
  }

  return (
    <Card className="animate-fade-in">
      <div className="flex items-center justify-between mb-1">
        <CardHeader title={festividad ? "Editar fecha" : "Nueva fecha"} />
        <button onClick={onCancelar} className="text-[var(--color-gris-medio)] hover:text-[var(--color-gris)]">
          <X size={18} />
        </button>
      </div>
      <form onSubmit={guardar} noValidate className="grid sm:grid-cols-2 gap-3">
        <div className="sm:col-span-2">
          <Campo label="Nombre" requerido error={errores.nombre}>
            <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej. Día del Trabajo" className="input" />
          </Campo>
        </div>
        <Campo label="Mes" requerido>
          <select value={mes} onChange={(e) => setMes(Number(e.target.value))} className="input bg-white">
            {MESES_LABEL.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
          </select>
        </Campo>
        <Campo label="Día" requerido>
          <input type="number" min={1} max={31} value={dia} onChange={(e) => setDia(Math.min(31, Math.max(1, Number(e.target.value))))} className="input" />
        </Campo>
        <Campo label="Tipo">
          <select value={tipo} onChange={(e) => setTipo(e.target.value as TipoFestividad)} className="input bg-white">
            <option value="comercial">Comercial</option>
            <option value="religioso">Religioso</option>
            <option value="civico">Cívico</option>
          </select>
        </Campo>
        <Campo label="Descripción (opcional)">
          <input value={descripcion} onChange={(e) => setDescripcion(e.target.value)} className="input" />
        </Campo>
        <div className="sm:col-span-2">
          <label className="block text-xs font-semibold text-[var(--color-gris-medio)] mb-1.5">Alcance</label>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setAlcanceTodas(true)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${alcanceTodas ? "bg-[var(--color-terracota)] text-white" : "bg-white border border-[var(--color-gris-claro)]/50 text-[var(--color-gris-medio)]"}`}
            >
              Todos los negocios
            </button>
            {NEGOCIOS.map((n) => (
              <button
                key={n.id}
                type="button"
                onClick={() => { setAlcanceTodas(false); toggleNegocio(n.id); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  !alcanceTodas && negociosElegidos.includes(n.id) ? "bg-[var(--color-terracota)] text-white" : "bg-white border border-[var(--color-gris-claro)]/50 text-[var(--color-gris-medio)]"
                }`}
              >
                {n.nombre}
              </button>
            ))}
          </div>
          {errores.alcance && <p className="text-[11px] text-[var(--color-rojo)] mt-1 font-medium">{errores.alcance}</p>}
        </div>
        <div className="sm:col-span-2 flex justify-end gap-2 pt-1">
          <button type="button" onClick={onCancelar} className="text-sm font-medium text-[var(--color-gris-medio)] px-4 py-2">Cancelar</button>
          <button type="submit" className="bg-[var(--color-terracota)] text-white text-sm font-semibold rounded-xl px-5 py-2.5 hover:opacity-90 transition-opacity">Guardar</button>
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
