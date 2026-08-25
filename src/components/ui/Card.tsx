import { ReactNode } from "react";
import clsx from "clsx";

export function Card({
  children,
  className,
  padding = "p-5",
}: {
  children: ReactNode;
  className?: string;
  padding?: string;
}) {
  return (
    <div
      className={clsx(
        "bg-white rounded-2xl border border-[var(--color-gris-claro)]/40 shadow-sm",
        padding,
        className
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between mb-4 gap-3">
      <div>
        <h3 className="font-semibold text-[var(--color-gris)] text-[15px]">{title}</h3>
        {subtitle && <p className="text-xs text-[var(--color-gris-medio)] mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
