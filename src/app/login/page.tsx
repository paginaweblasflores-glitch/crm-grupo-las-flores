"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useApp } from "@/lib/app-context";
import { Eye, EyeOff, ChevronDown, ArrowRight } from "lucide-react";

// Orden fijo de la lista del login — la jerarquía del organigrama, no
// alfabético ni "más reciente primero" (ese es el orden que usan las
// tablas del sistema, ver useData(), pero acá confundiría más de lo que
// ayuda: alguien que abre el selector espera encontrar su cuenta siempre
// en el mismo lugar, sin que dependa de cuándo se creó cada una).
const ORDEN_ROL: Record<string, number> = { direccion: 0, gerencial: 1, administracion: 2, ventas: 3 };
const ORDEN_NEGOCIO: Record<string, number> = { "las-flores": 0, umaru: 1, mamina: 2 };

export default function LoginPage() {
  const { iniciarSesion, usuarios } = useApp();
  const router = useRouter();
  const usuariosOrdenados = [...usuarios].sort((a, b) => {
    const rol = (ORDEN_ROL[a.rolTipo] ?? 99) - (ORDEN_ROL[b.rolTipo] ?? 99);
    if (rol !== 0) return rol;
    return (ORDEN_NEGOCIO[a.negocioId] ?? 99) - (ORDEN_NEGOCIO[b.negocioId] ?? 99);
  });
  const [usuario, setUsuario] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [verContrasena, setVerContrasena] = useState(false);
  const [error, setError] = useState(false);
  const passwordInputRef = useRef<HTMLInputElement>(null);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const ok = iniciarSesion(usuario, contrasena);
    if (ok) {
      router.push("/dashboard");
    } else {
      setError(true);
    }
  }

  function alSeleccionarUsuario(valor: string) {
    setUsuario(valor);
    setError(false);
    if (valor) {
      setTimeout(() => {
        passwordInputRef.current?.focus();
      }, 50);
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-8"
      style={{
        background:
          "radial-gradient(ellipse at center, var(--color-terracota) 0%, var(--color-terracota-oscuro) 55%, #200b06 100%)",
      }}
    >
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl px-7 py-8 border border-white/20">
        {/* Cabecera / Logo */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-[var(--color-crema)]/60 border border-[var(--color-gris-claro)]/40 flex items-center justify-center shadow-inner overflow-hidden">
            <Image src="/logo.png" alt="Grupo Las Flores" width={56} height={56} className="w-full h-full rounded-full object-cover" priority />
          </div>
          <h1 className="text-2xl font-bold text-[var(--color-terracota)] tracking-tight" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
            CRM Consorcio Las Flores
          </h1>
          <p className="text-xs text-[var(--color-gris-medio)] mt-1 font-medium">
            Restaurante · Hotel · Restobar
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          {/* Lista Desplegable de Usuarios */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-gris)] mb-1.5">
              Usuario <span className="text-[var(--color-rojo)]">*</span>
            </label>
            <div className="relative">
              <select
                value={usuario}
                onChange={(e) => alSeleccionarUsuario(e.target.value)}
                className="w-full px-3.5 py-3 rounded-xl border border-[var(--color-gris-claro)] text-sm font-medium text-[var(--color-gris)] bg-white focus:outline-none focus:border-[var(--color-terracota)] focus:ring-2 focus:ring-[var(--color-terracota)]/20 transition-all appearance-none cursor-pointer pr-10 shadow-sm"
              >
                <option value="" disabled>Selecciona tu usuario...</option>
                {usuariosOrdenados.map((u) => (
                  <option key={u.id} value={u.usuario}>
                    {u.nombre}
                  </option>
                ))}
              </select>
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--color-gris-medio)]">
                <ChevronDown size={18} />
              </div>
            </div>
          </div>

          {/* Campo Contraseña */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-gris)] mb-1.5">
              Contraseña <span className="text-[var(--color-rojo)]">*</span>
            </label>
            <div className="relative">
              <input
                ref={passwordInputRef}
                type={verContrasena ? "text" : "password"}
                value={contrasena}
                onChange={(e) => { setContrasena(e.target.value); setError(false); }}
                placeholder="Ingresa tu contraseña"
                className="w-full px-3.5 pr-10 py-3 rounded-xl border border-[var(--color-gris-claro)] text-sm focus:outline-none focus:border-[var(--color-terracota)] focus:ring-2 focus:ring-[var(--color-terracota)]/20 transition-all"
              />
              <button
                type="button"
                onClick={() => setVerContrasena((v) => !v)}
                tabIndex={-1}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-gris-medio)] hover:text-[var(--color-gris)]"
                title="Mostrar u ocultar contraseña"
              >
                {verContrasena ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="p-2.5 rounded-xl bg-[var(--color-rojo)]/10 border border-[var(--color-rojo)]/20 text-xs text-[var(--color-rojo)] font-medium text-center animate-shake">
              Usuario o contraseña incorrectos.
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-[var(--color-terracota)] text-white text-sm font-bold rounded-xl py-3 hover:bg-[var(--color-terracota-oscuro)] transition-colors shadow-md hover:shadow-lg flex items-center justify-center gap-2 mt-2 cursor-pointer"
          >
            <span>Ingresar al Sistema</span>
            <ArrowRight size={16} />
          </button>
        </form>

        <p className="text-center text-[11px] text-[var(--color-gris-medio)] mt-6">
          CRM Corporativo · Consorcio Las Flores © 2026
        </p>
      </div>
    </div>
  );
}
