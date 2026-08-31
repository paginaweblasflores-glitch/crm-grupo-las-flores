"use client";

import { useState } from "react";
import { Lock, Check, X, Plug, Sparkles } from "lucide-react";
import { useApp } from "@/lib/app-context";
import { accesoA } from "@/lib/permissions";
import { Topbar } from "@/components/layout/Topbar";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge, type Tono } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { CampoContrasena } from "@/components/ui/CampoContrasena";
import { useConfigWhatsAppAPI, useConfigIA, ConfigIA } from "@/lib/store";
import { Errores } from "@/lib/validacion";
import { Usuario } from "@/lib/types";

// Exclusivo de Gerencial (ver permissions.ts) — Dirección y Ventas no
// administran su propia cuenta acá; las cuentas de Ventas las controla
// Gerencial desde Usuarios. Antes cada API vivía escondida dentro del
// módulo que la usa (WhatsApp en Campañas, IA en Estrategias); ahora ambas
// viven acá, un solo lugar para "mi cuenta y las conexiones del sistema"
// — esos módulos solo muestran el estado (conectado o no).
export default function ConfiguracionPage() {
  const { usuario, editarUsuario } = useApp();
  if (!usuario) return null;
  const nivel = accesoA(usuario.rolTipo, "configuracion");

  if (nivel === "no") {
    return (
      <>
        <Topbar titulo="Configuración" descripcion="Grupo Las Flores" />
        <main className="flex-1 p-8">
          <Card>
            <EmptyState
              icon={<Lock size={22} />}
              title="Este módulo no está disponible para tu rol"
              description="Solo Gerencial administra su cuenta y las integraciones — tu contraseña la maneja Gerencial desde Usuarios."
            />
          </Card>
        </main>
      </>
    );
  }

  return (
    <>
      <Topbar titulo="Configuración" descripcion="Tu cuenta y las integraciones del sistema" />
      <main className="flex-1 p-8 animate-fade-in space-y-6">
        <MiPerfil usuario={usuario} editarUsuario={editarUsuario} />

        <div>
          <h2 className="text-sm font-semibold text-[var(--color-gris)]">Integraciones</h2>
          <p className="text-xs text-[var(--color-gris-medio)] mt-0.5">
            Credenciales del negocio — no dependen de una cuenta en particular.
          </p>
        </div>
        <IntegracionWhatsApp />
        <IntegracionIA />
      </main>
    </>
  );
}

function MiPerfil({
  usuario, editarUsuario,
}: {
  usuario: Usuario;
  editarUsuario: (id: string, patch: Partial<Usuario>) => void;
}) {
  const [editando, setEditando] = useState(false);
  const [nueva, setNueva] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [errores, setErrores] = useState<Errores>({});
  const [guardado, setGuardado] = useState(false);

  function validar(): Errores {
    const err: Errores = {};
    if (!nueva) err.nueva = "La contraseña es obligatoria.";
    else if (nueva.length < 6) err.nueva = "Debe tener al menos 6 caracteres.";
    if (nueva !== confirmar) err.confirmar = "Las contraseñas no coinciden.";
    return err;
  }

  function guardar(e: React.FormEvent) {
    e.preventDefault();
    const err = validar();
    setErrores(err);
    if (Object.keys(err).length > 0) return;
    editarUsuario(usuario.id, { contrasena: nueva });
    setNueva("");
    setConfirmar("");
    setErrores({});
    setEditando(false);
    setGuardado(true);
    setTimeout(() => setGuardado(false), 3000);
  }

  return (
    <Card>
      <CardHeader title="Mi Perfil" subtitle="Tus datos de acceso a este sistema" />
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-full bg-[var(--color-terracota)] text-white flex items-center justify-center font-bold shrink-0">
          {usuario.iniciales}
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-sm text-[var(--color-gris)] truncate">{usuario.nombreReal ?? usuario.nombre}</p>
          <p className="text-xs text-[var(--color-gris-medio)]">{usuario.cargo} · usuario: {usuario.usuario}</p>
        </div>
      </div>

      <div className="max-w-sm mb-4">
        <label className="block text-xs font-semibold text-[var(--color-gris-medio)] mb-1">Contraseña actual</label>
        <CampoContrasena value={usuario.contrasena} disabled />
      </div>

      {!editando ? (
        <div className="flex items-center gap-3">
          <button
            onClick={() => setEditando(true)}
            className="flex items-center gap-1.5 text-xs font-semibold text-[var(--color-terracota)] hover:underline"
          >
            <Lock size={13} /> Cambiar contraseña
          </button>
          {guardado && <span className="text-xs font-medium text-[var(--color-verde)]">Contraseña actualizada.</span>}
        </div>
      ) : (
        <form onSubmit={guardar} className="space-y-3 max-w-sm">
          <div>
            <label className="block text-xs font-semibold text-[var(--color-gris-medio)] mb-1">Nueva contraseña</label>
            <CampoContrasena value={nueva} onChange={setNueva} placeholder="Mínimo 6 caracteres" />
            {errores.nueva && <p className="text-[11px] text-[var(--color-rojo)] mt-1 font-medium">{errores.nueva}</p>}
          </div>
          <div>
            <label className="block text-xs font-semibold text-[var(--color-gris-medio)] mb-1">Confirmar contraseña</label>
            <CampoContrasena value={confirmar} onChange={setConfirmar} />
            {errores.confirmar && <p className="text-[11px] text-[var(--color-rojo)] mt-1 font-medium">{errores.confirmar}</p>}
          </div>
          <div className="flex gap-2">
            <button type="submit" className="flex items-center gap-1.5 bg-[var(--color-terracota)] text-white text-xs font-semibold rounded-lg px-4 py-2 hover:opacity-90 transition-opacity">
              <Check size={13} /> Guardar
            </button>
            <button
              type="button"
              onClick={() => { setEditando(false); setNueva(""); setConfirmar(""); setErrores({}); }}
              className="text-xs font-semibold text-[var(--color-gris-medio)] rounded-lg px-3 py-2 hover:bg-[var(--color-crema)] transition-colors"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}
    </Card>
  );
}

function IntegracionWhatsApp() {
  const { config, guardar, desconectar, listo } = useConfigWhatsAppAPI();
  const [editando, setEditando] = useState(false);
  const [numeroTelefono, setNumeroTelefono] = useState(config?.numeroTelefono ?? "");
  const [phoneNumberId, setPhoneNumberId] = useState(config?.phoneNumberId ?? "");
  const [accessToken, setAccessToken] = useState("");

  if (!listo) return null;

  return (
    <Card>
      <div className="flex items-start justify-between flex-wrap gap-3">
        <CardHeader
          title="WhatsApp Business API"
          subtitle={
            config
              ? `Conectado — ${config.numeroTelefono} (el envío en Campañas sigue simulado hasta terminar la integración)`
              : "Sin conectar — el envío masivo en Campañas se simula"
          }
        />
        <Badge tono={config ? "verde" : "gris" as Tono}>{config ? "Conectado" : "Sin conectar"}</Badge>
      </div>

      {!editando ? (
        <button
          onClick={() => { setNumeroTelefono(config?.numeroTelefono ?? ""); setPhoneNumberId(config?.phoneNumberId ?? ""); setEditando(true); }}
          className="flex items-center gap-1.5 text-xs font-semibold text-[var(--color-terracota)] hover:underline"
        >
          <Plug size={13} /> {config ? "Editar conexión" : "Conectar"}
        </button>
      ) : (
        <div className="space-y-3 max-w-sm">
          <p className="text-[11px] text-[var(--color-gris-medio)]">
            Prototipo: las credenciales se guardan solo en este navegador y el envío sigue siendo simulado —
            conectar la Cloud API real de Meta necesita un backend, es un paso pendiente junto con Supabase.
          </p>
          <div>
            <label className="block text-xs font-semibold text-[var(--color-gris-medio)] mb-1">Número de WhatsApp Business</label>
            <input value={numeroTelefono} onChange={(e) => setNumeroTelefono(e.target.value)} placeholder="+51 999 999 999" className="input" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[var(--color-gris-medio)] mb-1">Phone Number ID</label>
            <input value={phoneNumberId} onChange={(e) => setPhoneNumberId(e.target.value)} placeholder="Ej. 109…" className="input" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[var(--color-gris-medio)] mb-1">Token de acceso</label>
            <CampoContrasena value={accessToken} onChange={setAccessToken} placeholder={config ? "•••••••••••••••• (ya guardado)" : "EAAG…"} />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                if (!numeroTelefono.trim() || !phoneNumberId.trim() || !accessToken.trim()) return;
                guardar({ numeroTelefono: numeroTelefono.trim(), phoneNumberId: phoneNumberId.trim(), accessToken: accessToken.trim() });
                setAccessToken("");
                setEditando(false);
              }}
              className="flex items-center gap-1.5 bg-[var(--color-terracota)] text-white text-xs font-semibold rounded-lg px-4 py-2 hover:opacity-90 transition-opacity"
            >
              <Check size={13} /> Guardar
            </button>
            {config && (
              <button
                onClick={() => { desconectar(); setEditando(false); }}
                className="text-xs font-semibold text-[var(--color-gris-medio)] rounded-lg px-3 py-2 hover:bg-[var(--color-crema)] transition-colors"
              >
                Desconectar
              </button>
            )}
            <button
              onClick={() => setEditando(false)}
              className="flex items-center gap-1 text-xs font-semibold text-[var(--color-gris-medio)] rounded-lg px-3 py-2 hover:bg-[var(--color-crema)] transition-colors"
            >
              <X size={13} /> Cancelar
            </button>
          </div>
        </div>
      )}
    </Card>
  );
}

function IntegracionIA() {
  const { config, guardar, desconectar, listo } = useConfigIA();
  const [editando, setEditando] = useState(false);
  const [proveedor, setProveedor] = useState<ConfigIA["proveedor"]>(config?.proveedor ?? "openai");
  const [apiKey, setApiKey] = useState("");

  if (!listo) return null;

  const nombreProveedor = (p: ConfigIA["proveedor"]) => (p === "openai" ? "OpenAI" : p === "anthropic" ? "Anthropic" : "Otro proveedor");

  return (
    <Card>
      <div className="flex items-start justify-between flex-wrap gap-3">
        <CardHeader
          title="API de IA (Estrategias)"
          subtitle={
            config
              ? `Conectado — ${nombreProveedor(config.proveedor)} (las respuestas en Estrategias siguen simuladas por ahora)`
              : "Sin conectar — las respuestas en Estrategias se simulan con tus datos"
          }
        />
        <Badge tono={config ? "verde" : "gris" as Tono}>{config ? "Conectado" : "Sin conectar"}</Badge>
      </div>

      {!editando ? (
        <button
          onClick={() => { setProveedor(config?.proveedor ?? "openai"); setEditando(true); }}
          className="flex items-center gap-1.5 text-xs font-semibold text-[var(--color-terracota)] hover:underline"
        >
          <Sparkles size={13} /> {config ? "Editar conexión" : "Conectar"}
        </button>
      ) : (
        <div className="space-y-3 max-w-sm">
          <p className="text-[11px] text-[var(--color-gris-medio)]">
            Prototipo: la clave se guarda solo en este navegador y las respuestas siguen siendo simuladas —
            conectar el proveedor real es un paso pendiente, junto con Supabase.
          </p>
          <div>
            <label className="block text-xs font-semibold text-[var(--color-gris-medio)] mb-1">Proveedor</label>
            <select value={proveedor} onChange={(e) => setProveedor(e.target.value as ConfigIA["proveedor"])} className="input bg-white">
              <option value="openai">OpenAI</option>
              <option value="anthropic">Anthropic</option>
              <option value="otro">Otro</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-[var(--color-gris-medio)] mb-1">Clave de API</label>
            <CampoContrasena value={apiKey} onChange={setApiKey} placeholder={config ? "•••••••••••••••• (ya guardada)" : "sk-…"} />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                if (!apiKey.trim()) return;
                guardar({ proveedor, apiKey: apiKey.trim() });
                setApiKey("");
                setEditando(false);
              }}
              className="flex items-center gap-1.5 bg-[var(--color-terracota)] text-white text-xs font-semibold rounded-lg px-4 py-2 hover:opacity-90 transition-opacity"
            >
              <Check size={13} /> Guardar
            </button>
            {config && (
              <button
                onClick={() => { desconectar(); setEditando(false); }}
                className="text-xs font-semibold text-[var(--color-gris-medio)] rounded-lg px-3 py-2 hover:bg-[var(--color-crema)] transition-colors"
              >
                Desconectar
              </button>
            )}
            <button
              onClick={() => setEditando(false)}
              className="flex items-center gap-1 text-xs font-semibold text-[var(--color-gris-medio)] rounded-lg px-3 py-2 hover:bg-[var(--color-crema)] transition-colors"
            >
              <X size={13} /> Cancelar
            </button>
          </div>
        </div>
      )}
    </Card>
  );
}
