import { ReactNode } from "react";
import clsx from "clsx";

export function StatTile({
  label,
  value,
  icon,
  trend,
  trendUp,
  tono = "terracota",
}: {
  label: string;
  value: string | number;
  icon?: ReactNode;
  trend?: string;
  trendUp?: boolean;
  tono?: "terracota" | "verde" | "azul" | "naranja";
}) {
  const bg = {
    terracota: "bg-[var(--color-terracota)]/10 text-[var(--color-terracota)]",
    verde: "bg-[var(--color-verde-claro)] text-[var(--color-verde)]",
    azul: "bg-[var(--color-azul-claro)] text-[var(--color-azul)]",
    naranja: "bg-[var(--color-naranja-claro)]/40 text-[var(--color-terracota-oscuro)]",
  }[tono];

  return (
    <div className="bg-white rounded-2xl border border-[var(--color-gris-claro)]/40 shadow-sm p-5">
      {icon && <div className={clsx("rounded-xl p-2.5 w-fit mb-3.5", bg)}>{icon}</div>}
      <p className="text-[28px] font-bold text-[var(--color-gris)] leading-none tracking-tight tabular-nums">{value}</p>
      <p className="text-xs font-medium text-[var(--color-gris-medio)] mt-2">{label}</p>
      {trend && (
        <p
          className={clsx(
            "text-xs mt-2 font-medium",
            trendUp === undefined ? "text-[var(--color-gris-medio)]" : trendUp ? "text-[var(--color-verde)]" : "text-[var(--color-rojo)]"
          )}
        >
          {trendUp !== undefined && (trendUp ? "↑ " : "↓ ")}{trend}
        </p>
      )}
    </div>
  );
}
