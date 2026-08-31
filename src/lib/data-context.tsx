"use client";
/* eslint-disable react-hooks/set-state-in-effect */
// Mismo caso que store.ts: "leer una fuente externa (Supabase, acá) al
// montar" dispara esta regla a propósito — es la forma estándar de hidratar
// estado sin romper el SSR.

// Un solo lugar que carga TODO desde Supabase una vez (al abrir la app) y
// reparte los datos + las funciones para crear/editar/eliminar — cada
// mutación llama a Supabase y, si sale bien, actualiza el estado local al
// toque (no hace falta recargar la página para ver el cambio).
//
// Reemplaza a los mock/*.ts (datos de mentira en TypeScript) y a los hooks
// de localStorage de store.ts que simulaban "guardar" (useClientesCreados,
// useCampanasCreadas, useFestividades, useSeguimientoOverrides,
// useAprobacionCumpleanos, useConfigSaludoCumpleanos, useUsuariosCreados) —
// ahora todo eso es una fila de verdad en Postgres.

import { createContext, useContext, useCallback, useEffect, useState, ReactNode } from "react";
import {
  Usuario, ClienteIndividual, ClienteCorporativo, Campana, Festividad, SeguimientoCumple,
  NegocioId,
} from "./types";
import {
  cargarTodo, type DatosApp, type ConfigSaludoRow, type AprobacionMesRow,
  dbCrearUsuario, dbActualizarUsuario, dbEliminarUsuario,
  dbCrearClienteIndividual, dbActualizarClienteIndividual, dbEliminarClienteIndividual,
  dbCrearClienteCorporativo, dbActualizarClienteCorporativo, dbEliminarClienteCorporativo,
  dbCrearCampana, dbActualizarCampana, dbEliminarCampana,
  dbCrearFestividad, dbActualizarFestividad, dbEliminarFestividad,
  dbCrearSeguimiento, dbActualizarSeguimiento,
  dbGuardarConfigSaludo, dbAprobarMes,
  suscribirCambios, type CambioRealtime,
  mapUsuario, mapClienteIndividual, mapClienteCorporativo, mapCampana, mapFestividad, mapSeguimiento,
} from "./db";

// Aplica un evento de Supabase Realtime al estado local — el mecanismo que
// hace que un cambio hecho en una pestaña/sesión (ej. Ventas Uno registra un
// cliente) se vea reflejado al toque en cualquier otra pestaña/sesión
// abierta (ej. Gerente General), sin recargar la página. "existe → reemplaza,
// si no → agrega" hace que esto sea seguro aunque el propio cambio local
// (ya aplicado de forma optimista por el mutator que lo originó) llegue de
// vuelta por este mismo canal — no duplica nada, solo confirma lo que ya
// estaba.
function aplicarCambioRealtime(d: DatosApp, c: CambioRealtime): DatosApp {
  const idDe = (fila: Record<string, unknown> | null) => (fila?.id as string | undefined);

  switch (c.tabla) {
    case "usuarios": {
      const id = idDe(c.vieja);
      if (c.tipo === "DELETE") return id ? { ...d, usuarios: d.usuarios.filter((u) => u.id !== id) } : d;
      if (!c.nueva) return d;
      const fila = mapUsuario(c.nueva);
      const existe = d.usuarios.some((u) => u.id === fila.id);
      return { ...d, usuarios: existe ? d.usuarios.map((u) => (u.id === fila.id ? fila : u)) : [fila, ...d.usuarios] };
    }
    case "clientes_individuales": {
      const id = idDe(c.vieja);
      if (c.tipo === "DELETE") return id ? { ...d, clientesIndividuales: d.clientesIndividuales.filter((x) => x.id !== id) } : d;
      if (!c.nueva) return d;
      const fila = mapClienteIndividual(c.nueva);
      const existe = d.clientesIndividuales.some((x) => x.id === fila.id);
      return { ...d, clientesIndividuales: existe ? d.clientesIndividuales.map((x) => (x.id === fila.id ? fila : x)) : [fila, ...d.clientesIndividuales] };
    }
    case "clientes_corporativos": {
      const id = idDe(c.vieja);
      if (c.tipo === "DELETE") return id ? { ...d, clientesCorporativos: d.clientesCorporativos.filter((x) => x.id !== id) } : d;
      if (!c.nueva) return d;
      const fila = mapClienteCorporativo(c.nueva);
      const existe = d.clientesCorporativos.some((x) => x.id === fila.id);
      return { ...d, clientesCorporativos: existe ? d.clientesCorporativos.map((x) => (x.id === fila.id ? fila : x)) : [fila, ...d.clientesCorporativos] };
    }
    case "campanas": {
      const id = idDe(c.vieja);
      if (c.tipo === "DELETE") return id ? { ...d, campanas: d.campanas.filter((x) => x.id !== id) } : d;
      if (!c.nueva) return d;
      const fila = mapCampana(c.nueva);
      const existe = d.campanas.some((x) => x.id === fila.id);
      return { ...d, campanas: existe ? d.campanas.map((x) => (x.id === fila.id ? fila : x)) : [fila, ...d.campanas] };
    }
    case "festividades": {
      const id = idDe(c.vieja);
      if (c.tipo === "DELETE") return id ? { ...d, festividades: d.festividades.filter((x) => x.id !== id) } : d;
      if (!c.nueva) return d;
      const fila = mapFestividad(c.nueva);
      const existe = d.festividades.some((x) => x.id === fila.id);
      return { ...d, festividades: existe ? d.festividades.map((x) => (x.id === fila.id ? fila : x)) : [fila, ...d.festividades] };
    }
    case "seguimiento_cumpleanos": {
      const id = idDe(c.vieja);
      if (c.tipo === "DELETE") return id ? { ...d, seguimientos: d.seguimientos.filter((x) => x.id !== id) } : d;
      if (!c.nueva) return d;
      const fila = mapSeguimiento(c.nueva);
      const existe = d.seguimientos.some((x) => x.id === fila.id);
      return { ...d, seguimientos: existe ? d.seguimientos.map((x) => (x.id === fila.id ? fila : x)) : [fila, ...d.seguimientos] };
    }
    // Las 2 tablas de config no tienen `id` propio — su llave es negocioId
    // (config_saludo_cumpleanos) o negocioId+año+mes (aprobacion_cumpleanos_mes).
    case "config_saludo_cumpleanos": {
      const base = c.nueva ?? c.vieja;
      const negocioId = base?.negocio_id as NegocioId | undefined;
      if (!negocioId) return d;
      const sinEsta = d.configsSaludo.filter((x) => x.negocioId !== negocioId);
      if (c.tipo === "DELETE" || !c.nueva) return { ...d, configsSaludo: sinEsta };
      const fila: ConfigSaludoRow = { negocioId, mensaje: c.nueva.mensaje as string, hora: c.nueva.hora as string };
      return { ...d, configsSaludo: [...sinEsta, fila] };
    }
    case "aprobacion_cumpleanos_mes": {
      const base = c.nueva ?? c.vieja;
      const negocioId = base?.negocio_id as NegocioId | undefined;
      const anio = base?.anio as number | undefined;
      const mes = base?.mes as number | undefined;
      if (!negocioId || anio === undefined || mes === undefined) return d;
      const sinEsta = d.aprobaciones.filter((x) => !(x.negocioId === negocioId && x.anio === anio && x.mes === mes));
      if (c.tipo === "DELETE" || !c.nueva) return { ...d, aprobaciones: sinEsta };
      const fila: AprobacionMesRow = { negocioId, anio, mes, aprobado: c.nueva.aprobado as boolean };
      return { ...d, aprobaciones: [...sinEsta, fila] };
    }
    default:
      return d;
  }
}
interface DataContextValue extends DatosApp {
  listo: boolean;
  error: string | null;
  recargar: () => void;

  crearUsuario: (u: Usuario) => Promise<void>;
  actualizarUsuario: (id: string, patch: Partial<Usuario>) => Promise<void>;
  eliminarUsuario: (id: string) => Promise<void>;

  crearClienteIndividual: (c: ClienteIndividual) => Promise<void>;
  actualizarClienteIndividual: (id: string, patch: Partial<ClienteIndividual>) => Promise<void>;
  eliminarClienteIndividual: (id: string) => Promise<void>;
  crearClienteCorporativo: (c: ClienteCorporativo) => Promise<void>;
  actualizarClienteCorporativo: (id: string, patch: Partial<ClienteCorporativo>) => Promise<void>;
  eliminarClienteCorporativo: (id: string) => Promise<void>;

  crearCampana: (c: Campana) => Promise<void>;
  actualizarCampana: (id: string, patch: Partial<Campana>) => Promise<void>;
  eliminarCampana: (id: string) => Promise<void>;

  crearFestividad: (f: Festividad) => Promise<void>;
  actualizarFestividad: (id: string, patch: Partial<Festividad>) => Promise<void>;
  eliminarFestividad: (id: string) => Promise<void>;

  crearSeguimiento: (s: SeguimientoCumple) => Promise<SeguimientoCumple>;
  actualizarSeguimiento: (id: string, patch: Partial<SeguimientoCumple>) => Promise<void>;

  guardarConfigSaludo: (negocioId: NegocioId, mensaje: string, hora: string) => Promise<void>;
  aprobarMes: (negocioId: NegocioId, anio: number, mes: number) => Promise<void>;
}

const DataContext = createContext<DataContextValue | null>(null);

const VACIO: DatosApp = {
  negocios: [], usuarios: [], clientesIndividuales: [], clientesCorporativos: [],
  campanas: [], festividades: [], seguimientos: [], configsSaludo: [], aprobaciones: [],
};

export function DataProvider({ children }: { children: ReactNode }) {
  const [datos, setDatos] = useState<DatosApp>(VACIO);
  const [listo, setListo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    let cancelado = false;
    setListo(false);
    setError(null);
    cargarTodo()
      .then((d) => { if (!cancelado) { setDatos(d); setListo(true); } })
      .catch((e: Error) => { if (!cancelado) { setError(e.message); setListo(true); } });
    return () => { cancelado = true; };
  }, [intento]);

  const recargar = useCallback(() => setIntento((n) => n + 1), []);

  // Se abre recién cuando la carga inicial terminó (evita que un evento que
  // llegue antes de tiempo se pierda al pisarlo cargarTodo). Se cierra y
  // vuelve a abrir solo si `recargar()` fuerza una nueva carga completa.
  useEffect(() => {
    if (!listo) return;
    const cerrar = suscribirCambios((c) => setDatos((d) => aplicarCambioRealtime(d, c)));
    return cerrar;
  }, [listo]);

  const crearUsuario = useCallback(async (u: Usuario) => {
    const creado = await dbCrearUsuario(u);
    setDatos((d) => ({ ...d, usuarios: [creado, ...d.usuarios] }));
  }, []);
  const actualizarUsuario = useCallback(async (id: string, patch: Partial<Usuario>) => {
    await dbActualizarUsuario(id, patch);
    setDatos((d) => ({ ...d, usuarios: d.usuarios.map((u) => (u.id === id ? { ...u, ...patch } : u)) }));
  }, []);
  const eliminarUsuario = useCallback(async (id: string) => {
    await dbEliminarUsuario(id);
    setDatos((d) => ({ ...d, usuarios: d.usuarios.filter((u) => u.id !== id) }));
  }, []);

  const crearClienteIndividual = useCallback(async (c: ClienteIndividual) => {
    const creado = await dbCrearClienteIndividual(c);
    setDatos((d) => ({ ...d, clientesIndividuales: [creado, ...d.clientesIndividuales] }));
  }, []);
  const actualizarClienteIndividual = useCallback(async (id: string, patch: Partial<ClienteIndividual>) => {
    await dbActualizarClienteIndividual(id, patch);
    setDatos((d) => ({ ...d, clientesIndividuales: d.clientesIndividuales.map((c) => (c.id === id ? { ...c, ...patch } : c)) }));
  }, []);
  const eliminarClienteIndividual = useCallback(async (id: string) => {
    await dbEliminarClienteIndividual(id);
    setDatos((d) => ({ ...d, clientesIndividuales: d.clientesIndividuales.filter((c) => c.id !== id) }));
  }, []);
  const crearClienteCorporativo = useCallback(async (c: ClienteCorporativo) => {
    const creado = await dbCrearClienteCorporativo(c);
    setDatos((d) => ({ ...d, clientesCorporativos: [creado, ...d.clientesCorporativos] }));
  }, []);
  const actualizarClienteCorporativo = useCallback(async (id: string, patch: Partial<ClienteCorporativo>) => {
    await dbActualizarClienteCorporativo(id, patch);
    setDatos((d) => ({ ...d, clientesCorporativos: d.clientesCorporativos.map((c) => (c.id === id ? { ...c, ...patch } : c)) }));
  }, []);
  const eliminarClienteCorporativo = useCallback(async (id: string) => {
    await dbEliminarClienteCorporativo(id);
    setDatos((d) => ({ ...d, clientesCorporativos: d.clientesCorporativos.filter((c) => c.id !== id) }));
  }, []);

  const crearCampana = useCallback(async (c: Campana) => {
    const creada = await dbCrearCampana(c);
    setDatos((d) => ({ ...d, campanas: [creada, ...d.campanas] }));
  }, []);
  const actualizarCampana = useCallback(async (id: string, patch: Partial<Campana>) => {
    await dbActualizarCampana(id, patch);
    setDatos((d) => ({ ...d, campanas: d.campanas.map((c) => (c.id === id ? { ...c, ...patch } : c)) }));
  }, []);
  const eliminarCampana = useCallback(async (id: string) => {
    await dbEliminarCampana(id);
    setDatos((d) => ({ ...d, campanas: d.campanas.filter((c) => c.id !== id) }));
  }, []);

  const crearFestividad = useCallback(async (f: Festividad) => {
    const creada = await dbCrearFestividad(f);
    setDatos((d) => ({ ...d, festividades: [creada, ...d.festividades] }));
  }, []);
  const actualizarFestividad = useCallback(async (id: string, patch: Partial<Festividad>) => {
    await dbActualizarFestividad(id, patch);
    setDatos((d) => ({ ...d, festividades: d.festividades.map((f) => (f.id === id ? { ...f, ...patch } : f)) }));
  }, []);
  const eliminarFestividad = useCallback(async (id: string) => {
    await dbEliminarFestividad(id);
    setDatos((d) => ({ ...d, festividades: d.festividades.filter((f) => f.id !== id) }));
  }, []);

  const crearSeguimiento = useCallback(async (s: SeguimientoCumple) => {
    const creado = await dbCrearSeguimiento(s);
    setDatos((d) => ({ ...d, seguimientos: [creado, ...d.seguimientos] }));
    return creado;
  }, []);
  const actualizarSeguimiento = useCallback(async (id: string, patch: Partial<SeguimientoCumple>) => {
    await dbActualizarSeguimiento(id, patch);
    setDatos((d) => ({ ...d, seguimientos: d.seguimientos.map((s) => (s.id === id ? { ...s, ...patch } : s)) }));
  }, []);

  const guardarConfigSaludo = useCallback(async (negocioId: NegocioId, mensaje: string, hora: string) => {
    await dbGuardarConfigSaludo(negocioId, mensaje, hora);
    setDatos((d) => {
      const sinEsta = d.configsSaludo.filter((c) => c.negocioId !== negocioId);
      const fila: ConfigSaludoRow = { negocioId, mensaje, hora };
      return { ...d, configsSaludo: [...sinEsta, fila] };
    });
  }, []);
  const aprobarMes = useCallback(async (negocioId: NegocioId, anio: number, mes: number) => {
    await dbAprobarMes(negocioId, anio, mes);
    setDatos((d) => {
      const sinEsta = d.aprobaciones.filter((a) => !(a.negocioId === negocioId && a.anio === anio && a.mes === mes));
      const fila: AprobacionMesRow = { negocioId, anio, mes, aprobado: true };
      return { ...d, aprobaciones: [...sinEsta, fila] };
    });
  }, []);

  const value: DataContextValue = {
    ...datos,
    listo,
    error,
    recargar,
    crearUsuario, actualizarUsuario, eliminarUsuario,
    crearClienteIndividual, actualizarClienteIndividual, eliminarClienteIndividual,
    crearClienteCorporativo, actualizarClienteCorporativo, eliminarClienteCorporativo,
    crearCampana, actualizarCampana, eliminarCampana,
    crearFestividad, actualizarFestividad, eliminarFestividad,
    crearSeguimiento, actualizarSeguimiento,
    guardarConfigSaludo, aprobarMes,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData(): DataContextValue {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData debe usarse dentro de <DataProvider>");
  return ctx;
}
