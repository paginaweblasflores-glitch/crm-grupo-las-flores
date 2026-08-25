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
  data, series, xKey = "mes", altura = 220,
}: {
  data: Record<string, string | number>[]; series: Serie[]; xKey?: string; altura?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={altura}>
      <BarChart data={data} barGap={4}>
        <CartesianGrid vertical={false} stroke="#E4DCD0" />
        <XAxis dataKey={xKey} tick={{ fontSize: 11, fill: "#6B6259" }} axisLine={false} tickLine={false} />
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
