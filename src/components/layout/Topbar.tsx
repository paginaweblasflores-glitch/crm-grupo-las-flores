"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";
import { useApp } from "@/lib/app-context";
import { NegocioId } from "@/lib/types";

export function Topbar({ titulo, descripcion }: { titulo: string; descripcion?: string }) {
  const { usuario, negocio, negociosDisponibles, cambiarNegocio } = useApp();
  const [abierto, setAbierto] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const puedeElegir = negociosDisponibles.length > 1;

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setAbierto(false);
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
        <div className="relative" ref={ref}>
          <button
            onClick={() => puedeElegir && setAbierto((v) => !v)}
            className={`flex items-center gap-2 bg-white border border-[var(--color-gris-claro)]/50 rounded-xl px-3.5 py-2 text-sm font-medium text-[var(--color-gris)] transition-colors ${puedeElegir ? "hover:border-[var(--color-terracota)]/40 cursor-pointer" : "cursor-default"}`}
          >
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: negocio.colorAcento }}
            />
            {negocio.nombre}
            {puedeElegir && <ChevronDown size={15} className="text-[var(--color-gris-medio)]" />}
          </button>
          {abierto && puedeElegir && (
            <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl border border-[var(--color-gris-claro)]/40 shadow-lg py-1.5 z-20 animate-fade-in">
              {negociosDisponibles.map((n) => (
                <button
                  key={n.id}
                  onClick={() => {
                    cambiarNegocio(n.id as NegocioId);
                    setAbierto(false);
                  }}
                  className="w-full flex items-start gap-2.5 px-3.5 py-2.5 text-left hover:bg-[var(--color-crema)] transition-colors"
                >
                  <span
                    className="w-2 h-2 rounded-full mt-1.5 shrink-0"
                    style={{ backgroundColor: n.colorAcento }}
                  />
                  <span className="flex-1">
                    <span className="flex items-center gap-1.5">
                      <span className="text-sm font-medium text-[var(--color-gris)]">{n.nombre}</span>
                      {!n.operando && (
                        <span className="text-[9px] uppercase font-bold text-[var(--color-gris-medio)] bg-[var(--color-crema-oscuro)] rounded px-1.5 py-0.5">
                          próximamente
                        </span>
                      )}
                    </span>
                    <span className="block text-[11px] text-[var(--color-gris-medio)] mt-0.5">
                      {n.descripcionEstado}
                    </span>
                  </span>
                  {n.id === negocio.id && <Check size={15} className="text-[var(--color-terracota)] mt-1" />}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2.5 pl-3 border-l border-[var(--color-gris-claro)]/40">
          <div className="w-9 h-9 rounded-full bg-[var(--color-terracota)] text-white flex items-center justify-center text-xs font-bold">
            {usuario.iniciales}
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-semibold text-[var(--color-gris)] leading-tight">{usuario.nombre}</p>
            <p className="text-[11px] text-[var(--color-gris-medio)]">{usuario.rolLabel}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
