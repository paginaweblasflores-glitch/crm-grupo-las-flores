"use client";

// Genera el Excel real (.xlsx) con encabezado de marca (logo, negocio,
// generado por/fecha) y una tabla con estilo — reemplaza al CSV plano de
// antes, que abría "como texto" y no llevaba ningún tipo de presentación.
import ExcelJS from "exceljs";
import { marcaDocumento, imagenComoPNG, fechaDocumento, hexARgb } from "./documentos";
import { NegocioId } from "./types";

export async function exportarExcel(opts: {
  archivo: string;
  hoja: string;
  negocioId: NegocioId;
  titulo: string;
  generadoPor: string;
  columnas: string[];
  filas: (string | number)[][];
}): Promise<void> {
  const { archivo, hoja, negocioId, titulo, generadoPor, columnas, filas } = opts;
  const marca = marcaDocumento(negocioId);
  const logo = await imagenComoPNG(marca.logoUrl).catch(() => null);
  const { r, g, b } = hexARgb(marca.color);
  const colorHexARGB = "FF" + [r, g, b].map((n) => n.toString(16).padStart(2, "0")).join("").toUpperCase();

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "CRM Consorcio Las Flores";
  workbook.created = new Date();
  const ws = workbook.addWorksheet(hoja.slice(0, 31), { views: [{ state: "frozen", ySplit: 5 }] });

  const totalColumnas = Math.max(columnas.length, 1);
  const ultimaColumna = String.fromCharCode(65 + Math.min(totalColumnas - 1, 25));

  if (logo) {
    const imageId = workbook.addImage({ base64: logo.dataUrl, extension: "png" });
    const altoImg = 40;
    const anchoImg = (logo.width / logo.height) * altoImg;
    ws.addImage(imageId, { tl: { col: 0.15, row: 0.15 }, ext: { width: anchoImg, height: altoImg } });
  }

  ws.getRow(1).height = 32;
  ws.getRow(2).height = 20;
  ws.getRow(3).height = 8;

  ws.mergeCells(`B1:${ultimaColumna}1`);
  const celdaTitulo = ws.getCell("B1");
  celdaTitulo.value = `${titulo} — ${marca.nombre}`;
  celdaTitulo.font = { bold: true, size: 14, color: { argb: colorHexARGB } };
  celdaTitulo.alignment = { vertical: "middle" };

  ws.mergeCells(`B2:${ultimaColumna}2`);
  const celdaSubtitulo = ws.getCell("B2");
  celdaSubtitulo.value = `Generado el ${fechaDocumento()} por ${generadoPor}`;
  celdaSubtitulo.font = { italic: true, size: 9.5, color: { argb: "FF8A8078" } };
  celdaSubtitulo.alignment = { vertical: "middle" };

  const filaEncabezado = ws.getRow(4);
  columnas.forEach((titulo, i) => {
    const celda = filaEncabezado.getCell(i + 1);
    celda.value = titulo;
    celda.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 10.5 };
    celda.fill = { type: "pattern", pattern: "solid", fgColor: { argb: colorHexARGB } };
    celda.alignment = { vertical: "middle", horizontal: "left" };
  });
  filaEncabezado.height = 20;

  filas.forEach((valores, i) => {
    const fila = ws.getRow(5 + i);
    valores.forEach((valor, j) => {
      const celda = fila.getCell(j + 1);
      celda.value = valor;
      celda.alignment = { vertical: "middle" };
      celda.border = { bottom: { style: "thin", color: { argb: "FFEDE6DC" } } };
      if (i % 2 === 1) {
        celda.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFAF7F2" } };
      }
    });
  });

  columnas.forEach((titulo, i) => {
    const largoContenido = filas.reduce((max, fila) => Math.max(max, String(fila[i] ?? "").length), titulo.length);
    ws.getColumn(i + 1).width = Math.min(Math.max(largoContenido + 3, 12), 40);
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = archivo.endsWith(".xlsx") ? archivo : `${archivo}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
