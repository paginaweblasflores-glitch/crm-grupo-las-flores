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
    <div className="bg-white rounded-2xl border border-[var(--color-gris-claro)]/40 shadow-sm p-5 flex items-start justify-between">
      <div>
        <p className="text-xs font-medium text-[var(--color-gris-medio)] mb-1.5">{label}</p>
        <p className="text-2xl font-bold text-[var(--color-gris)] leading-none">{value}</p>
        {trend && (
          <p
            className={clsx(
              "text-xs mt-2 font-medium",
              trendUp ? "text-[var(--color-verde)]" : "text-[var(--color-rojo)]"
            )}
          >
            {trendUp ? "↑" : "↓"} {trend}
          </p>
        )}
      </div>
      {icon && <div className={clsx("rounded-xl p-2.5", bg)}>{icon}</div>}
    </div>
  );
}
