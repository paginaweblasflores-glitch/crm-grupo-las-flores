import { ReactNode } from "react";

export function EmptyState({
  icon,
  title,
  description,
}: {
  icon?: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6">
      {icon && (
        <div className="mb-4 w-14 h-14 rounded-2xl bg-[var(--color-crema-oscuro)] flex items-center justify-center text-[var(--color-gris-medio)]">
          {icon}
        </div>
      )}
      <h3 className="font-semibold text-[var(--color-gris)] mb-1.5">{title}</h3>
      <p className="text-sm text-[var(--color-gris-medio)] max-w-md">{description}</p>
    </div>
  );
}
