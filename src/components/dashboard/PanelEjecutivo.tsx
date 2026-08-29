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
import { Badge } from "@/components/ui/Badge";
import { BarChartSerie } from "@/components/charts/BarChartSerie";

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
  const vistaDescripcion = periodo === "anio" ? "los últimos 12 meses" : mesActual;
  const comparacionDescripcion = periodo === "anio" ? "los 12 meses anteriores" : mesAnterior;

  // "Fidelización" se mide con la conversión de saludos de cumpleaños — es la
  // única señal de "volvió" que existe por igual en los 3 negocios (hospedaje
  // solo aplica a Umaru, ver metrics.ts). No es "toda la cartera volvió", es
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

  // De mayor a menor clientes nuevos captados — para que "quién va ganando"
  // se lea de un vistazo, mismo patrón que el 🏆 del Panel Gerencial.
  const comparativoOrdenado = useMemo(
    () => [...clientesPorNegocio].sort((a, b) => (b.clientes.individuales + b.clientes.corporativos) - (a.clientes.individuales + a.clientes.corporativos)),
    [clientesPorNegocio]
  );

  // Mismo dato que las 2 tarjetas de "Fidelización" (arriba), pero
  // desglosado por sede — cada saludo y su posible regreso son de la MISMA
  // sede (no hay manera de "regresar a otro negocio" en estos datos), así
  // que esto es "cuánto convierte cada sede", no "a dónde se fue el
  // cliente". Responde al mismo filtro Mensual/Anual que "Comparativo por
  // negocio" (resumenCumpleanosPeriodo). Se ordena por TASA de conversión
  // (no por cantidad bruta) — así una sede chica que convierte bien no
  // queda tapada por una más grande que solo manda más saludos. Sin
  // saludos enviados (Mamina, por ahora) no entra al ranking — no hay nada
  // que medir todavía, no es un 0% real.
  const cumpleanosPorNegocio = useMemo(
    () => negociosOperando
      .map((n) => {
        const cumple = resumenCumpleanosPeriodo(n.id, periodo);
        const tasa = cumple.enviados > 0 ? cumple.convertidos / cumple.enviados : -1;
        return { negocio: n, cumple, tasa };
      })
      .sort((a, b) => b.tasa - a.tasa),
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
      <Card>
        <CardHeader
          title="Comparativo por negocio"
          subtitle={`Quién está captando más clientes de cada sede · ${vistaDescripcion}`}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {comparativoOrdenado.map(({ negocio, clientes: c }, idx) => (
            <div key={negocio.id} className="rounded-xl border border-[var(--color-gris-claro)]/40 p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="flex items-center gap-2 font-semibold text-[var(--color-gris)]">
                  <PuestoBadge posicion={idx} />
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: negocio.colorAcento }} />
                  {negocio.nombre}
                  {idx === 0 && (c.individuales + c.corporativos) > 0 && <span title="Líder en captación">🏆</span>}
                </span>
                <Badge tono="gris">{negocio.tipo === "hotel" ? "Hotel" : "Restaurante"}</Badge>
              </div>
              <dl className="grid grid-cols-2 gap-y-2.5 text-sm">
                <dt className="text-[var(--color-gris-medio)]">Clientes individuales</dt>
                <dd className="text-right font-semibold text-[var(--color-gris)]">
                  {c.individuales} <Cambio valor={c.individualesCambio} />
                </dd>
                <dt className="text-[var(--color-gris-medio)]">Clientes corporativos</dt>
                <dd className="text-right font-semibold text-[var(--color-gris)]">
                  {c.corporativos} <Cambio valor={c.corporativosCambio} />
                </dd>
              </dl>
            </div>
          ))}
        </div>
      </Card>

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

      <Card>
        <CardHeader
          title="Cumpleaños → visita, por negocio"
          subtitle={`Conversión de saludo de cumpleaños en visita, en cada sede · ${vistaDescripcion}`}
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {cumpleanosPorNegocio.map(({ negocio, cumple }, idx) => (
            <div key={negocio.id} className="rounded-xl border border-[var(--color-gris-claro)]/40 p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="flex items-center gap-2 font-semibold text-[var(--color-gris)]">
                  <PuestoBadge posicion={idx} />
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: negocio.colorAcento }} />
                  {negocio.nombre}
                  {idx === 0 && cumple.convertidos > 0 && <span title="Mayor tasa de conversión">🏆</span>}
                </span>
              </div>
              {cumple.enviados === 0 ? (
                <p className="text-xs text-[var(--color-gris-medio)]">Sin saludos de cumpleaños enviados todavía en {negocio.nombre}.</p>
              ) : (
                <p className="text-sm text-[var(--color-gris)]">
                  De <span className="font-semibold">{cumple.enviados}</span> mensajes enviados, confirmaron el regreso{" "}
                  <span className="font-semibold text-[var(--color-verde)]">{cumple.convertidos}</span>
                </p>
              )}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// Puesto 1/2/3 explícito en las tarjetas de comparativo — el orden de las
// tarjetas ya cambia solo (están ordenadas por el número real), pero un
// número visible deja claro que es un ranking que se mueve, no un orden fijo
// que coincide con quedar primero por casualidad.
function PuestoBadge({ posicion }: { posicion: number }) {
  return (
    <span
      className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
        posicion === 0
          ? "bg-amber-100 text-amber-800 border border-amber-300"
          : posicion === 1
          ? "bg-slate-100 text-slate-700 border border-slate-300"
          : "bg-orange-50 text-orange-700 border border-orange-200"
      }`}
    >
      {posicion + 1}
    </span>
  );
}

function Cambio({ valor }: { valor: number | null }) {
  if (valor === null) return null;
  const positivo = valor >= 0;
  return (
    <span className={`text-[10px] font-bold ${positivo ? "text-[var(--color-verde)]" : "text-[var(--color-rojo)]"}`}>
      {positivo ? "↑" : "↓"}{Math.abs(valor)}%
    </span>
  );
}
