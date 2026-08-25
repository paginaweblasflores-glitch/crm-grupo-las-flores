import { CalendarCheck, Bike, BedDouble } from "lucide-react";
import { ActividadItem } from "@/lib/metrics";

const ICONOS = { reserva: CalendarCheck, delivery: Bike, hospedaje: BedDouble };
const TONOS = {
  reserva: "bg-[var(--color-terracota)]/10 text-[var(--color-terracota)]",
  delivery: "bg-[var(--color-naranja-claro)]/40 text-[var(--color-terracota-oscuro)]",
  hospedaje: "bg-[var(--color-azul-claro)] text-[var(--color-azul)]",
};

export function ActividadFeed({ items }: { items: ActividadItem[] }) {
  if (items.length === 0) {
    return <p className="text-sm text-[var(--color-gris-medio)] py-6 text-center">Sin actividad reciente.</p>;
  }
  return (
    <ul className="space-y-1">
      {items.map((item) => {
        const Icon = ICONOS[item.tipo];
        return (
          <li key={item.id} className="flex items-center gap-3 py-2.5 border-b border-[var(--color-gris-claro)]/20 last:border-0">
            <span className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${TONOS[item.tipo]}`}>
              <Icon size={15} />
            </span>
            <span className="flex-1 min-w-0">
              <span className="block text-sm font-medium text-[var(--color-gris)] truncate">{item.titulo}</span>
              <span className="block text-xs text-[var(--color-gris-medio)]">{item.detalle}</span>
            </span>
            <span className="text-[11px] text-[var(--color-gris-medio)] shrink-0">
              {new Date(item.fecha).toLocaleDateString("es-PE", { day: "2-digit", month: "short" })}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
