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
export type RolTipo = "direccion" | "gerencial" | "ventas" | "administracion";

// OJO: nunca lleva la contraseña — ni en texto plano ni como hash. Ese dato
// vive aparte, en la tabla usuario_credenciales, y solo lo toca el servidor
// (ver src/lib/usuarios-server.ts, src/app/api/auth y src/app/api/usuarios).
// El cliente jamás lo recibe, así que este tipo no tiene ningún campo para
// él — usar UsuarioNuevo/UsuarioPatch (abajo) para crear una cuenta o
// cambiarle la contraseña.
export interface Usuario {
  id: string;
  nombre: string; // nombre de la cuenta — de área/cargo ("Ventas Uno"), no de persona
  nombreReal?: string; // solo Gerente General: su perfil, ya dentro del sistema, muestra este nombre
  cargo: string;
  rolTipo: RolTipo;
  rolLabel: string;
  iniciales: string;
  usuario: string; // usuario de acceso
  negocioId: NegocioId; // negocio al que pertenece la cuenta (Dirección no tiene uno fijo, ve los tres)
  creadoPor?: string; // id de quién creó la cuenta (siempre Mijael/Gerencial, para cuentas nuevas)
}

// Payload para crear una cuenta — la contraseña va en texto plano acá
// (viaja una sola vez, por HTTPS, hasta la ruta de servidor que la hashea;
// nunca se guarda así) pero no forma parte de Usuario en ningún momento.
export type UsuarioNuevo = Omit<Usuario, "id"> & { contrasena: string };

// Payload para editar una cuenta — contrasena es opcional: solo se manda
// cuando de verdad se quiere cambiar (en blanco = no tocarla).
export type UsuarioPatch = Partial<Omit<Usuario, "id">> & { contrasena?: string };

export type TipoDocumento = "DNI" | "Carné de extranjería" | "Pasaporte";
export type Genero = "Femenino" | "Masculino";

// --- Clientes individuales (hoja "BASE DE DATOS CLIENTES") -----------------
export interface ClienteIndividual {
  id: string;
  negocioId: NegocioId;
  numero: number;
  fechaRegistro: string; // ISO — solo el día, sin hora
  creadoEn?: string; // timestamp real (con hora) — para mostrar "hace X min/horas", no para filtrar por periodo
  nombres: string;
  apellidos: string;
  fechaNacimiento: string; // ISO
  celular: string;
  // Procedencia — cascada Departamento → Provincia → Distrito (Ayacucho/
  // Huamanga). Solo el departamento es obligatorio: fuera de Huamanga (o de
  // Ayacucho) no se pide más detalle, así que estos quedan en "" cuando no
  // aplican (nunca undefined, para no romper el texto donde se muestran).
  // Sin campo de país — el negocio solo atiende clientes de Perú, decisión
  // de Mijael (los pocos casos de otros países no ameritan el campo).
  departamento: string;
  provincia: string;
  distrito: string;
  // "crm" = registrado desde este formulario (Ventas/Gerencial, presencial)
  // — se marca solo, nadie lo elige a mano. "web" queda reservado para la
  // futura integración con las páginas web de cada negocio: el cliente
  // llega por código, ya etiquetado como "web" + su negocioId (ver
  // `origenWebPorNegocio` en metrics.ts) — no hace falta un valor de origen
  // distinto por sede, el negocioId ya lo distingue.
  origen: "crm" | "web";
  registradoPor?: string; // nombre de quién lo registró (cuando se agrega desde el sistema)
  // Campos investigados y agregados sobre el estándar del Excel original:
  tipoDocumento?: TipoDocumento;
  numeroDocumento?: string;
  email?: string;
  genero?: Genero;
  aceptaComunicaciones?: boolean; // consentimiento para campañas — buena práctica de CRM
}

// --- Clientes corporativos (hoja "BASE DE DATOS CORPORATIVO") --------------
export interface ClienteCorporativo {
  id: string;
  negocioId: NegocioId;
  numero: number;
  fechaRegistro: string; // ISO — solo el día, sin hora
  creadoEn?: string; // timestamp real (con hora) — para mostrar "hace X min/horas", no para filtrar por periodo
  razonSocial: string;
  ruc: string;
  direccion: string;
  celular: string; // del representante — es a quien Ventas de verdad contacta
  fechaAniversario: string;
  nombreRepresentante: string;
  cargoRepresentante: string;
  departamento: string;
  provincia: string;
  distrito: string;
  registradoPor?: string;
  aceptaComunicaciones?: boolean;
}

// --- Seguimiento de cumpleaños (hoja "SEGUIMIENTO") -------------------------
// Este módulo lo opera Ventas día a día; Gerencial supervisa y aprueba.
// Solo dos campos con dueño: Estado lo marca el sistema solo (saludoEnviado,
// en cuanto se manda el saludo), Reservación la actualiza Ventas a mano
// después de hablar con el cliente. "visto"/"respuesta" y los montos de
// reserva/consumo se quitaron — eran de más y ya no se usan en ningún lado.
export interface SeguimientoCumple {
  id: string;
  negocioId: NegocioId;
  clienteId: string;
  clienteTipo: "individual" | "corporativo";
  nombre: string;
  fechaCumple: string;
  celular: string;
  saludoEnviado: boolean;
  saludoEnviadoEn?: string; // timestamp real (con hora) de cuándo se mandó — para el chat, no para filtrar
  reservacion: "si" | "no" | "pendiente";
  // Personalización del saludo para ESTE cliente — si no están definidos, se
  // usa la plantilla/hora general del negocio (ver config_saludo_cumpleanos).
  mensajePersonalizado?: string;
  horaPersonalizada?: string; // "HH:mm"
}

// "Campaña" = un mensaje masivo por WhatsApp a un segmento de clientes del
// negocio — el único canal donde el sistema puede hacer algo real (el link
// wa.me abre WhatsApp de verdad, con el mensaje precargado). Instagram y
// Facebook se quitaron: no hay ni una integración real ni un atajo manual
// como wa.me, así que "campaña" ahí no era más que un dato sin acción detrás.
//
// Ciclo de vida: "borrador" (se puede editar nombre/sucursales/público/
// mensaje) → "aprobada" (Gerencial aprobó — el mensaje queda fijo, se
// congela la lista de clientes del segmento en `clientesObjetivo`, y se
// habilita la cola de envío). "contactados" son los clientes en los que YA
// se hizo clic en su WhatsApp — un registro honesto de intención, no una
// confirmación de que el mensaje se mandó de verdad (eso solo lo sabe quien
// lo envía a mano).
export type EstadoCampana = "borrador" | "aprobada";

export interface Campana {
  id: string;
  // Mismo patrón que `Festividad.alcance`: casi siempre una sola sucursal
  // (la que estaba activa al crearla), pero se puede armar una campaña que
  // llegue a 2 sedes puntuales o a "todas" — sin necesitar una pantalla
  // "Todas las sucursales" aparte. Se elige en el formulario, no en el
  // selector del Topbar.
  negocios: "todas" | NegocioId[];
  nombre: string;
  publico: "todos" | "natural" | "corporativo";
  mensaje: string;
  estado: EstadoCampana;
  creadaEn: string; // fecha ISO
  aprobadaEn?: string; // fecha ISO — solo si estado === "aprobada"
  clientesObjetivo?: string[]; // ids de clientes de todas las sedes incluidas, congelados al aprobar
  contactados: string[]; // ids de clientes ya contactados (clic en WhatsApp)
  // El histórico del mock no tiene cuenta que la creó — solo lo que arma
  // Gerencial desde el sistema se puede editar/aprobar/eliminar.
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

// --- Mensajería / chat simulado (reemplaza salir a WhatsApp) ---------------
export interface Mensaje {
  id: string;
  de: "negocio" | "cliente";
  texto: string;
  hora: string; // ISO timestamp
}
