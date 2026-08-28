// Tipos centrales del CRM — reflejan los campos reales del Excel de clientes
// (Meliza, Ventas) y los módulos definidos en el Plan de CRM del Grupo Las Flores.

export type NegocioId = "las-flores" | "umaru" | "mamina" | "todas";

export interface Negocio {
  id: NegocioId;
  nombre: string;
  tipo: "restaurante" | "hotel" | "restobar";
  operando: boolean;
  colorAcento: string;
  descripcionEstado: string;
}

// Los tres perfiles de permisos. Cualquier cuenta nueva que cree Mijael se
// asigna a uno de estos perfiles y hereda automáticamente sus permisos.
// - direccion: socios/directorio en Lima — solo un panel de métricas, cero acciones.
// - gerencial: Mijael — control operativo total de los 3 negocios.
// - ventas: el equipo de cada negocio (registra clientes, cumpleaños).
export type RolTipo = "direccion" | "gerencial" | "ventas";

export interface Usuario {
  id: string;
  nombre: string; // nombre de la cuenta — de área/cargo ("Ventas Uno"), no de persona
  nombreReal?: string; // solo Gerente General: su perfil, ya dentro del sistema, muestra este nombre
  cargo: string;
  rolTipo: RolTipo;
  rolLabel: string;
  iniciales: string;
  usuario: string; // usuario de acceso
  contrasena: string; // solo para el prototipo — en producción esto lo maneja Supabase Auth
  negocioId: NegocioId; // negocio al que pertenece la cuenta (Dirección no tiene uno fijo, ve los tres)
  creadoPor?: string; // id de quién creó la cuenta (siempre Mijael/Gerencial, para cuentas nuevas)
}

export type TipoDocumento = "DNI" | "Carné de extranjería" | "Pasaporte";
export type Genero = "Femenino" | "Masculino" | "Prefiere no decirlo";

// --- Clientes individuales (hoja "BASE DE DATOS CLIENTES") -----------------
export interface ClienteIndividual {
  id: string;
  negocioId: NegocioId;
  numero: number;
  fechaRegistro: string; // ISO
  nombres: string;
  apellidos: string;
  fechaNacimiento: string; // ISO
  celular: string;
  departamento: string;
  provincia: string;
  distrito: string;
  origen: "crm" | "web" | "redes-sociales" | "referido" | "importado-excel";
  observaciones?: string;
  registradoPor?: string; // nombre de quién lo registró (cuando se agrega desde el sistema)
  // Campos investigados y agregados sobre el estándar del Excel original:
  tipoDocumento?: TipoDocumento;
  numeroDocumento?: string;
  email?: string;
  genero?: Genero;
  direccionExacta?: string;
  aceptaComunicaciones?: boolean; // consentimiento para campañas — buena práctica de CRM
}

// --- Clientes corporativos (hoja "BASE DE DATOS CORPORATIVO") --------------
export interface ClienteCorporativo {
  id: string;
  negocioId: NegocioId;
  numero: number;
  fechaRegistro: string;
  razonSocial: string;
  ruc: string;
  direccion: string;
  celular: string;
  fechaAniversario: string;
  nombreRepresentante: string;
  cargoRepresentante: string;
  celularRepresentante: string;
  ciiu: string;
  actividadEconomica: string;
  departamento: string;
  provincia: string;
  distrito: string;
  registradoPor?: string;
  aceptaComunicaciones?: boolean;
}

export type CanalContacto = "web" | "whatsapp" | "telefono" | "presencial";

export interface Hospedaje {
  id: string;
  negocioId: NegocioId; // siempre "umaru"
  clienteId: string;
  clienteNombre: string;
  checkIn: string;
  checkOut: string;
  habitacion: string;
  tarifaNoche: number;
  canal: CanalContacto;
}

// --- Seguimiento de cumpleaños (hoja "SEGUIMIENTO") -------------------------
// Este módulo lo opera Ventas día a día; Gerencial supervisa y aprueba.
export interface SeguimientoCumple {
  id: string;
  negocioId: NegocioId;
  clienteId: string;
  clienteTipo: "individual" | "corporativo";
  nombre: string;
  fechaCumple: string;
  celular: string;
  saludoEnviado: boolean;
  visto: boolean;
  respuesta: "si" | "no" | "pendiente";
  reservacion: "si" | "no" | "pendiente";
  adelantoReserva?: number;
  montoConsumo?: number;
}

export interface Campana {
  id: string;
  negocioId: NegocioId;
  nombre: string;
  mes: string;
  totalClientes: number;
  enviados: number;
  canal: "whatsapp" | "instagram" | "facebook";
  // Campos de las campañas creadas desde el sistema (las históricas del mock no los tienen).
  mensaje?: string;
  publico?: "todos" | "natural" | "corporativo";
  registradoPor?: string;
  festividadId?: string;
}

// --- Días festivos y fechas comerciales -------------------------------------
export type TipoFestividad = "religioso" | "civico" | "comercial";

export interface Festividad {
  id: string;
  nombre: string;
  mesDia: string; // "MM-DD" — se repite cada año
  tipo: TipoFestividad;
  alcance: "todas" | NegocioId[];
  descripcion?: string;
}

export type FrecuenciaClasificacion = "nuevo" | "ocasional" | "frecuente" | "inactivo";

export interface ResumenCliente {
  totalVisitas: number;
  visitas30Dias: number;
  ultimaVisita: string | null;
  clasificacion: FrecuenciaClasificacion;
}

// --- Mensajería / chat simulado (reemplaza salir a WhatsApp) ---------------
export interface Mensaje {
  id: string;
  de: "negocio" | "cliente";
  texto: string;
  hora: string; // ISO timestamp
}
