// Tipos centrales del CRM — reflejan los campos reales del Excel de clientes
// (Meliza, Ventas) y los módulos definidos en el Plan de CRM del Grupo Las Flores.

export type NegocioId = "las-flores" | "umaru" | "mamina";

export interface Negocio {
  id: NegocioId;
  nombre: string;
  tipo: "restaurante" | "hotel" | "restobar";
  operando: boolean;
  colorAcento: string;
  descripcionEstado: string;
}

// Los tres perfiles de permisos. Cualquier cuenta nueva que cree Betsy se
// asigna a uno de estos perfiles y hereda automáticamente sus permisos.
export type RolTipo = "direccion" | "administracion" | "ventas";

export interface Usuario {
  id: string;
  nombre: string;
  cargo: string;
  rolTipo: RolTipo;
  rolLabel: string;
  iniciales: string;
  usuario: string; // usuario de acceso
  contrasena: string; // solo para el prototipo — en producción esto lo maneja Supabase Auth
  negocioId: NegocioId; // negocio al que pertenece la cuenta (Dirección no tiene uno fijo, ve los tres)
  creadoPor?: string; // id de quién creó la cuenta (siempre Betsy, para cuentas nuevas)
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
  origen: "web-reservas" | "web-delivery" | "presencial" | "redes-sociales" | "referido" | "importado-excel";
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

export type EstadoReserva = "confirmada" | "atendida" | "cancelada" | "no-llego";
export type CanalContacto = "web" | "whatsapp" | "telefono" | "presencial";

export interface Reserva {
  id: string;
  negocioId: NegocioId;
  clienteId: string;
  clienteNombre: string;
  fecha: string; // ISO fecha de la reserva
  hora: string;
  personas: number;
  tipo: "mesa" | "evento";
  canal: CanalContacto;
  estado: EstadoReserva;
  monto?: number;
  registradoEn: string; // ISO timestamp de creación
  requiereAutorizacion: boolean; // eventos grandes: los autoriza Administración, no Ventas
}

export type EstadoPedido = "en-preparacion" | "en-camino" | "entregado" | "cancelado";

export interface Pedido {
  id: string;
  negocioId: NegocioId;
  clienteId: string;
  clienteNombre: string;
  fecha: string;
  productos: string[];
  monto: number;
  canal: CanalContacto;
  estado: EstadoPedido;
  registradoEn: string;
}

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
// Este módulo lo opera Ventas día a día; Administración supervisa y aprueba;
// Dirección solo ve los números agregados (Capítulo 14 del Plan de CRM, ajustado).
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
}

export type FrecuenciaClasificacion = "nuevo" | "ocasional" | "frecuente" | "inactivo";

export interface ResumenCliente {
  totalVisitas: number;
  visitas30Dias: number;
  ultimaVisita: string | null;
  gastoTotal: number;
  clasificacion: FrecuenciaClasificacion;
}

// --- Mensajería / chat simulado (reemplaza salir a WhatsApp) ---------------
export interface Mensaje {
  id: string;
  de: "negocio" | "cliente";
  texto: string;
  hora: string; // ISO timestamp
}
