import { Pedido, EstadoPedido, CanalContacto, NegocioId } from "@/lib/types";
import { CLIENTES_INDIVIDUALES } from "./clientes";
import { PRODUCTOS_CARTA } from "./nombres";
import { pick, pickMany, randInt, randDiaConPeso, daysAgoISO } from "./seed";

// El delivery, por ahora, solo existe en la web de Las Flores.
const ESTADOS: EstadoPedido[] = ["entregado", "entregado", "entregado", "en-camino", "cancelado"];
const CANALES: CanalContacto[] = ["web", "whatsapp"];

const clientesLasFlores = CLIENTES_INDIVIDUALES.filter((c) => c.negocioId === "las-flores");

function generarPedidos(cantidad: number): Pedido[] {
  const out: Pedido[] = [];
  for (let i = 0; i < cantidad; i++) {
    const cliente = pick(clientesLasFlores);
    const diasAtras = randDiaConPeso(0, 400);
    const productos = pickMany(PRODUCTOS_CARTA, randInt(1, 3));
    out.push({
      id: `las-flores-ped-${i + 1}`,
      negocioId: "las-flores",
      clienteId: cliente.id,
      clienteNombre: `${cliente.nombres} ${cliente.apellidos}`,
      fecha: daysAgoISO(diasAtras),
      productos,
      monto: productos.length * randInt(22, 38),
      canal: pick(CANALES),
      estado: diasAtras === 0 ? pick(["en-camino", "entregado"]) : pick(ESTADOS),
      registradoEn: daysAgoISO(diasAtras),
      registradoPor: i % 2 === 0 ? "Betsy" : "Melisa",
    });
  }
  return out.sort((a, b) => (a.fecha < b.fecha ? 1 : -1));
}

export const PEDIDOS: Pedido[] = generarPedidos(500); // ~13 meses, con estacionalidad (ver randDiaConPeso)

export function pedidosDeCliente(clienteId: string): Pedido[] {
  return PEDIDOS.filter((p) => p.clienteId === clienteId);
}

export function pedidosPorNegocio(negocioId: NegocioId): Pedido[] {
  if (negocioId === "todas") return PEDIDOS;
  return PEDIDOS.filter((p) => p.negocioId === negocioId);
}
