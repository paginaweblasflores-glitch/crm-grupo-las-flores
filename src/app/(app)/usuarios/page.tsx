"use client";

import { useState } from "react";
import { Lock, UserPlus, ShieldCheck } from "lucide-react";
import { useApp } from "@/lib/app-context";
import { accesoA } from "@/lib/permissions";
import { Topbar } from "@/components/layout/Topbar";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { RolTipo, Usuario, NegocioId } from "@/lib/types";
import { requerido, Errores } from "@/lib/validacion";

const ROLES_LABEL: Record<Exclude<RolTipo, "direccion">, string> = {
  ventas: "Ventas",
  administracion: "Administración",
};

// Cargos sugeridos según el rol y el tipo de negocio — evita texto libre para
// lo más común, pero deja "Otro" para casos puntuales.
function cargosSugeridos(rolTipo: RolTipo, negocioId: NegocioId): string[] {
  if (rolTipo === "administracion") {
    return ["Administrador/a de sede", "Gerente de sede", "Supervisor/a"];
  }
  if (negocioId === "umaru") {
    return ["Recepcionista", "Conserje", "Botones", "Vendedor/a"];
  }
  return ["Vendedor/a", "Anfitrión/a", "Mesero/a", "Cajero/a"];
}
const CARGO_OTRO = "Otro (especificar)";

export default function UsuariosPage() {
  const { usuario, usuarios, negocios, crearUsuario: agregarUsuario } = useApp();

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
              title="Solo Administración crea usuarios"
              description="Mijael delega esto en Betsy — Dirección no administra cuentas del equipo directamente."
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
      agregarUsuario={agregarUsuario}
      negocioPropio={usuario.negocioId}
      rolCreador={usuario.rolTipo}
    />
  );
}

function UsuariosContenido({
  usuarioId, usuarios, negocios, agregarUsuario, negocioPropio, rolCreador,
}: {
  usuarioId: string;
  usuarios: Usuario[];
  negocios: { id: NegocioId; nombre: string; operando: boolean }[];
  agregarUsuario: (u: Usuario) => void;
  negocioPropio: NegocioId;
  rolCreador: RolTipo;
}) {
  // Mijael (Dirección) solo abre cuentas de Administración — es quien le da
  // el primer administrador a un negocio nuevo. De ahí en adelante, ese
  // administrador crea al resto de su equipo (Ventas y otros administradores).
  const rolesCreables: RolTipo[] = rolCreador === "direccion" ? ["administracion"] : ["ventas", "administracion"];
  const [filtroNegocio, setFiltroNegocio] = useState<NegocioId>(negocioPropio);
  const [form, setForm] = useState({
    nombre: "", cargo: "", cargoOtro: "", usuarioLogin: "", contrasena: "",
    rolTipo: rolesCreables[0], negocioId: rolCreador === "direccion" ? negocios.find((n) => n.id !== negocioPropio)?.id ?? negocioPropio : negocioPropio,
  });
  const [errores, setErrores] = useState<Errores>({});
  const [mensaje, setMensaje] = useState<string | null>(null);

  const equipo = usuarios.filter((u) => u.rolTipo !== "direccion" && u.negocioId === filtroNegocio);
  const negocioForm = negocios.find((n) => n.id === form.negocioId);
  const opcionesCargo = cargosSugeridos(form.rolTipo, form.negocioId);
  // Administración solo abre cuentas para su propio negocio (cada negocio es
  // independiente); Dirección puede elegir cualquiera, típicamente para
  // darle su primer administrador a uno nuevo.
  const negociosSeleccionables = rolCreador === "direccion" ? negocios : negocios.filter((n) => n.id === negocioPropio);

  function validar(): Errores {
    const err: Errores = {};
    const eNombre = requerido(form.nombre, "El nombre");
    if (eNombre) err.nombre = eNombre;
    const eUsuario = requerido(form.usuarioLogin, "El usuario de acceso");
    if (eUsuario) err.usuarioLogin = eUsuario;
    else if (usuarios.some((u) => u.usuario.toLowerCase() === form.usuarioLogin.trim().toLowerCase())) {
      err.usuarioLogin = "Ese usuario ya existe — elige otro.";
    }
    if (!form.contrasena) err.contrasena = "La contraseña es obligatoria.";
    else if (form.contrasena.length < 6) err.contrasena = "Debe tener al menos 6 caracteres.";
    const eCargo = requerido(form.cargo, "El cargo");
    if (eCargo) err.cargo = eCargo;
    else if (form.cargo === CARGO_OTRO && !form.cargoOtro.trim()) err.cargo = "Especifica el cargo.";
    return err;
  }

  function crearUsuario(e: React.FormEvent) {
    e.preventDefault();
    const err = validar();
    setErrores(err);
    if (Object.keys(err).length > 0) return;
    const rolLabel = ROLES_LABEL[form.rolTipo as Exclude<RolTipo, "direccion">];
    const nombreNegocio = negocios.find((n) => n.id === form.negocioId)?.nombre ?? "";
    const cargoFinal = form.cargo === CARGO_OTRO ? form.cargoOtro.trim() : form.cargo;
    const nuevo: Usuario = {
      id: `${form.usuarioLogin.trim().toLowerCase()}-${Date.now()}`,
      nombre: form.nombre.trim(),
      cargo: cargoFinal,
      rolTipo: form.rolTipo,
      rolLabel,
      iniciales: form.nombre.trim().split(" ").slice(0, 2).map((p) => p[0]?.toUpperCase()).join(""),
      usuario: form.usuarioLogin.trim(),
      contrasena: form.contrasena,
      negocioId: form.negocioId,
      creadoPor: usuarioId,
    };
    agregarUsuario(nuevo);
    setFiltroNegocio(form.negocioId);
    setForm({ nombre: "", cargo: "", cargoOtro: "", usuarioLogin: "", contrasena: "", rolTipo: rolesCreables[0], negocioId: form.negocioId });
    setErrores({});
    setMensaje(`Cuenta creada para ${nuevo.nombre} en ${nombreNegocio}. Ya puede iniciar sesión con "${nuevo.usuario}".`);
    setTimeout(() => setMensaje(null), 6000);
  }

  return (
    <>
      <Topbar titulo="Usuarios" descripcion="Grupo Las Flores · quién tiene acceso al sistema, negocio por negocio" />
      <main className="flex-1 p-8 animate-fade-in space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-5">
          <Card padding="p-0 pt-5">
            <div className="px-5 flex items-center justify-between flex-wrap gap-3">
              <CardHeader title="Equipo con acceso" subtitle="Filtra por negocio para ver quién tiene cuenta en cada uno" />
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
              {equipo.length === 0 && (
                <p className="text-sm text-[var(--color-gris-medio)] px-5 py-8 text-center">
                  Todavía no hay cuentas creadas para este negocio.
                </p>
              )}
              {equipo.map((u) => (
                <div key={u.id} className="flex items-center gap-3 px-5 py-3.5">
                  <div className="w-9 h-9 rounded-full bg-[var(--color-terracota)] text-white flex items-center justify-center text-xs font-bold shrink-0">
                    {u.iniciales}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--color-gris)]">{u.nombre}</p>
                    <p className="text-xs text-[var(--color-gris-medio)]">Usuario: {u.usuario}</p>
                  </div>
                  <Badge tono={u.rolTipo === "administracion" ? "terracota" : "azul"}>{u.rolLabel}</Badge>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <CardHeader
              title="Crear nueva cuenta"
              subtitle={rolCreador === "direccion"
                ? "Elige el negocio y crea su primer administrador — de ahí en adelante, esa persona arma su propio equipo"
                : "Para el equipo de tu propio negocio"}
            />
            <form onSubmit={crearUsuario} noValidate className="space-y-3">
              <Campo label="Negocio" requerido>
                <select
                  value={form.negocioId}
                  onChange={(e) => setForm((f) => ({ ...f, negocioId: e.target.value as NegocioId, cargo: "", cargoOtro: "" }))}
                  disabled={negociosSeleccionables.length === 1}
                  className="input bg-white disabled:opacity-70"
                >
                  {negociosSeleccionables.map((n) => <option key={n.id} value={n.id}>{n.nombre}</option>)}
                </select>
                {negocioForm && !negocioForm.operando && (
                  <p className="text-[11px] text-[var(--color-naranja)] mt-1">Este negocio todavía no opera — la cuenta queda lista para cuando abra.</p>
                )}
              </Campo>
              <Campo label="Nombre completo" requerido error={errores.nombre}>
                <input value={form.nombre} onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))} className="input" />
              </Campo>
              <Campo label="Rol" requerido>
                <select
                  value={form.rolTipo}
                  onChange={(e) => setForm((f) => ({ ...f, rolTipo: e.target.value as RolTipo, cargo: "", cargoOtro: "" }))}
                  className="input bg-white"
                >
                  {rolesCreables.map((r) => <option key={r} value={r}>{ROLES_LABEL[r as Exclude<RolTipo, "direccion">]}</option>)}
                </select>
                {rolCreador === "direccion" && (
                  <p className="text-[11px] text-[var(--color-gris-medio)] mt-1">
                    Como Dirección, creas el primer administrador de un negocio — el resto del equipo lo arma esa persona.
                  </p>
                )}
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
              <Campo label="Contraseña" requerido error={errores.contrasena}>
                <input type="password" value={form.contrasena} onChange={(e) => setForm((f) => ({ ...f, contrasena: e.target.value }))} className="input" />
              </Campo>
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-1.5 bg-[var(--color-terracota)] text-white text-sm font-semibold rounded-xl py-2.5 hover:opacity-90 transition-opacity"
              >
                <UserPlus size={15} /> Crear cuenta
              </button>
              {mensaje && (
                <p className="text-xs text-[var(--color-verde)] font-medium flex items-center gap-1.5">
                  <ShieldCheck size={13} /> {mensaje}
                </p>
              )}
            </form>
          </Card>
        </div>
      </main>
    </>
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
