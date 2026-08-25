"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export function BarChartMensual({ data }: { data: { mes: string; reservas: number; pedidos: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} barGap={4}>
        <CartesianGrid vertical={false} stroke="#E4DCD0" />
        <XAxis dataKey="mes" tick={{ fontSize: 12, fill: "#6B6259" }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 12, fill: "#6B6259" }} axisLine={false} tickLine={false} width={28} />
        <Tooltip
          cursor={{ fill: "#F7EFE3" }}
          contentStyle={{ borderRadius: 12, border: "1px solid #E4DCD0", fontSize: 12 }}
        />
        <Bar dataKey="reservas" name="Reservas" fill="#8C3A25" radius={[6, 6, 0, 0]} maxBarSize={22} />
        <Bar dataKey="pedidos" name="Delivery" fill="#E08A3E" radius={[6, 6, 0, 0]} maxBarSize={22} />
      </BarChart>
    </ResponsiveContainer>
  );
}
