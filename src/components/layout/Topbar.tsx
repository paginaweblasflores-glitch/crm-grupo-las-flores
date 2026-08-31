"use client";

import { useState, useRef, useEffect, ReactNode } from "react";
import Link from "next/link";
import { ChevronDown, Check, LogOut, Building2, Settings } from "lucide-react";
import { useApp } from "@/lib/app-context";
import { NegocioId } from "@/lib/types";
import { puedeCambiarNegocio, accesoA } from "@/lib/permissions";

export function Topbar({ titulo, descripcion, accion }: { titulo: string; descripcion?: string; accion?: ReactNode }) {
  const { usuario, negocio, negociosDisponibles, cambiarNegocio, cerrarSesion } = useApp();
  const [abierto, setAbierto] = useState(false);
  const [perfilAbierto, setPerfilAbierto] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const perfilRef = useRef<HTMLDivElement>(null);
  const puedeElegir = negociosDisponibles.length > 1 && Boolean(usuario && puedeCambiarNegocio(usuario.rolTipo));
  // Dirección y Administración siempre ven/supervisan los 3 negocios
  // consolidados — su `negocioId` de cuenta no significa nada para estos
  // roles (existe solo porque el tipo Usuario lo exige), así que el pill
  // no debe mostrar un negocio específico como si estuvieran "parados" en
  // uno solo.
  const esConsolidado = usuario?.rolTipo === "direccion" || usuario?.rolTipo === "administracion";
  // Solo Gerente General guarda nombreReal — su perfil, ya dentro del sistema,
  // muestra su nombre real; el resto de cuentas se ve por el nombre del cargo.
  const nombreMostrado = usuario?.nombreReal ?? usuario?.nombre;

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setAbierto(false);
      if (perfilRef.current && !perfilRef.current.contains(e.target as Node)) setPerfilAbierto(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  if (!usuario) return null;

  return (
    <header className="h-20 shrink-0 flex items-center justify-between px-8 border-b border-[var(--color-gris-claro)]/40 bg-[var(--background)]">
      <div>
        <h1 className="text-lg font-bold text-[var(--color-gris)]">{titulo}</h1>
        {descripcion && <p className="text-xs text-[var(--color-gris-medio)] mt-0.5">{descripcion}</p>}
      </div>

      <div className="flex items-center gap-3 no-imprimir">
        {accion}
        <div className="relative" ref={ref}>
          <button
            onClick={() => puedeElegir && setAbierto((v) => !v)}
            className={`flex items-center gap-2 bg-white border border-[var(--color-gris-claro)]/50 rounded-xl px-3.5 py-2 text-sm font-medium text-[var(--color-gris)] transition-colors ${puedeElegir ? "hover:border-[var(--color-terracota)]/40 cursor-pointer" : "cursor-default"}`}
          >
            {esConsolidado ? (
              <>
                <Building2 size={14} className="text-[var(--color-terracota)]" />
                Consorcio Las Flores
              </>
            ) : (
              <>
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: negocio.colorAcento }}
                />
                {negocio.nombre}
              </>
            )}
            {puedeElegir && <ChevronDown size={15} className="text-[var(--color-gris-medio)]" />}
          </button>
          {abierto && puedeElegir && (
            <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl border border-[var(--color-gris-claro)]/40 shadow-lg py-1.5 z-20 animate-fade-in">
              {negociosDisponibles.map((n) => (
                <div key={n.id}>
                  <button
                    onClick={() => {
                      cambiarNegocio(n.id as NegocioId);
                      setAbierto(false);
                    }}
                    className="w-full flex items-start gap-2.5 px-3.5 py-2.5 text-left hover:bg-[var(--color-crema)] transition-colors cursor-pointer"
                  >
                    <span
                      className="w-2 h-2 rounded-full mt-1.5 shrink-0"
                      style={{ backgroundColor: n.colorAcento }}
                    />
                    <span className="flex-1">
                      <span className="flex items-center gap-1.5">
                        <span className="text-sm font-semibold text-[var(--color-gris)]">{n.nombre}</span>
                        {n.id === "todas" ? (
                          <span className="text-[9px] uppercase font-bold text-[var(--color-terracota)] bg-[var(--color-crema)] border border-[var(--color-terracota)]/30 rounded px-1.5 py-0.5">
                            Consolidado
                          </span>
                        ) : !n.operando ? (
                          <span className="text-[9px] uppercase font-bold text-[var(--color-gris-medio)] bg-[var(--color-crema-oscuro)] rounded px-1.5 py-0.5">
                            próximamente
                          </span>
                        ) : null}
                      </span>
                      <span className="block text-[11px] text-[var(--color-gris-medio)] mt-0.5">
                        {n.descripcionEstado}
                      </span>
                    </span>
                    {n.id === negocio.id && <Check size={15} className="text-[var(--color-terracota)] mt-1" />}
                  </button>
                  {n.id === "todas" && <div className="my-1 border-b border-[var(--color-gris-claro)]/40" />}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="relative" ref={perfilRef}>
          <button
            onClick={() => setPerfilAbierto((v) => !v)}
            className="flex items-center gap-2.5 pl-3 border-l border-[var(--color-gris-claro)]/40 hover:opacity-75 transition-opacity cursor-pointer"
          >
            <div className="w-9 h-9 rounded-full bg-[var(--color-terracota)] text-white flex items-center justify-center text-xs font-bold shrink-0">
              {usuario.iniciales}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-semibold text-[var(--color-gris)] leading-tight">{nombreMostrado}</p>
              <p className="text-[11px] text-[var(--color-gris-medio)]">{usuario.rolLabel}</p>
            </div>
          </button>
          {perfilAbierto && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl border border-[var(--color-gris-claro)]/40 shadow-lg py-1.5 z-20 animate-fade-in">
              <div className="px-3.5 py-2.5 border-b border-[var(--color-gris-claro)]/30">
                <p className="text-sm font-semibold text-[var(--color-gris)]">{nombreMostrado}</p>
                <p className="text-xs text-[var(--color-gris-medio)]">{usuario.cargo}</p>
              </div>
              {accesoA(usuario.rolTipo, "configuracion") !== "no" && (
                <Link
                  href="/configuracion"
                  onClick={() => setPerfilAbierto(false)}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-left text-sm font-medium text-[var(--color-gris)] hover:bg-[var(--color-crema)] transition-colors"
                >
                  <Settings size={15} /> Configuración
                </Link>
              )}
              <button
                onClick={() => {
                  setPerfilAbierto(false);
                  cerrarSesion();
                }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-left text-sm font-medium text-[var(--color-rojo)] hover:bg-[var(--color-rojo-claro)] transition-colors"
              >
                <LogOut size={15} /> Cerrar sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
