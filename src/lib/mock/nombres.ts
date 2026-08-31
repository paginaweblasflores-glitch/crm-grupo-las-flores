// Nombres ficticios de ejemplo (no corresponden a clientes reales) usados
// para generar datos de demostración con forma realista.

export const NOMBRES = [
  "Rosa", "Luis", "Carmen", "Jorge", "Elena", "Miguel", "Teresa", "Andrés",
  "Flor", "Ricardo", "Silvia", "Fernando", "Yesenia", "Gustavo", "Milagros",
  "Percy", "Nancy", "Wilmer", "Katherine", "Edwin", "Yolanda", "Raúl",
  "Marisol", "Hugo", "Dina", "Julio César", "Estefanía", "Marco Antonio",
  "Gladys", "Vidal", "Noemí", "Alberto", "Cinthia", "Franklin", "Betty",
  "Rómulo", "Yaneth", "Elmer", "Rocío", "Wilson",
] as const;

export const APELLIDOS = [
  "Quispe", "Huamán", "Rojas", "Cárdenas", "Palomino", "Sulca", "Cárdenas",
  "Prado", "Ochoa", "Aguirre", "Valenzuela", "Tinco", "Berrocal", "Ccanto",
  "Ayala", "Torres", "Vargas", "Pariona", "Meneses", "Gutiérrez", "Chávez",
  "Bautista", "Escobar", "Retamozo", "Loayza", "Cconislla", "Anampa",
  "Curi", "Mendoza", "Espinoza",
] as const;

export const RAZONES_SOCIALES = [
  "Corporación Andina de Turismo S.A.C.",
  "Grupo Educativo San Ramón E.I.R.L.",
  "Ferretería Los Andes S.R.L.",
  "Textiles Huamanga S.A.C.",
  "Constructora Wari S.A.C.",
  "Transportes Ayacucho Express S.A.",
  "Minera Sur del Perú S.A.C.",
  "Colegio Particular Santa Rosa",
  "Distribuidora Central del Sur S.A.C.",
  "Estudio Jurídico Chávez & Asociados",
  "Clínica San José de Huamanga",
  "Cooperativa Agraria Los Libertadores",
  "Panificadora Ayacuchana S.A.C.",
  "Instituto Superior Tecnológico Wari",
  "Municipalidad Distrital de Jesús Nazareno",
] as const;

// Procedencia del cliente — cascada País → Departamento → Provincia →
// Distrito (ver NuevoClienteForm). Listas cortas a propósito: el negocio es
// local de Huamanga, así que casi todos los clientes caen en los valores por
// defecto (Perú / Ayacucho / Huamanga); estas son solo las opciones más
// comunes fuera de eso — cualquier otra se escribe a mano con "Otro".
export const PAISES = ["Perú", "Chile", "Argentina", "Bolivia", "Estados Unidos", "España"] as const;

export const DEPARTAMENTOS_PERU = [
  "Ayacucho", "Lima", "Huancavelica", "Apurímac", "Ica", "Cusco", "Junín",
] as const;

export const PROVINCIAS_AYACUCHO = [
  "Huamanga", "Cangallo", "Huanca Sancos", "Huanta", "La Mar", "Lucanas",
  "Parinacochas", "Páucar del Sara Sara", "Sucre", "Víctor Fajardo", "Vilcas Huamán",
] as const;

// Distritos de la provincia de Huamanga — es la única provincia con detalle
// a nivel de distrito (el negocio opera ahí); el resto de provincias/
// departamentos/países solo llegan hasta su propio nivel en la cascada.
export const DISTRITOS_AYACUCHO = [
  "Huamanga", "Ayacucho", "Andrés Avelino Cáceres", "Jesús Nazareno",
  "Carmen Alto", "San Juan Bautista", "Socos", "Acocro",
] as const;

export const PRODUCTOS_CARTA = [
  "Puca picante", "Cuy chactado", "Mondongo", "Chicharrón ayacuchano",
  "Trucha apanada", "Cóctel de autor", "Chicha morada", "Puchero",
  "Rellena ayacuchana", "Adobo huamanguino", "Sopa de mote",
  "Postre de la casa",
] as const;
