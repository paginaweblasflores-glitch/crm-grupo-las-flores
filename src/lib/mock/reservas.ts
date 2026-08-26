import { Reserva, NegocioId, EstadoReserva, CanalContacto } from "@/lib/types";
import { CLIENTES_INDIVIDUALES } from "./clientes";
import { pick, randInt, randDiaConPeso, daysAgoISO } from "./seed";

const ESTADOS: EstadoReserva[] = ["confirmada", "atendida", "atendida", "atendida", "cancelada", "no-llego"];
const CANALES: CanalContacto[] = ["web", "web", "whatsapp", "telefono"];
const HORAS = ["12:30", "13:00", "13:30", "19:00", "19:30", "20:00", "20:30"];

function generarReservas(negocioId: NegocioId, cantidad: number): Reserva[] {
  const clientes = CLIENTES_INDIVIDUALES.filter((c) => c.negocioId === negocioId);
  const out: Reserva[] = [];
  for (let i = 0; i < cantidad; i++) {
    const cliente = pick(clientes);
    const diasAtras = randDiaConPeso(-6, 400); // algunas a futuro (confirmadas), 13 meses de historial con estacionalidad
    const fecha = daysAgoISO(diasAtras);
    const personas = randInt(2, 10);
    const estado: EstadoReserva = diasAtras < 0 ? "confirmada" : pick(ESTADOS);
    const tipo = personas > 8 ? "evento" : "mesa";
    out.push({
      id: `${negocioId}-res-${i + 1}`,
      negocioId,
      clienteId: cliente.id,
      clienteNombre: `${cliente.nombres} ${cliente.apellidos}`,
      fecha,
      hora: pick(HORAS),
      personas,
      tipo,
      canal: pick(CANALES),
      estado,
      monto: estado === "atendida" ? randInt(60, 480) : undefined,
      registradoEn: daysAgoISO(diasAtras + randInt(1, 4)),
      // Los eventos grandes los pide Ventas, pero los autoriza Gerencial.
      requiereAutorizacion: tipo === "evento",
    });
  }
  return out.sort((a, b) => (a.fecha < b.fecha ? 1 : -1));
}

export const RESERVAS: Reserva[] = [
  ...generarReservas("las-flores", 360), // ~13 meses de historial, densidad similar a la de antes por semana
  ...generarReservas("umaru", 40), // Umaru: solo eventos puntuales del salón, no es su fuerte
];

export function reservasPorNegocio(negocioId: NegocioId): Reserva[] {
  return RESERVAS.filter((r) => r.negocioId === negocioId);
}

export function reservasDeCliente(clienteId: string): Reserva[] {
  return RESERVAS.filter((r) => r.clienteId === clienteId);
}
