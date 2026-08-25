import { ReactNode } from "react";

export function Table({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto -mx-5 px-5">
      <table className="w-full text-sm border-collapse min-w-[640px]">{children}</table>
    </div>
  );
}

export function Thead({ children }: { children: ReactNode }) {
  return (
    <thead>
      <tr className="border-b border-[var(--color-gris-claro)]/50 text-left">{children}</tr>
    </thead>
  );
}

export function Th({ children }: { children: ReactNode }) {
  return (
    <th className="py-2.5 px-3 text-[11px] font-semibold uppercase tracking-wide text-[var(--color-gris-medio)] whitespace-nowrap">
      {children}
    </th>
  );
}

export function Td({ children, className }: { children: ReactNode; className?: string }) {
  return <td className={`py-3 px-3 text-[var(--color-gris)] ${className ?? ""}`}>{children}</td>;
}

export function Tr({ children, onClick }: { children: ReactNode; onClick?: () => void }) {
  return (
    <tr
      onClick={onClick}
      className={`border-b border-[var(--color-gris-claro)]/25 last:border-0 hover:bg-[var(--color-crema)] transition-colors ${
        onClick ? "cursor-pointer" : ""
      }`}
    >
      {children}
    </tr>
  );
}
