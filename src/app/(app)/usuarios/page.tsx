"use client";

import { useState } from "react";
import { Lock, UserPlus, ShieldCheck, Pencil, Trash2, X } from "lucide-react";
import { useApp } from "@/lib/app-context";
import { accesoA } from "@/lib/permissions";
import { Topbar } from "@/components/layout/Topbar";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Usuario, NegocioId } from "@/lib/types";
import { requerido, Errores } from "@/lib/validacion";

// Cargos sugeridos según el tipo de negocio — evita texto libre para lo más
// común, pero deja "Otro" para casos puntuales.
function cargosSugeridos(negocioId: NegocioId): string[] {
  if (negocioId === "umaru") {
    return ["Recepcionista", "Conserje", "Botones", "Vendedor/a"];
  }
  return ["Vendedor/a", "Anfitrión/a", "Mesero/a", "Cajero/a"];
}
const CARGO_OTRO = "Otro (especificar)";

export default function UsuariosPage() {
  const { usuario, usuarios, negocios, crearUsuario, editarUsuario, eliminarUsuario } = useApp();

  if (!usuario) return null;
  const nivel = accesoA(usuario.rolTipo, "usuarios");

  if (nivel === "no") {
    return (
      <>
        <Topbar titulo="Usuarios" descripcion="Grupo Las Flores" />
        <main className="flex-1 p-8">
          <Card>
            <EmptyState
              icon={<Lock size={22} />}
              title="Este módulo no está disponible para tu rol"
              description="Solo Gerencial crea cuentas de Ventas para el equipo."
            />
          </Card>
        </main>
      </>
    );
  }

  return (
    <UsuariosContenido
      usuarioId={usuario.id}
      usuarios={usuarios}
      negocios={negocios}
      crearUsuario={crearUsuario}
      editarUsuario={editarUsuario}
      eliminarUsuario={eliminarUsuario}
    />
  );
}

function UsuariosContenido({
  usuarioId, usuarios, negocios, crearUsuario, editarUsuario, eliminarUsuario,
}: {
  usuarioId: string;
  usuarios: Usuario[];
  negocios: { id: NegocioId; nombre: string; operando: boolean }[];
  crearUsuario: (u: Usuario) => void;
  editarUsuario: (id: string, patch: Partial<Usuario>) => void;
  eliminarUsuario: (id: string) => void;
}) {
  const [filtroNegocio, setFiltroNegocio] = useState<NegocioId>(negocios[0].id);
  const [editando, setEditando] = useState<Usuario | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);

  // Solo las cuentas que se crearon desde este módulo (tienen `creadoPor`) se
  // pueden editar/eliminar — las 5 cuentas base del prototipo son fijas.
  const equipoVisible = usuarios.filter((u) => u.rolTipo === "ventas" && u.negocioId === filtroNegocio);

  function avisar(texto: string) {
    setMensaje(texto);
    setTimeout(() => setMensaje(null), 6000);
  }

  return (
    <>
      <Topbar titulo="Usuarios" descripcion="Grupo Las Flores · crear, editar y eliminar cuentas de Ventas" />
      <main className="flex-1 p-8 animate-fade-in space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-5">
          <Card padding="p-0 pt-5">
            <div className="px-5 flex items-center justify-between flex-wrap gap-3">
              <CardHeader title="Cuentas del equipo" subtitle="Gestiona el acceso de cada persona — el detalle de actividad está en Mi Equipo" />
            </div>
            <div className="px-5 flex gap-1.5 mb-3 flex-wrap">
              {negocios.map((n) => (
                <button
                  key={n.id}
                  onClick={() => setFiltroNegocio(n.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    filtroNegocio === n.id ? "bg-[var(--color-terracota)] text-white" : "bg-[var(--color-crema)] text-[var(--color-gris-medio)]"
                  }`}
                >
                  {n.nombre}
                </button>
              ))}
            </div>
            <div className="divide-y divide-[var(--color-gris-claro)]/20">
              {equipoVisible.length === 0 && (
                <p className="text-sm text-[var(--color-gris-medio)] px-5 py-8 text-center">
                  Todavía no hay cuentas de Ventas para este negocio.
                </p>
              )}
              {equipoVisible.map((u) => {
                const esGestionable = Boolean(u.creadoPor);
                return (
                  <div key={u.id} className="flex items-center gap-3 px-5 py-3.5">
                    <div className="w-9 h-9 rounded-full bg-[var(--color-terracota)] text-white flex items-center justify-center text-xs font-bold shrink-0">
                      {u.iniciales}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[var(--color-gris)]">{u.nombre}</p>
                      <p className="text-xs text-[var(--color-gris-medio)]">{u.cargo} · usuario: {u.usuario}</p>
                    </div>
                    {esGestionable ? (
                      <div className="flex items-center gap-1 shrink-0">
                        <button onClick={() => setEditando(u)} title="Editar cuenta" className="p-1.5 rounded-lg hover:bg-[var(--color-crema)] text-[var(--color-gris-medio)]">
                          <Pencil size={13} />
                        </button>
                        <button
                          onClick={() => { eliminarUsuario(u.id); avisar(`Cuenta de ${u.nombre} eliminada.`); }}
                          title="Eliminar cuenta"
                          className="p-1.5 rounded-lg hover:bg-[var(--color-rojo-claro)] text-[var(--color-rojo)]"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ) : (
                      <Badge tono="gris">Cuenta base</Badge>
                    )}
                  </div>
                );
              })}
            </div>
            {mensaje && (
              <p className="px-5 pb-4 text-xs text-[var(--color-verde)] font-medium flex items-center gap-1.5">
                <ShieldCheck size={13} /> {mensaje}
              </p>
            )}
          </Card>

          <UsuarioForm
            key={editando?.id ?? "nuevo"}
            editando={editando}
            negocios={negocios}
            usuarios={usuarios}
            usuarioId={usuarioId}
            onCancelarEdicion={() => setEditando(null)}
            onCrear={(nuevo, nombreNegocio) => {
              crearUsuario(nuevo);
              setFiltroNegocio(nuevo.negocioId);
              avisar(`Cuenta creada para ${nuevo.nombre} en ${nombreNegocio}. Ya puede iniciar sesión con "${nuevo.usuario}".`);
            }}
            onGuardarEdicion={(id, patch) => {
              editarUsuario(id, patch);
              setEditando(null);
              avisar(`Cuenta de ${patch.nombre} actualizada.`);
            }}
          />
        </div>
      </main>
    </>
  );
}

function UsuarioForm({
  editando, negocios, usuarios, usuarioId, onCrear, onGuardarEdicion, onCancelarEdicion,
}: {
  editando: Usuario | null;
  negocios: { id: NegocioId; nombre: string; operando: boolean }[];
  usuarios: Usuario[];
  usuarioId: string;
  onCrear: (u: Usuario, nombreNegocio: string) => void;
  onGuardarEdicion: (id: string, patch: Partial<Usuario>) => void;
  onCancelarEdicion: () => void;
}) {
  const [form, setForm] = useState({
    nombre: editando?.nombre ?? "",
    cargo: editando?.cargo ?? "",
    cargoOtro: "",
    usuarioLogin: editando?.usuario ?? "",
    contrasena: "",
    negocioId: editando?.negocioId ?? negocios[0].id,
  });
  const [errores, setErrores] = useState<Errores>({});

  const negocioForm = negocios.find((n) => n.id === form.negocioId);
  const opcionesCargo = cargosSugeridos(form.negocioId);
  const esEdicion = Boolean(editando);

  function validar(): Errores {
    const err: Errores = {};
    const eNombre = requerido(form.nombre, "El nombre");
    if (eNombre) err.nombre = eNombre;
    const eUsuario = requerido(form.usuarioLogin, "El usuario de acceso");
    if (eUsuario) err.usuarioLogin = eUsuario;
    else if (usuarios.some((u) => u.id !== editando?.id && u.usuario.toLowerCase() === form.usuarioLogin.trim().toLowerCase())) {
      err.usuarioLogin = "Ese usuario ya existe — elige otro.";
    }
    if (!esEdicion || form.contrasena) {
      if (!form.contrasena) err.contrasena = "La contraseña es obligatoria.";
      else if (form.contrasena.length < 6) err.contrasena = "Debe tener al menos 6 caracteres.";
    }
    const eCargo = requerido(form.cargo, "El cargo");
    if (eCargo) err.cargo = eCargo;
    else if (form.cargo === CARGO_OTRO && !form.cargoOtro.trim()) err.cargo = "Especifica el cargo.";
    return err;
  }

  function guardar(e: React.FormEvent) {
    e.preventDefault();
    const err = validar();
    setErrores(err);
    if (Object.keys(err).length > 0) return;
    const nombreNegocio = negocios.find((n) => n.id === form.negocioId)?.nombre ?? "";
    const cargoFinal = form.cargo === CARGO_OTRO ? form.cargoOtro.trim() : form.cargo;

    if (editando) {
      const patch: Partial<Usuario> = {
        nombre: form.nombre.trim(),
        cargo: cargoFinal,
        iniciales: form.nombre.trim().split(" ").slice(0, 2).map((p) => p[0]?.toUpperCase()).join(""),
        usuario: form.usuarioLogin.trim(),
        negocioId: form.negocioId,
      };
      if (form.contrasena) patch.contrasena = form.contrasena;
      onGuardarEdicion(editando.id, patch);
      return;
    }

    const nuevo: Usuario = {
      id: `${form.usuarioLogin.trim().toLowerCase()}-${Date.now()}`,
      nombre: form.nombre.trim(),
      cargo: cargoFinal,
      rolTipo: "ventas",
      rolLabel: "Ventas",
      iniciales: form.nombre.trim().split(" ").slice(0, 2).map((p) => p[0]?.toUpperCase()).join(""),
      usuario: form.usuarioLogin.trim(),
      contrasena: form.contrasena,
      negocioId: form.negocioId,
      creadoPor: usuarioId,
    };
    onCrear(nuevo, nombreNegocio);
    setForm({ nombre: "", cargo: "", cargoOtro: "", usuarioLogin: "", contrasena: "", negocioId: form.negocioId });
    setErrores({});
  }

  return (
    <Card>
      <div className="flex items-center justify-between mb-1">
        <CardHeader
          title={esEdicion ? "Editar cuenta" : "Crear nueva cuenta de Ventas"}
          subtitle={esEdicion ? undefined : "Para cualquiera de los 3 negocios del grupo"}
        />
        {esEdicion && (
          <button onClick={onCancelarEdicion} className="text-[var(--color-gris-medio)] hover:text-[var(--color-gris)]">
            <X size={18} />
          </button>
        )}
      </div>
      <form onSubmit={guardar} noValidate className="space-y-3">
        <Campo label="Negocio" requerido>
          <select
            value={form.negocioId}
            onChange={(e) => setForm((f) => ({ ...f, negocioId: e.target.value as NegocioId, cargo: "", cargoOtro: "" }))}
            className="input bg-white"
          >
            {negocios.map((n) => <option key={n.id} value={n.id}>{n.nombre}</option>)}
          </select>
          {negocioForm && !negocioForm.operando && (
            <p className="text-[11px] text-[var(--color-naranja)] mt-1">Este negocio todavía no opera — la cuenta queda lista para cuando abra.</p>
          )}
        </Campo>
        <Campo label="Nombre completo" requerido error={errores.nombre}>
          <input value={form.nombre} onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))} className="input" />
        </Campo>
        <Campo label="Cargo" requerido error={errores.cargo}>
          <select
            value={form.cargo}
            onChange={(e) => setForm((f) => ({ ...f, cargo: e.target.value }))}
            className="input bg-white"
          >
            <option value="">Selecciona un cargo…</option>
            {opcionesCargo.map((c) => <option key={c} value={c}>{c}</option>)}
            <option value={CARGO_OTRO}>{CARGO_OTRO}</option>
          </select>
          {form.cargo === CARGO_OTRO && (
            <input
              value={form.cargoOtro}
              onChange={(e) => setForm((f) => ({ ...f, cargoOtro: e.target.value }))}
              placeholder="Escribe el cargo"
              className="input mt-2"
            />
          )}
        </Campo>
        <Campo label="Usuario de acceso" requerido error={errores.usuarioLogin}>
          <input value={form.usuarioLogin} onChange={(e) => setForm((f) => ({ ...f, usuarioLogin: e.target.value }))} className="input" />
        </Campo>
        <Campo label="Contraseña" requerido={!esEdicion} error={errores.contrasena}>
          <input type="password" value={form.contrasena} onChange={(e) => setForm((f) => ({ ...f, contrasena: e.target.value }))} className="input" placeholder={esEdicion ? "Dejar en blanco para no cambiarla" : ""} />
        </Campo>
        <button
          type="submit"
          className="w-full flex items-center justify-center gap-1.5 bg-[var(--color-terracota)] text-white text-sm font-semibold rounded-xl py-2.5 hover:opacity-90 transition-opacity"
        >
          {esEdicion ? <><Pencil size={15} /> Guardar cambios</> : <><UserPlus size={15} /> Crear cuenta</>}
        </button>
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
