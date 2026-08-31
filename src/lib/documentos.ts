// Identidad visual compartida por los documentos exportados (PDF y Excel):
// qué logo y qué nombre van en el encabezado. Mismo criterio que ya usa el
// resto del sistema (Topbar, gráficos comparativos, etc.) — si el reporte
// es consolidado (los 3 negocios) se usa la marca del grupo; si es de un
// negocio puntual, se usa el logo y nombre de ese negocio.
import { NEGOCIOS_SEDES } from "./mock/negocios";
import { NegocioId } from "./types";

export type MarcaDocumento = {
  nombre: string;
  logoUrl: string;
  color: string;
};

const LOGOS_POR_NEGOCIO: Record<string, string> = {
  "las-flores": "/logos-doc/logo-las-flores.webp",
  umaru: "/logos-doc/logo-umaru.webp",
  mamina: "/logos-doc/logo-mamina.webp",
};

export function marcaDocumento(negocioId: NegocioId): MarcaDocumento {
  if (negocioId === "todas") {
    // Mismo logo que el login/sidebar — es el logo "del grupo" en todo el
    // resto del sistema, así que un reporte consolidado usa el mismo.
    return { nombre: "Consorcio Las Flores", logoUrl: "/logo.png", color: "#8c3a25" };
  }
  const negocio = NEGOCIOS_SEDES.find((n) => n.id === negocioId);
  return {
    nombre: negocio?.nombre ?? "Consorcio Las Flores",
    logoUrl: LOGOS_POR_NEGOCIO[negocioId] ?? "/logo.png",
    color: negocio?.colorAcento ?? "#8c3a25",
  };
}

// jsPDF y ExcelJS necesitan los bytes de la imagen (no una URL) para
// incrustarla, y ninguno de los dos maneja bien un .webp de entrada — se
// decodifica la imagen (el navegador entiende webp/png/lo que sea) sobre un
// canvas y se re-exporta siempre como PNG, formato que ambas librerías
// soportan sin problema.
export async function imagenComoPNG(url: string): Promise<{ dataUrl: string; base64: string; width: number; height: number }> {
  const img = new window.Image();
  img.crossOrigin = "anonymous";
  const cargada = new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error(`No se pudo cargar la imagen: ${url}`));
  });
  img.src = url;
  await cargada;

  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No se pudo preparar el lienzo para la imagen.");
  ctx.drawImage(img, 0, 0);

  const dataUrl = canvas.toDataURL("image/png");
  return { dataUrl, base64: dataUrl.split(",")[1], width: canvas.width, height: canvas.height };
}

export function fechaDocumento(fecha: Date = new Date()): string {
  return fecha.toLocaleDateString("es-PE", { day: "2-digit", month: "long", year: "numeric" });
}

export function hexARgb(hex: string): { r: number; g: number; b: number } {
  const limpio = hex.replace("#", "");
  return {
    r: parseInt(limpio.substring(0, 2), 16),
    g: parseInt(limpio.substring(2, 4), 16),
    b: parseInt(limpio.substring(4, 6), 16),
  };
}
