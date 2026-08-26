"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Download, BedDouble, TrendingUp } from "lucide-react";
import { useApp } from "@/lib/app-context";
import { Topbar } from "@/components/layout/Topbar";
import { Card, CardHeader } from "@/components/ui/Card";
import { StatTile } from "@/components/ui/StatTile";
import { SearchInput } from "@/components/ui/SearchInput";
import { Table, Thead, Th, Tr, Td } from "@/components/ui/Table";
import { HOSPEDAJES } from "@/lib/mock/hospedaje";
import { exportarCSV } from "@/lib/export-csv";

export default function HospedajePage() {
  const { usuario, negocio } = useApp();
  const router = useRouter();
  const [busqueda, setBusqueda] = useState("");
  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return HOSPEDAJES;
    return HOSPEDAJES.filter((h) => h.clienteNombre.toLowerCase().includes(q));
  }, [busqueda]);

  const fueraDeAlcance = negocio.id !== "umaru";

  useEffect(() => {
    if (fueraDeAlcance) router.replace("/dashboard");
  }, [fueraDeAlcance, router]);

  if (!usuario || fueraDeAlcance) return null;

  const totalNoches = HOSPEDAJES.reduce((acc, h) => {
    const noches = Math.round((new Date(h.checkOut).getTime() - new Date(h.checkIn).getTime()) / 86400000);
    return acc + noches;
  }, 0);
  const ingresoTotal = HOSPEDAJES.reduce((acc, h) => {
    const noches = Math.round((new Date(h.checkOut).getTime() - new Date(h.checkIn).getTime()) / 86400000);
    return acc + noches * h.tarifaNoche;
  }, 0);

  function exportar() {
    exportarCSV(
      "hospedaje-umaru",
      ["Cliente", "Check-in", "Check-out", "Habitación", "Tarifa/noche", "Canal"],
      filtrados.map((h) => [h.clienteNombre, h.checkIn, h.checkOut, h.habitacion, h.tarifaNoche, h.canal])
    );
  }

  return (
    <>
      <Topbar
        titulo="Hospedaje"
        descripcion="Hotel Umaru · simulado — pendiente acceso a Camaleón o a la web del hotel"
      />
      <main className="flex-1 p-8 animate-fade-in space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatTile label="Estadías registradas" value={HOSPEDAJES.length} icon={<BedDouble size={18} />} tono="terracota" />
          <StatTile label="Noches ocupadas" value={totalNoches} icon={<BedDouble size={18} />} tono="azul" />
          <StatTile label="Ingreso estimado" value={`S/ ${ingresoTotal.toLocaleString("es-PE")}`} icon={<TrendingUp size={18} />} tono="verde" />
        </div>

        <div className="flex items-center gap-3 justify-end">
          <SearchInput value={busqueda} onChange={setBusqueda} placeholder="Buscar huésped…" />
          <button onClick={exportar} className="flex items-center gap-2 bg-[var(--color-verde)] text-white text-sm font-semibold rounded-xl px-4 py-2.5 hover:opacity-90 transition-opacity whitespace-nowrap">
            <Download size={15} /> Exportar
          </button>
        </div>

        <Card padding="p-0 pt-5">
          <CardHeader title="Estadías" subtitle="Datos simulados con la forma que tendrían al conectar Camaleón o la web del hotel" />
          <Table>
            <Thead>
              <Th>Huésped</Th><Th>Check-in</Th><Th>Check-out</Th><Th>Habitación</Th><Th>Tarifa/noche</Th><Th>Canal</Th>
            </Thead>
            <tbody>
              {filtrados.map((h) => (
                <Tr key={h.id}>
                  <Td className="font-medium">{h.clienteNombre}</Td>
                  <Td>{new Date(h.checkIn).toLocaleDateString("es-PE")}</Td>
                  <Td>{new Date(h.checkOut).toLocaleDateString("es-PE")}</Td>
                  <Td>{h.habitacion}</Td>
                  <Td>S/ {h.tarifaNoche}</Td>
                  <Td className="capitalize">{h.canal}</Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        </Card>
      </main>
    </>
  );
}
