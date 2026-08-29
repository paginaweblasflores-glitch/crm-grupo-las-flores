"use client";

import { Negocio } from "@/lib/types";
import { clientesPorTipoPeriodo } from "@/lib/metrics";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

// Tarjetas comparativas por sede — compartidas entre el Panel Ejecutivo
// (Dirección, siempre en modo grupo) y el Panel Gerencial (solo cuando la
// vista activa es "Todas las sucursales" — en un negocio específico no debe
// haber comparativas, son independientes). Vivir en un solo archivo evita
// que los 2 paneles se desalineen visualmente con el tiempo.

// Puesto 1/2/3 explícito — el orden de las tarjetas ya cambia solo (están
// ordenadas por el número real), pero un número visible deja claro que es
// un ranking que se mueve, no un orden fijo que coincide por casualidad.
export function PuestoBadge({ posicion }: { posicion: number }) {
  return (
    <span
      className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
        posicion === 0
          ? "bg-amber-100 text-amber-800 border border-amber-300"
          : posicion === 1
          ? "bg-slate-100 text-slate-700 border border-slate-300"
          : "bg-orange-50 text-orange-700 border border-orange-200"
      }`}
    >
      {posicion + 1}
    </span>
  );
}

export function Cambio({ valor }: { valor: number | null }) {
  if (valor === null) return null;
  const positivo = valor >= 0;
  return (
    <span className={`text-[10px] font-bold ${positivo ? "text-[var(--color-verde)]" : "text-[var(--color-rojo)]"}`}>
      {positivo ? "↑" : "↓"}{Math.abs(valor)}%
    </span>
  );
}

interface ItemCrecimiento {
  negocio: Negocio;
  clientes: ReturnType<typeof clientesPorTipoPeriodo>;
}

// "Quién está captando más clientes de cada sede" — ordena de mayor a menor
// (individuales + corporativos) y marca al líder con 🏆.
export function ComparativoCrecimientoPorNegocio({ items, vistaDescripcion }: { items: ItemCrecimiento[]; vistaDescripcion: string }) {
  const ordenado = [...items].sort(
    (a, b) => (b.clientes.individuales + b.clientes.corporativos) - (a.clientes.individuales + a.clientes.corporativos)
  );
  return (
    <Card>
      <CardHeader
        title="Comparativo por negocio"
        subtitle={`Quién está captando más clientes de cada sede · ${vistaDescripcion}`}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {ordenado.map(({ negocio, clientes: c }, idx) => (
          <div key={negocio.id} className="rounded-xl border border-[var(--color-gris-claro)]/40 p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="flex items-center gap-2 font-semibold text-[var(--color-gris)]">
                <PuestoBadge posicion={idx} />
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: negocio.colorAcento }} />
                {negocio.nombre}
                {idx === 0 && (c.individuales + c.corporativos) > 0 && <span title="Líder en captación">🏆</span>}
              </span>
              <Badge tono="gris">{negocio.tipo === "hotel" ? "Hotel" : "Restaurante"}</Badge>
            </div>
            <dl className="grid grid-cols-2 gap-y-2.5 text-sm">
              <dt className="text-[var(--color-gris-medio)]">Clientes individuales</dt>
              <dd className="text-right font-semibold text-[var(--color-gris)]">
                {c.individuales} <Cambio valor={c.individualesCambio} />
              </dd>
              <dt className="text-[var(--color-gris-medio)]">Clientes corporativos</dt>
              <dd className="text-right font-semibold text-[var(--color-gris)]">
                {c.corporativos} <Cambio valor={c.corporativosCambio} />
              </dd>
            </dl>
          </div>
        ))}
      </div>
    </Card>
  );
}

interface ItemFidelizacion {
  negocio: Negocio;
  cumple: { enviados: number; convertidos: number };
}

// "Cuánto convierte cada sede" — ordena por TASA de conversión (no cantidad
// bruta), así una sede chica que convierte bien no queda tapada por una más
// grande que solo manda más saludos. Sin saludos enviados no entra al
// ranking (tasa -1) — no hay nada que medir todavía, no es un 0% real.
export function ComparativoFidelizacionPorNegocio({ items, vistaDescripcion }: { items: ItemFidelizacion[]; vistaDescripcion: string }) {
  const ordenado = [...items]
    .map((x) => ({ ...x, tasa: x.cumple.enviados > 0 ? x.cumple.convertidos / x.cumple.enviados : -1 }))
    .sort((a, b) => b.tasa - a.tasa);
  return (
    <Card>
      <CardHeader
        title="Cumpleaños → visita, por negocio"
        subtitle={`Conversión de saludo de cumpleaños en visita, en cada sede · ${vistaDescripcion}`}
      />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {ordenado.map(({ negocio, cumple }, idx) => (
          <div key={negocio.id} className="rounded-xl border border-[var(--color-gris-claro)]/40 p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="flex items-center gap-2 font-semibold text-[var(--color-gris)]">
                <PuestoBadge posicion={idx} />
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: negocio.colorAcento }} />
                {negocio.nombre}
                {idx === 0 && cumple.convertidos > 0 && <span title="Mayor tasa de conversión">🏆</span>}
              </span>
            </div>
            {cumple.enviados === 0 ? (
              <p className="text-xs text-[var(--color-gris-medio)]">Sin saludos de cumpleaños enviados todavía en {negocio.nombre}.</p>
            ) : (
              <p className="text-sm text-[var(--color-gris)]">
                De <span className="font-semibold">{cumple.enviados}</span> mensajes enviados, confirmaron el regreso{" "}
                <span className="font-semibold text-[var(--color-verde)]">{cumple.convertidos}</span>
              </p>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}
