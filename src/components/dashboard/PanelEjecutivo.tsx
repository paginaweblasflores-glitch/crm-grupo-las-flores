"use client";

import { useMemo, useState } from "react";
import { Users, UserPlus, Percent, Gift } from "lucide-react";
import { NEGOCIOS } from "@/lib/mock/negocios";
import { BASE_DATE } from "@/lib/mock/seed";
import {
  resumenCrecimientoGrupo, clientesPorTipoPeriodo, serieClientesPorPeriodo,
  historialFidelizacionGrupo, resumenCumpleanosPeriodo, PERIODOS, Periodo,
} from "@/lib/metrics";
import { Card, CardHeader } from "@/components/ui/Card";
import { StatTile } from "@/components/ui/StatTile";
import { BarChartSerie } from "@/components/charts/BarChartSerie";
import { ComparativoCrecimientoPorNegocio, ComparativoFidelizacionPorNegocio } from "@/components/dashboard/ComparativosNegocio";

// Directorio no opera el día a día — solo le sirve la cadencia mensual/anual,
// no Diario/Semanal (esa granularidad es para roles operativos).
const PERIODOS_DIRECCION = PERIODOS.filter((p) => p.value === "mes" || p.value === "anio");

function sumarSeries(series: { mes: string; clientes: number }[][]) {
  const base = series[0].map((p) => ({ ...p }));
  for (let i = 1; i < series.length; i++) {
    series[i].forEach((p, idx) => {
      base[idx].clientes += p.clientes;
    });
  }
  return base;
}

// Panel de Dirección (socios/directorio en Lima): solo crecimiento del
// grupo, nada por módulo. Siguiendo la práctica de dashboards ejecutivos —
// pocas métricas, enfocadas en tendencia — sin cifras de ventas, sin
// tablas fila por fila. Enfoque 100% CRM: los dos pilares de la misión
// (fidelizar + aumentar visitas), no ingresos — dos secciones separadas,
// "Crecimiento" (captación) y "Fidelización" (retención), en vez de una
// sola fila de tiles sin jerarquía. El selector de periodo solo ofrece
// Mensual/Anual — Dirección no opera el día a día, esa cadencia
// (Diario/Semanal) es para roles operativos. El ranking por asesor NO vive
// acá — es exclusivo del Panel Gerencial, igual que campañas/días
// festivos/detalle por módulo — Dirección solo ve lo más importante.
export function PanelEjecutivo() {
  const [periodo, setPeriodo] = useState<Periodo>("mes");
  const negociosOperando = NEGOCIOS.filter((n) => n.operando);

  const resumen = resumenCrecimientoGrupo(periodo);
  const clientesPorNegocio = useMemo(
    () => negociosOperando.map((n) => ({ negocio: n, clientes: clientesPorTipoPeriodo(n.id, periodo) })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [periodo]
  );
  const serieCombinada = useMemo(
    () => sumarSeries(negociosOperando.map((n) => serieClientesPorPeriodo(n.id, periodo))),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [periodo]
  );
  // "Mensual"/"Anual" son cadencias, no fechas — un socio que lee "vista
  // mensual" no sabe si es julio o agosto sin mirar el calendario aparte.
  // Se reemplaza por el mes/rango real cada vez que se muestra una fecha,
  // siguiendo la práctica estándar de dashboards ejecutivos: mostrar el
  // rango de fechas activo explícito, no una etiqueta relativa ambigua.
  const mesActual = BASE_DATE.toLocaleDateString("es-PE", { month: "long", year: "numeric" });
  const mesAnterior = new Date(BASE_DATE.getFullYear(), BASE_DATE.getMonth() - 1, 1)
    .toLocaleDateString("es-PE", { month: "long", year: "numeric" });
  // "Anual" es el año de calendario en curso (enero a hoy), no una ventana
  // rodante de 12 meses — mismo criterio que ya usa "mes" acá abajo, y el
  // mismo que ahora usa el Panel Gerencial para que "Anual" signifique lo
  // mismo en toda la app.
  const vistaDescripcion = periodo === "anio" ? String(BASE_DATE.getFullYear()) : mesActual;
  // "el mismo periodo de 2025" y no solo "2025" — Anual es un año parcial
  // (enero a hoy), así que comparar contra el año anterior completo sería
  // engañoso; esto dice explícitamente que es la misma ventana, un año atrás.
  const comparacionDescripcion = periodo === "anio" ? `el mismo periodo de ${BASE_DATE.getFullYear() - 1}` : mesAnterior;

  // "Fidelización" se mide con la conversión de saludos de cumpleaños — es la
  // única señal de "volvió" que existe en el sistema (Hospedaje, la otra
  // que hubo, se eliminó). No es "toda la cartera volvió", es
  // "de quienes cumplieron años en la ventana activa, cuántos terminaron
  // visitando". Igual que Crecimiento, responde al filtro Mensual/Anual: en
  // Mensual usa el mes en curso real (resumenCumpleanosMes, vía `resumen`);
  // en Anual suma los 12 meses del historial (historialFidelizacionGrupo).
  const historialFidelizacion = useMemo(() => historialFidelizacionGrupo(), []);
  const fidelizacionAnual = useMemo(
    () => historialFidelizacion.reduce(
      (a, p) => ({ enviados: a.enviados + p.enviados, convertidos: a.convertidos + p.convertidos }),
      { enviados: 0, convertidos: 0 }
    ),
    [historialFidelizacion]
  );
  const cumpleanosConvertidos = periodo === "anio" ? fidelizacionAnual.convertidos : resumen.cumpleanosConvertidos;
  const cumpleanosEnviados = periodo === "anio" ? fidelizacionAnual.enviados : resumen.cumpleanosEnviados;
  const conversionCumpleanos = cumpleanosEnviados > 0
    ? Math.round((cumpleanosConvertidos / cumpleanosEnviados) * 100)
    : 0;

  // Mismo dato que las 2 tarjetas de "Fidelización" (arriba), pero
  // desglosado por sede — cada saludo y su posible regreso son de la MISMA
  // sede (no hay manera de "regresar a otro negocio" en estos datos), así
  // que esto es "cuánto convierte cada sede", no "a dónde se fue el
  // cliente". Responde al mismo filtro Mensual/Anual que "Comparativo por
  // negocio" (resumenCumpleanosPeriodo). El orden por tasa de conversión y
  // el 🏆 los calcula ComparativoFidelizacionPorNegocio.
  const cumpleanosPorNegocio = useMemo(
    () => negociosOperando.map((n) => ({ negocio: n, cumple: resumenCumpleanosPeriodo(n.id, periodo) })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [periodo]
  );

  return (
    <div className="space-y-6" id="reporte">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-sm font-semibold text-[var(--color-gris)]">Crecimiento</h2>
          <p className="text-xs text-[var(--color-gris-medio)] mt-0.5">Captación de clientes nuevos en los 3 negocios del grupo · {vistaDescripcion}</p>
        </div>
        <div className="flex bg-[var(--color-crema)] rounded-xl p-1 no-imprimir">
          {PERIODOS_DIRECCION.map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriodo(p.value)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                periodo === p.value ? "bg-white text-[var(--color-terracota)] shadow-sm" : "text-[var(--color-gris-medio)] hover:text-[var(--color-gris)]"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatTile
          label="Clientes totales"
          value={resumen.clientesTotales}
          icon={<Users size={18} />}
          tono="terracota"
          trend={`de los ${resumen.negociosActivos} negocios del grupo`}
        />
        <StatTile
          label="Clientes nuevos"
          value={resumen.clientesNuevos}
          icon={<UserPlus size={18} />}
          tono="verde"
          trend={`en los 3 negocios · ${vistaDescripcion}`}
        />
        <StatTile
          label="Crecimiento de clientes"
          value={resumen.clientesNuevosCambio === null ? "—" : `${resumen.clientesNuevosCambio >= 0 ? "+" : ""}${resumen.clientesNuevosCambio}%`}
          icon={<Percent size={18} />}
          tono="naranja"
          trend={`vs. ${comparacionDescripcion}`}
          trendUp={(resumen.clientesNuevosCambio ?? 0) >= 0}
        />
      </div>

      {/* Solo en Anual: 12 barras mensuales sí cuentan una tendencia real.
          En Mensual esto sería un desglose día por día — a este volumen
          (10-15 clientes nuevos en todo el mes) casi todos los días caen en
          cero, así que en vez de una gráfica más clara termina siendo un
          gráfico ilegible que no aporta nada sobre lo que ya dicen los tiles
          de arriba. No es un problema de etiquetas, es que ese desglose es
          demasiado operativo para este panel — mismo criterio que ya se usó
          para sacar Diario/Semanal del selector de periodo. */}
      {periodo === "anio" && (
        <Card>
          <CardHeader
            title="Actividad del grupo — por mes"
            subtitle={`Clientes nuevos combinados de los 3 negocios · ${vistaDescripcion}`}
          />
          <BarChartSerie data={serieCombinada} xKey="mes" series={[{ key: "clientes", nombre: "Clientes nuevos", color: "#8C3A25" }]} />
        </Card>
      )}

      {/* Desglose por negocio de "Crecimiento" — va junto a sus propios
          tiles, no después de Fidelización, para que cada pilar de la
          misión (captación / retención) se lea de corrido: resumen del
          grupo → detalle por sede, antes de pasar al siguiente pilar. */}
      <ComparativoCrecimientoPorNegocio items={clientesPorNegocio} vistaDescripcion={vistaDescripcion} />

      <div>
        <h2 className="text-sm font-semibold text-[var(--color-gris)]">Fidelización</h2>
        <p className="text-xs text-[var(--color-gris-medio)] mt-0.5">
          De los clientes que cumplieron años en {vistaDescripcion} y recibieron el saludo, cuántos terminaron visitando — en los 3 negocios
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatTile
          label="Cumpleaños convertidos en visita"
          value={cumpleanosConvertidos}
          icon={<Gift size={18} />}
          tono="verde"
          trend={`de ${cumpleanosEnviados} saludos enviados en ${vistaDescripcion}`}
          trendUp
        />
        <StatTile
          label="Tasa de conversión"
          value={`${conversionCumpleanos}%`}
          icon={<Percent size={18} />}
          tono="azul"
          trend={`saludo de cumpleaños → visita, en ${vistaDescripcion}`}
        />
      </div>

      {/* Solo en Anual: mismo criterio que "Actividad del grupo — por mes"
          en Crecimiento — 12 barras sí cuentan una tendencia real. */}
      {periodo === "anio" && (
        <Card>
          <CardHeader
            title="Fidelización del grupo — por mes"
            subtitle={`Cumpleaños convertidos en visita, combinados de los 3 negocios · ${vistaDescripcion}`}
          />
          <BarChartSerie
            data={historialFidelizacion}
            xKey="mes"
            series={[{ key: "convertidos", nombre: "Cumpleaños convertidos en visita", color: "#3e6b4f" }]}
          />
        </Card>
      )}

      <ComparativoFidelizacionPorNegocio items={cumpleanosPorNegocio} vistaDescripcion={vistaDescripcion} />
    </div>
  );
}
