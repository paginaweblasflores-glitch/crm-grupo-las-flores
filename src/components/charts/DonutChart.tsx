"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";

const PALETA = ["#8C3A25", "#E08A3E", "#3E6B4F", "#5C7C8C", "#B44B3C", "#B8AFA6"];

export function DonutChart({ data, altura = 220 }: { data: { nombre: string; valor: number }[]; altura?: number }) {
  const total = data.reduce((a, d) => a + d.valor, 0);
  if (total === 0) {
    return <p className="text-sm text-[var(--color-gris-medio)] text-center py-16">Sin datos todavía en este periodo.</p>;
  }
  return (
    <ResponsiveContainer width="100%" height={altura}>
      <PieChart>
        <Pie data={data} dataKey="valor" nameKey="nombre" innerRadius={46} outerRadius={74} paddingAngle={2}>
          {data.map((_, i) => <Cell key={i} fill={PALETA[i % PALETA.length]} stroke="white" strokeWidth={2} />)}
        </Pie>
        <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #E4DCD0", fontSize: 12 }} />
        <Legend verticalAlign="bottom" height={48} iconType="circle" wrapperStyle={{ fontSize: 11 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}
