import { Hospedaje, CanalContacto } from "@/lib/types";
import { CLIENTES_INDIVIDUALES } from "./clientes";
import { pick, randInt, randDiaConPeso, daysAgoISO } from "./seed";

const clientesUmaru = CLIENTES_INDIVIDUALES.filter((c) => c.negocioId === "umaru");
const HABITACIONES = ["101", "102", "103", "104", "201", "202", "203", "204", "301", "302"];
const CANALES: CanalContacto[] = ["web", "telefono", "presencial"];

function generarHospedajes(cantidad: number): Hospedaje[] {
  const out: Hospedaje[] = [];
  for (let i = 0; i < cantidad; i++) {
    const cliente = pick(clientesUmaru);
    const diasAtras = randDiaConPeso(0, 400);
    const noches = randInt(1, 4);
    out.push({
      id: `umaru-hosp-${i + 1}`,
      negocioId: "umaru",
      clienteId: cliente.id,
      clienteNombre: `${cliente.nombres} ${cliente.apellidos}`,
      checkIn: daysAgoISO(diasAtras + noches),
      checkOut: daysAgoISO(diasAtras),
      habitacion: pick(HABITACIONES),
      tarifaNoche: randInt(110, 220),
      canal: pick(CANALES),
    });
  }
  return out.sort((a, b) => (a.checkIn < b.checkIn ? 1 : -1));
}

export const HOSPEDAJES: Hospedaje[] = generarHospedajes(150); // ~13 meses, con estacionalidad

export function hospedajesDeCliente(clienteId: string): Hospedaje[] {
  return HOSPEDAJES.filter((h) => h.clienteId === clienteId);
}
