"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";

interface Serie {
  key: string;
  nombre: string;
  color: string;
}

// Gráfico de barras genérico y reutilizable — una o más series, sobre
// cualquier eje X (día, mes, lo que sea). Reemplaza tener un componente de
// gráfico distinto por cada módulo.
export function BarChartSerie({
  data, series, xKey = "mes", altura = 220, todasLasEtiquetas = false,
}: {
  data: Record<string, string | number>[]; series: Serie[]; xKey?: string; altura?: number;
  // Con muchos puntos (ej. 30 días), Recharts por defecto "salta" etiquetas
  // del eje X para que no se encimen — la barra sigue ahí, pero su etiqueta
  // desaparece sin avisar, lo cual confunde ("¿por qué esta barra no dice
  // qué día es?"). `todasLasEtiquetas` fuerza a mostrarlas TODAS, rotadas,
  // en vez de dejar que Recharts decida cuáles ocultar.
  todasLasEtiquetas?: boolean;
}) {
  return (
    <ResponsiveContainer width="100%" height={altura + (todasLasEtiquetas ? 24 : 0)}>
      <BarChart data={data} barGap={4} margin={todasLasEtiquetas ? { bottom: 24 } : undefined}>
        <CartesianGrid vertical={false} stroke="#E4DCD0" />
        <XAxis
          dataKey={xKey}
          tick={{ fontSize: 11, fill: "#6B6259" }}
          axisLine={false}
          tickLine={false}
          interval={todasLasEtiquetas ? 0 : undefined}
          angle={todasLasEtiquetas ? -45 : undefined}
          textAnchor={todasLasEtiquetas ? "end" : undefined}
          height={todasLasEtiquetas ? 45 : undefined}
        />
        <YAxis tick={{ fontSize: 11, fill: "#6B6259" }} axisLine={false} tickLine={false} width={28} allowDecimals={false} />
        <Tooltip cursor={{ fill: "#F7EFE3" }} contentStyle={{ borderRadius: 12, border: "1px solid #E4DCD0", fontSize: 12 }} />
        {series.length > 1 && <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />}
        {series.map((s) => (
          <Bar key={s.key} dataKey={s.key} name={s.nombre} fill={s.color} radius={[6, 6, 0, 0]} maxBarSize={26} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
