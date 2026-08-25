import { Search } from "lucide-react";

export function SearchInput({
  value,
  onChange,
  placeholder = "Buscar…",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="relative flex-1 max-w-sm">
      <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-gris-medio)]" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[var(--color-gris-claro)]/50 bg-white text-sm text-[var(--color-gris)] placeholder:text-[var(--color-gris-medio)] focus:outline-none focus:border-[var(--color-terracota)] transition-colors"
      />
    </div>
  );
}
