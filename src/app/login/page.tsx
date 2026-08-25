"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useApp } from "@/lib/app-context";
import { Lock, User, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const { iniciarSesion } = useApp();
  const router = useRouter();
  const [usuario, setUsuario] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [verContrasena, setVerContrasena] = useState(false);
  const [recordarme, setRecordarme] = useState(true);
  const [error, setError] = useState(false);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const ok = iniciarSesion(usuario, contrasena);
    if (ok) {
      router.push("/dashboard");
    } else {
      setError(true);
    }
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Columna izquierda — formulario */}
      <div className="w-full md:w-1/2 lg:w-[42%] flex items-center justify-center bg-white px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="text-center mb-7">
            <Image src="/logo.png" alt="Grupo Las Flores" width={56} height={56} className="w-14 h-14 mb-5 mx-auto" priority />
            <h1 className="text-2xl font-bold text-[var(--color-gris)]">Iniciar sesión</h1>
            <p className="text-sm text-[var(--color-gris-medio)] mt-1.5">
              CRM Grupo Las Flores — ingresa con tu usuario y contraseña.
            </p>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--color-gris-medio)] mb-1.5">Usuario</label>
              <div className="relative">
                <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-gris-medio)]" />
                <input
                  value={usuario}
                  onChange={(e) => { setUsuario(e.target.value); setError(false); }}
                  placeholder="betsy"
                  autoFocus
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[var(--color-gris-claro)]/50 text-sm focus:outline-none focus:border-[var(--color-terracota)] transition-colors"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--color-gris-medio)] mb-1.5">Contraseña</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-gris-medio)]" />
                <input
                  type={verContrasena ? "text" : "password"}
                  value={contrasena}
                  onChange={(e) => { setContrasena(e.target.value); setError(false); }}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-9 py-2.5 rounded-xl border border-[var(--color-gris-claro)]/50 text-sm focus:outline-none focus:border-[var(--color-terracota)] transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setVerContrasena((v) => !v)}
                  tabIndex={-1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-gris-medio)] hover:text-[var(--color-gris)]"
                >
                  {verContrasena ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-xs text-[var(--color-gris-medio)] cursor-pointer">
                <input
                  type="checkbox"
                  checked={recordarme}
                  onChange={(e) => setRecordarme(e.target.checked)}
                  className="rounded"
                />
                Recordarme
              </label>
            </div>

            {error && (
              <p className="text-xs text-[var(--color-rojo)] font-medium">Usuario o contraseña incorrectos.</p>
            )}

            <button
              type="submit"
              className="w-full bg-[var(--color-terracota)] text-white text-sm font-semibold rounded-xl py-2.5 hover:opacity-90 transition-opacity"
            >
              Ingresar
            </button>

            <p className="text-center text-xs text-[var(--color-gris-medio)]">
              ¿Olvidaste tu contraseña? Pídele acceso a Administración.
            </p>
          </form>

          <details className="mt-6 text-xs text-[var(--color-gris-medio)]">
            <summary className="cursor-pointer text-center font-medium hover:text-[var(--color-terracota)]">
              Cuentas de prueba (solo en este prototipo)
            </summary>
            <div className="mt-2 bg-[var(--color-crema)] rounded-xl border border-[var(--color-gris-claro)]/40 p-3 space-y-1">
              <p><b>Dirección:</b> mijael / direccion2026</p>
              <p><b>Administración:</b> betsy / admin2026</p>
              <p><b>Ventas:</b> melisa / ventas2026</p>
              <p className="pt-1 text-[var(--color-gris-medio)]">
                Betsy puede crear más cuentas desde el módulo Usuarios una vez adentro.
              </p>
            </div>
          </details>

          <p className="text-center text-[11px] text-[var(--color-gris-medio)] mt-6">
            © 2026 Grupo Las Flores. Prototipo con datos simulados — la conexión real con Supabase se hace en una siguiente etapa.
          </p>
        </div>
      </div>

      {/* Columna derecha — ilustración */}
      <div className="hidden md:flex md:w-1/2 lg:w-[58%] relative items-center justify-center overflow-hidden bg-gradient-to-br from-[var(--color-terracota-oscuro)] via-[var(--color-terracota)] to-[var(--color-naranja)]">
        <div className="absolute -top-24 -left-16 w-72 h-72 rounded-full bg-[var(--color-naranja-claro)]/20 blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute top-1/3 right-16 w-40 h-40 rounded-full bg-[var(--color-verde)]/20 blur-2xl" />

        <p className="absolute inset-0 flex items-center justify-center text-white/[0.06] text-[11rem] font-black tracking-tight select-none leading-none">
          Flores
        </p>

        <div className="relative z-10 flex flex-col items-center px-10 text-center">
          <Image
            src="/login-illustration.svg"
            alt="Equipo de Grupo Las Flores"
            width={420}
            height={450}
            className="w-full max-w-[380px] h-auto drop-shadow-2xl"
            priority
          />
          <p className="mt-6 text-white text-lg font-semibold max-w-sm">
            Un solo sistema para Restaurante Las Flores, Hotel Umaru y Mamina Restobar.
          </p>
          <p className="mt-2 text-white/70 text-sm max-w-xs">
            Clientes, reservas, delivery y cumpleaños — todo en un mismo lugar.
          </p>
        </div>
      </div>
    </div>
  );
}
