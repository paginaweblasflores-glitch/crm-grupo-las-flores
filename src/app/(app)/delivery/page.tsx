"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Download, DollarSign, Package, Plus, Globe2, X } from "lucide-react";
import { useApp } from "@/lib/app-context";
import { puedeCrearReservasDelivery } from "@/lib/permissions";
import { usePedidosCreados } from "@/lib/store";
import { Topbar } from "@/components/layout/Topbar";
import { Card, CardHeader } from "@/components/ui/Card";
import { StatTile } from "@/components/ui/StatTile";
import { SearchInput } from "@/components/ui/SearchInput";
import { Badge, type Tono } from "@/components/ui/Badge";
import { Table, Thead, Th, Tr, Td } from "@/components/ui/Table";
import { PEDIDOS } from "@/lib/mock/pedidos";
import { pedidosPorPeriodo } from "@/lib/metrics";
import { exportarCSV } from "@/lib/export-csv";
import { requerido, celularPeru, soloLetras, nombrePersona, Errores } from "@/lib/validacion";
import { EstadoPedido, Pedido } from "@/lib/types";

const ESTADO_TONO: Record<EstadoPedido, Tono> = {
  "en-preparacion": "naranja",
  "en-camino": "azul",
  entregado: "verde",
  cancelado: "rojo",
};
const ESTADO_LABEL: Record<EstadoPedido, string> = {
  "en-preparacion": "En preparación",
  "en-camino": "En camino",
  entregado: "Entregado",
  cancelado: "Cancelado",
};

export default function DeliveryPage() {
  const { usuario, negocio } = useApp();
  const router = useRouter();
  const [busqueda, setBusqueda] = useState("");
  const [formAbierto, setFormAbierto] = useState(false);
  const { items: creados, add: agregarPedido } = usePedidosCreados();

  const todos = useMemo(() => [...creados, ...PEDIDOS], [creados]);
  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return todos;
    return todos.filter((p) => p.clienteNombre.toLowerCase().includes(q));
  }, [todos, busqueda]);

  const fueraDeAlcance = negocio.id !== "las-flores";

  useEffect(() => {
    if (fueraDeAlcance) router.replace("/dashboard");
  }, [fueraDeAlcance, router]);

  if (!usuario || fueraDeAlcance) return null;

  function exportar() {
    exportarCSV(
      "delivery-las-flores",
      ["Cliente", "Fecha", "Productos", "Monto", "Canal", "Estado"],
      filtrados.map((p) => [p.clienteNombre, p.fecha, p.productos.join(" · "), p.monto, p.canal, p.estado])
    );
  }

  const semana = pedidosPorPeriodo("las-flores", "semana");

  return (
    <>
      <Topbar titulo="Delivery" descripcion="Restaurante Las Flores · simulado, pendiente de conexión real a la web" />
      <main className="flex-1 p-8 animate-fade-in space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <StatTile label="Pedidos esta semana" value={semana.total} icon={<Package size={18} />} tono="terracota" />
          <StatTile label="Monto vendido (semana)" value={`S/ ${semana.monto}`} icon={<DollarSign size={18} />} tono="verde" />
        </div>

        {formAbierto && (
          <NuevoPedidoForm
            registradoPor={usuario.nombre}
            onCancelar={() => setFormAbierto(false)}
            onGuardar={(p) => { agregarPedido(p); setFormAbierto(false); }}
          />
        )}

        <div className="flex items-center gap-3 justify-end">
          <SearchInput value={busqueda} onChange={setBusqueda} placeholder="Buscar cliente…" />
          {puedeCrearReservasDelivery(usuario.rolTipo) && !formAbierto && (
            <button onClick={() => setFormAbierto(true)} className="flex items-center gap-2 bg-[var(--color-terracota)] text-white text-sm font-semibold rounded-xl px-4 py-2.5 hover:opacity-90 transition-opacity whitespace-nowrap">
              <Plus size={15} /> Nuevo pedido
            </button>
          )}
          <button onClick={exportar} className="flex items-center gap-2 bg-[var(--color-verde)] text-white text-sm font-semibold rounded-xl px-4 py-2.5 hover:opacity-90 transition-opacity whitespace-nowrap">
            <Download size={15} /> Exportar
          </button>
        </div>

        <Card padding="p-0 pt-5">
          <Table>
            <Thead>
              <Th>Cliente</Th><Th>Fecha</Th><Th>Productos</Th><Th>Monto</Th><Th>Canal</Th><Th>Estado</Th><Th>{" "}</Th>
            </Thead>
            <tbody>
              {filtrados.map((p) => (
                <Tr key={p.id}>
                  <Td className="font-medium">{p.clienteNombre}</Td>
                  <Td>{new Date(p.fecha).toLocaleDateString("es-PE")}</Td>
                  <Td className="max-w-xs truncate">{p.productos.join(", ")}</Td>
                  <Td>S/ {p.monto}</Td>
                  <Td className="capitalize">{p.canal}</Td>
                  <Td><Badge tono={ESTADO_TONO[p.estado]}>{ESTADO_LABEL[p.estado]}</Badge></Td>
                  <Td>
                    {p.enviadoAWeb && (
                      <span title="Enviado a la web de Las Flores" className="inline-flex items-center gap-1 text-[10px] font-semibold text-[var(--color-azul)]">
                        <Globe2 size={12} /> Web
                      </span>
                    )}
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        </Card>
      </main>
    </>
  );
}

function NuevoPedidoForm({
  registradoPor, onGuardar, onCancelar,
}: {
  registradoPor: string; onGuardar: (p: Pedido) => void; onCancelar: () => void;
}) {
  const [clienteNombre, setClienteNombre] = useState("");
  const [celular, setCelular] = useState("");
  const [productos, setProductos] = useState("");
  const [monto, setMonto] = useState(0);
  const [canal, setCanal] = useState<Pedido["canal"]>("whatsapp");
  const [errores, setErrores] = useState<Errores>({});

  function validar(): Errores {
    const err: Errores = {};
    const eNombre = nombrePersona(clienteNombre, "El nombre del cliente");
    if (eNombre) err.clienteNombre = eNombre;
    const eCelular = celularPeru(celular);
    if (eCelular) err.celular = eCelular;
    const eProductos = requerido(productos, "Los productos");
    if (eProductos) err.productos = eProductos;
    if (monto <= 0) err.monto = "El monto debe ser mayor a 0.";
    return err;
  }

  function guardar(e: React.FormEvent) {
    e.preventDefault();
    const err = validar();
    setErrores(err);
    if (Object.keys(err).length > 0) return;
    onGuardar({
      id: `las-flores-ped-manual-${Date.now()}`,
      negocioId: "las-flores",
      clienteId: `manual-${Date.now()}`,
      clienteNombre: clienteNombre.trim(),
      fecha: new Date().toISOString().slice(0, 10),
      productos: productos.split(",").map((p) => p.trim()).filter(Boolean),
      monto,
      canal,
      estado: "en-preparacion",
      registradoEn: new Date().toISOString(),
      registradoPor,
      enviadoAWeb: true,
    });
  }

  return (
    <Card className="animate-fade-in">
      <div className="flex items-center justify-between mb-1">
        <CardHeader title="Nuevo pedido" subtitle="Al guardar se marca como enviado a la web de Las Flores" />
        <button onClick={onCancelar} className="text-[var(--color-gris-medio)] hover:text-[var(--color-gris)]">
          <X size={18} />
        </button>
      </div>
      <form onSubmit={guardar} noValidate className="grid sm:grid-cols-2 gap-3">
        <Campo label="Nombre del cliente" requerido error={errores.clienteNombre}>
          <input value={clienteNombre} onChange={(e) => setClienteNombre(soloLetras(e.target.value))} className="input" />
        </Campo>
        <Campo label="Celular" requerido error={errores.celular}>
          <input value={celular} onChange={(e) => setCelular(e.target.value.replace(/\D/g, "").slice(0, 9))} maxLength={9} inputMode="numeric" placeholder="9XXXXXXXX" className="input" />
        </Campo>
        <Campo label="Productos (separados por coma)" requerido error={errores.productos}>
          <input value={productos} onChange={(e) => setProductos(e.target.value)} placeholder="Lomo saltado, Chicha morada" className="input" />
        </Campo>
        <Campo label="Monto (S/)" requerido error={errores.monto}>
          <input type="number" min={0} step="0.5" value={monto} onChange={(e) => setMonto(Number(e.target.value))} className="input" />
        </Campo>
        <Campo label="Canal">
          <select value={canal} onChange={(e) => setCanal(e.target.value as Pedido["canal"])} className="input bg-white">
            <option value="whatsapp">WhatsApp</option>
            <option value="web">Web</option>
            <option value="telefono">Teléfono</option>
          </select>
        </Campo>
        <div className="sm:col-span-2 flex justify-end gap-2 pt-1">
          <button type="button" onClick={onCancelar} className="text-sm font-medium text-[var(--color-gris-medio)] px-4 py-2">Cancelar</button>
          <button type="submit" className="bg-[var(--color-terracota)] text-white text-sm font-semibold rounded-xl px-5 py-2.5 hover:opacity-90 transition-opacity">Guardar pedido</button>
        </div>
      </form>
    </Card>
  );
}

function Campo({
  label, children, requerido, error,
}: {
  label: string; children: React.ReactNode; requerido?: boolean; error?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-[var(--color-gris-medio)] mb-1">
        {label} {requerido && <span className="text-[var(--color-rojo)]">*</span>}
      </label>
      {children}
      {error && <p className="text-[11px] text-[var(--color-rojo)] mt-1 font-medium">{error}</p>}
    </div>
  );
}
