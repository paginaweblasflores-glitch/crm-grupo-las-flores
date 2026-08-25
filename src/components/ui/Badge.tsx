import clsx from "clsx";
import { ReactNode } from "react";

export type Tono = "verde" | "naranja" | "rojo" | "gris" | "azul" | "terracota";

const TONOS: Record<Tono, string> = {
  verde: "bg-[var(--color-verde-claro)] text-[var(--color-verde)]",
  naranja: "bg-[var(--color-naranja-claro)]/40 text-[var(--color-terracota-oscuro)]",
  rojo: "bg-[var(--color-rojo-claro)] text-[var(--color-rojo)]",
  gris: "bg-[var(--color-crema-oscuro)] text-[var(--color-gris-medio)]",
  azul: "bg-[var(--color-azul-claro)] text-[var(--color-azul)]",
  terracota: "bg-[var(--color-terracota)]/10 text-[var(--color-terracota)]",
};

export function Badge({ tono = "gris", children }: { tono?: Tono; children: ReactNode }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap",
        TONOS[tono]
      )}
    >
      {children}
    </span>
  );
}

// Insignia de origen del dato — deja explícito qué está simulado y qué depende
// de una conexión externa pendiente (mismo criterio del Plan de CRM).
export function FuenteBadge({ tipo }: { tipo: "simulado" | "pendiente" | "conectado" }) {
  const map = {
    simulado: { tono: "azul" as const, texto: "Datos simulados (prototipo)" },
    pendiente: { tono: "naranja" as const, texto: "Pendiente de conexión real" },
    conectado: { tono: "verde" as const, texto: "Conectado" },
  };
  const cfg = map[tipo];
  return (
    <Badge tono={cfg.tono}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {cfg.texto}
    </Badge>
  );
}
