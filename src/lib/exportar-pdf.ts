"use client";

// Genera el PDF del dashboard como un documento real (portada con logo y
// nombre del negocio/consorcio, franja de color de marca, pie con
// numeración) en vez de delegar en el diálogo de impresión del navegador —
// éste replicaba el look de la pantalla tal cual (con sus recortes y sin
// ningún tipo de portada). El cuerpo (tarjetas, gráficos) se captura tal
// como se ve con html2canvas y se reparte en páginas A4; lo único
// "hecho a mano" con jsPDF es el encabezado y el pie de cada página.
import jsPDF from "jspdf";
// html2canvas-pro (no el html2canvas original) — el original no entiende
// los colores oklch()/oklab() que genera Tailwind v4 para sus utilidades de
// color, y tira "unsupported color function" al capturar el panel.
import html2canvas from "html2canvas-pro";
import { marcaDocumento, imagenComoPNG, fechaDocumento, hexARgb } from "./documentos";
import { NegocioId } from "./types";

const MM_MARGEN = 14;
const MM_ALTO_ENCABEZADO = 30;
const MM_ALTO_PIE = 12;
const ESCALA_CAPTURA = 1.5;

export async function exportarDashboardPDF(opts: {
  elementoId: string;
  negocioId: NegocioId;
  titulo: string;
  subtitulo?: string;
  generadoPor: string;
}): Promise<void> {
  const { elementoId, negocioId, titulo, subtitulo, generadoPor } = opts;
  const elemento = document.getElementById(elementoId);
  if (!elemento) return;

  const marca = marcaDocumento(negocioId);

  // html2canvas-pro, apuntado directo al contenedor del panel (en vez de
  // document.body), ubica mal su clonado interno y captura todo en blanco
  // o desplazado — sea por su "computed rendering" por defecto (silencioso,
  // sin ningún elemento pintado) o con foreignObjectRendering (recorte
  // corrido). Se captura la página completa, que sí renderiza bien, y se
  // recorta acá mismo con canvas 2D al rectángulo real del contenedor.
  const [logo, capturaCompleta] = await Promise.all([
    imagenComoPNG(marca.logoUrl).catch(() => null),
    html2canvas(document.body, {
      scale: ESCALA_CAPTURA,
      backgroundColor: "#f7f3ee",
      useCORS: true,
      foreignObjectRendering: true,
    }),
  ]);

  const rect = elemento.getBoundingClientRect();
  const escalaReal = capturaCompleta.width / document.body.scrollWidth;
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(rect.width * escalaReal);
  canvas.height = Math.round(rect.height * escalaReal);
  const ctxRecorte = canvas.getContext("2d");
  if (ctxRecorte) {
    ctxRecorte.fillStyle = "#f7f3ee";
    ctxRecorte.fillRect(0, 0, canvas.width, canvas.height);
    ctxRecorte.drawImage(
      capturaCompleta,
      rect.left * escalaReal, rect.top * escalaReal, rect.width * escalaReal, rect.height * escalaReal,
      0, 0, canvas.width, canvas.height
    );
  }

  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  const anchoPagina = doc.internal.pageSize.getWidth();
  const altoPagina = doc.internal.pageSize.getHeight();
  const anchoContenido = anchoPagina - MM_MARGEN * 2;
  const { r, g, b } = hexARgb(marca.color);

  function dibujarEncabezado() {
    let xLogo = MM_MARGEN;
    if (logo) {
      const altoLogo = 14;
      const anchoLogo = Math.min((logo.width / logo.height) * altoLogo, 42);
      doc.addImage(logo.dataUrl, "PNG", MM_MARGEN, MM_MARGEN - 2, anchoLogo, altoLogo);
      xLogo = MM_MARGEN + anchoLogo + 6;
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(r, g, b);
    doc.text(marca.nombre, xLogo, MM_MARGEN + 4);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10.5);
    doc.setTextColor(70, 65, 60);
    doc.text(titulo, xLogo, MM_MARGEN + 10.5);
    if (subtitulo) {
      doc.setFontSize(9);
      doc.setTextColor(130, 122, 112);
      doc.text(subtitulo, xLogo, MM_MARGEN + 15.5);
    }

    doc.setDrawColor(r, g, b);
    doc.setLineWidth(0.6);
    doc.line(MM_MARGEN, MM_ALTO_ENCABEZADO, anchoPagina - MM_MARGEN, MM_ALTO_ENCABEZADO);
  }

  function dibujarPie(numero: number, total: number) {
    const y = altoPagina - MM_ALTO_PIE + 4;
    doc.setDrawColor(225, 218, 208);
    doc.setLineWidth(0.3);
    doc.line(MM_MARGEN, y - 4, anchoPagina - MM_MARGEN, y - 4);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(150, 142, 132);
    doc.text(`CRM Consorcio Las Flores · Generado el ${fechaDocumento()} por ${generadoPor}`, MM_MARGEN, y);
    doc.text(`Página ${numero} de ${total}`, anchoPagina - MM_MARGEN, y, { align: "right" });
  }

  // El cuerpo capturado se reparte en páginas del tamaño disponible bajo el
  // encabezado (más angosto en la primera página) y sobre el margen (igual
  // en el resto) — se recorta a un canvas temporal por cada tramo en vez de
  // reescalar la imagen completa, así el texto de los gráficos no pierde
  // nitidez. Cada tramo se embebe como JPEG (no PNG): el PNG nativo del
  // canvas del navegador no comprime bien una captura de UI con degradados
  // y texto antialiased — de un solo tramo pasaba de más de 10 MB.
  const pxPorMm = canvas.width / anchoContenido;
  const altoDisponiblePrimera = altoPagina - MM_ALTO_ENCABEZADO - MM_ALTO_PIE - 4;
  const altoDisponibleResto = altoPagina - MM_MARGEN - MM_ALTO_PIE - 4;
  const tramos: number[] = [];
  let restantePx = canvas.height;
  let primera = true;
  while (restantePx > 0) {
    const disponibleMm = primera ? altoDisponiblePrimera : altoDisponibleResto;
    const tramoPx = Math.min(restantePx, disponibleMm * pxPorMm);
    tramos.push(tramoPx);
    restantePx -= tramoPx;
    primera = false;
  }

  const totalPaginas = tramos.length;
  let offsetPx = 0;
  tramos.forEach((alturaPx, i) => {
    if (i > 0) doc.addPage();
    dibujarEncabezado();

    const lienzoTramo = document.createElement("canvas");
    lienzoTramo.width = canvas.width;
    lienzoTramo.height = Math.round(alturaPx);
    const ctx = lienzoTramo.getContext("2d");
    if (ctx) {
      ctx.drawImage(canvas, 0, offsetPx, canvas.width, alturaPx, 0, 0, canvas.width, lienzoTramo.height);
      const yInicio = MM_ALTO_ENCABEZADO + 4;
      const altoMm = alturaPx / pxPorMm;
      doc.addImage(lienzoTramo.toDataURL("image/jpeg", 0.88), "JPEG", MM_MARGEN, yInicio, anchoContenido, altoMm);
    }
    offsetPx += alturaPx;

    dibujarPie(i + 1, totalPaginas);
  });

  const slugNegocio = negocioId === "todas" ? "consorcio" : negocioId;
  doc.save(`reporte-${slugNegocio}-${new Date().toISOString().slice(0, 10)}.pdf`);
}
