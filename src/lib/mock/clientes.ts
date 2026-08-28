import { ClienteIndividual, ClienteCorporativo, NegocioId } from "@/lib/types";
import {
  NOMBRES, APELLIDOS, RAZONES_SOCIALES, ACTIVIDADES_ECONOMICAS, DISTRITOS_AYACUCHO,
} from "./nombres";
import { pick, randInt, randPhone, randRuc, daysAgoISO, pad, BASE_DATE } from "./seed";

const ORIGENES: ClienteIndividual["origen"][] = [
  "crm", "web", "importado-excel",
];

function randFechaNacimiento(): string {
  const year = randInt(1955, 2006);
  const month = randInt(1, 12);
  const day = randInt(1, 28);
  return `${year}-${pad(month)}-${pad(day)}`;
}

function generarClientesIndividuales(negocioId: NegocioId, cantidad: number, offset: number): ClienteIndividual[] {
  const out: ClienteIndividual[] = [];
  for (let i = 0; i < cantidad; i++) {
    const nombres = pick(NOMBRES);
    const apellidos = `${pick(APELLIDOS)} ${pick(APELLIDOS)}`;
    const registrado = i === 0 ? 0 : i === 1 ? 1 : randInt(2, 400);
    out.push({
      id: `${negocioId}-cli-${offset + i + 1}`,
      negocioId,
      numero: offset + i + 1,
      fechaRegistro: daysAgoISO(registrado),
      nombres,
      apellidos,
      fechaNacimiento: randFechaNacimiento(),
      celular: randPhone(),
      tipoDocumento: "DNI",
      numeroDocumento: String(randInt(40000000, 79999999)),
      departamento: "Ayacucho",
      provincia: "Huamanga",
      distrito: pick(DISTRITOS_AYACUCHO),
      origen: pick(ORIGENES),
    });
  }
  return out;
}

function generarCorporativos(negocioId: NegocioId, cantidad: number, offset: number): ClienteCorporativo[] {
  const out: ClienteCorporativo[] = [];
  const usados = new Set<string>();
  for (let i = 0; i < cantidad; i++) {
    let razon = pick(RAZONES_SOCIALES);
    while (usados.has(razon) && usados.size < RAZONES_SOCIALES.length) razon = pick(RAZONES_SOCIALES);
    usados.add(razon);
    const registrado = randInt(1, 380);
    out.push({
      id: `${negocioId}-corp-${offset + i + 1}`,
      negocioId,
      numero: offset + i + 1,
      fechaRegistro: daysAgoISO(registrado),
      razonSocial: razon,
      ruc: randRuc(),
      direccion: `Jr. ${pick(APELLIDOS)} ${randInt(100, 950)}, ${pick(DISTRITOS_AYACUCHO)}, Ayacucho`,
      celular: randPhone(),
      fechaAniversario: `${randInt(1995, 2018)}-${pad(randInt(1, 12))}-${pad(randInt(1, 28))}`,
      nombreRepresentante: `${pick(NOMBRES)} ${pick(APELLIDOS)}`,
      cargoRepresentante: pick(["Gerente General", "Administrador", "Jefe de Recursos Humanos", "Asistente de Gerencia"]),
      celularRepresentante: randPhone(),
      ciiu: String(randInt(1000, 9999)),
      actividadEconomica: pick(ACTIVIDADES_ECONOMICAS),
      departamento: "Ayacucho",
      provincia: "Huamanga",
      distrito: pick(DISTRITOS_AYACUCHO),
    });
  }
  return out;
}

// Cumpleaños fijados a propósito (relativos a hoy) para que el módulo de
// Cumpleaños siempre tenga algo que mostrar en la demo, sin depender del azar.
function clientesConCumpleFijo(negocioId: NegocioId, offset: number): ClienteIndividual[] {
  const hoy = BASE_DATE;
  const fechaEnDias = (dias: number) => {
    const d = new Date(hoy);
    d.setDate(d.getDate() + dias);
    return `${randInt(1970, 2002)}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  };
  const desplazamientos = [0, 0, 2, 5, 8, 10, -3, -6, -10]; // hoy, hoy, y repartidos alrededor
  return desplazamientos.map((dias, i) => ({
    id: `${negocioId}-cli-fijo-${i + 1}`,
    negocioId,
    numero: offset + i + 1,
    fechaRegistro: daysAgoISO(randInt(20, 300)),
    nombres: pick(NOMBRES),
    apellidos: `${pick(APELLIDOS)} ${pick(APELLIDOS)}`,
    fechaNacimiento: fechaEnDias(dias),
    celular: randPhone(),
    departamento: "Ayacucho",
    provincia: "Huamanga",
    distrito: pick(DISTRITOS_AYACUCHO),
    origen: pick(ORIGENES),
  }));
}

// Atribuye clientes ya existentes a una cuenta de Ventas — así el
// comparativo de equipo de Gerencial no aparece vacío antes de que alguien
// registre un cliente nuevo desde el sistema. Guarda el `id` ESTABLE de la
// cuenta (no el nombre que se muestra en pantalla) — así renombrar una
// cuenta desde Usuarios no rompe la atribución histórica.
function atribuirA(clientes: ClienteIndividual[], usuarioId: string): ClienteIndividual[] {
  return clientes.map((c) => ({ ...c, registradoPor: usuarioId }));
}

const LAS_FLORES_INDIVIDUALES = generarClientesIndividuales("las-flores", 52, 0);
// Asegurar que el primer cliente de Ventas Dos (índice 18) tenga fecha de hoy reciente
if (LAS_FLORES_INDIVIDUALES[18]) {
  LAS_FLORES_INDIVIDUALES[18].fechaRegistro = daysAgoISO(0);
}

const UMARU_INDIVIDUALES = generarClientesIndividuales("umaru", 38, 0);
const MAMINA_INDIVIDUALES = generarClientesIndividuales("mamina", 30, 0);

export const CLIENTES_INDIVIDUALES: ClienteIndividual[] = [
  ...atribuirA(LAS_FLORES_INDIVIDUALES.slice(0, 18), "betsy"), // Ventas Uno
  ...atribuirA(LAS_FLORES_INDIVIDUALES.slice(18, 30), "melisa"), // Ventas Dos
  ...LAS_FLORES_INDIVIDUALES.slice(30),
  ...clientesConCumpleFijo("las-flores", 52),
  ...atribuirA(UMARU_INDIVIDUALES.slice(0, 15), "carla"), // Ventas Tres
  ...UMARU_INDIVIDUALES.slice(15),
  ...clientesConCumpleFijo("umaru", 38),
  // Mamina no tiene cuenta de Ventas por ahora — estos clientes quedan sin
  // vendedor asignado, en vez de atribuirse a una cuenta que ya no existe.
  ...MAMINA_INDIVIDUALES,
  ...clientesConCumpleFijo("mamina", 30),
];

export const CLIENTES_CORPORATIVOS: ClienteCorporativo[] = [
  ...generarCorporativos("las-flores", 14, 0),
  ...generarCorporativos("umaru", 9, 0),
  ...generarCorporativos("mamina", 6, 0),
];

export function clientesIndividualesPorNegocio(negocioId: NegocioId): ClienteIndividual[] {
  if (negocioId === "todas") return CLIENTES_INDIVIDUALES;
  return CLIENTES_INDIVIDUALES.filter((c) => c.negocioId === negocioId);
}

export function corporativosPorNegocio(negocioId: NegocioId): ClienteCorporativo[] {
  if (negocioId === "todas") return CLIENTES_CORPORATIVOS;
  return CLIENTES_CORPORATIVOS.filter((c) => c.negocioId === negocioId);
}

export function buscarClienteIndividual(id: string): ClienteIndividual | undefined {
  return CLIENTES_INDIVIDUALES.find((c) => c.id === id);
}

export function buscarClienteCorporativo(id: string): ClienteCorporativo | undefined {
  return CLIENTES_CORPORATIVOS.find((c) => c.id === id);
}
