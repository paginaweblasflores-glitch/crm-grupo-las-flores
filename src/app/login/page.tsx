"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useApp } from "@/lib/app-context";
import { Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const { iniciarSesion } = useApp();
  const router = useRouter();
  const [usuario, setUsuario] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [verContrasena, setVerContrasena] = useState(false);
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
    <div
      className="h-screen overflow-hidden flex items-center justify-center px-4 py-4"
      style={{
        background:
          "radial-gradient(ellipse at center, var(--color-terracota) 0%, var(--color-terracota-oscuro) 55%, #200b06 100%)",
      }}
    >
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl px-8 py-7 max-h-full overflow-y-auto">
        <div className="text-center mb-7">
          <div className="w-20 h-20 mx-auto mb-4 rounded-xl border border-[var(--color-gris-claro)]/40 p-2 flex items-center justify-center">
            <Image src="/logo.png" alt="Grupo Las Flores" width={64} height={64} className="w-full h-full object-contain" priority />
          </div>
          <h1 className="text-2xl font-bold text-[var(--color-terracota)]" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
            CRM Grupo Las Flores
          </h1>
          <p className="text-sm text-[var(--color-gris-medio)] mt-1">
            Restaurante · Hotel · Restobar
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-[var(--color-gris)] mb-1.5">
              Usuario <span className="text-[var(--color-rojo)]">*</span>
            </label>
            <input
              value={usuario}
              onChange={(e) => { setUsuario(e.target.value); setError(false); }}
              placeholder="Ej. betsy o melisa"
              autoFocus
              className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--color-gris-claro)]/50 text-sm focus:outline-none focus:border-[var(--color-terracota)] transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-[var(--color-gris)] mb-1.5">
              Contraseña <span className="text-[var(--color-rojo)]">*</span>
            </label>
            <div className="relative">
              <input
                type={verContrasena ? "text" : "password"}
                value={contrasena}
                onChange={(e) => { setContrasena(e.target.value); setError(false); }}
                placeholder="••••••••"
                className="w-full px-3.5 pr-10 py-2.5 rounded-xl border border-[var(--color-gris-claro)]/50 text-sm focus:outline-none focus:border-[var(--color-terracota)] transition-colors"
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

          {error && (
            <p className="text-xs text-[var(--color-rojo)] font-medium">Usuario o contraseña incorrectos.</p>
          )}

          <button
            type="submit"
            className="w-full bg-[var(--color-terracota)] text-white text-sm font-bold rounded-xl py-3 hover:opacity-90 transition-opacity"
          >
            Ingresar al Sistema
          </button>
        </form>

        <hr className="my-5 border-[var(--color-gris-claro)]/30" />

        <p className="text-center text-xs text-[var(--color-gris-medio)]">
          Sistema de gestión de clientes, reservas y cumpleaños.
        </p>

        <details className="mt-4 text-xs text-[var(--color-gris-medio)]">
          <summary className="cursor-pointer text-center font-medium hover:text-[var(--color-terracota)]">
            Cuentas de prueba (solo en este prototipo)
          </summary>
          <div className="mt-2 bg-[var(--color-crema)] rounded-xl border border-[var(--color-gris-claro)]/40 p-3 space-y-1">
            <p><b>Dirección (Lima):</b> socios / direccion2026</p>
            <p><b>Gerencial:</b> mijael / gerencial2026</p>
            <p><b>Ventas — Las Flores:</b> betsy / ventas2026</p>
            <p><b>Ventas — Las Flores:</b> melisa / ventas2026</p>
            <p><b>Ventas — Hotel Umaru:</b> carla / umaru2026</p>
            <p className="pt-1 text-[var(--color-gris-medio)]">
              Mijael (Gerencial) puede crear más cuentas de Ventas desde el módulo Usuarios una vez adentro.
            </p>
          </div>
        </details>
      </div>
    </div>
  );
}
