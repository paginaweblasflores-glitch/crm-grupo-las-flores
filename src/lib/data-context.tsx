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
  dbCrearClienteIndividual, dbCrearClienteCorporativo,
  dbCrearCampana, dbActualizarCampana, dbEliminarCampana,
  dbCrearFestividad, dbActualizarFestividad, dbEliminarFestividad,
  dbCrearSeguimiento, dbActualizarSeguimiento,
  dbGuardarConfigSaludo, dbAprobarMes,
} from "./db";
interface DataContextValue extends DatosApp {
  listo: boolean;
  error: string | null;
  recargar: () => void;

  crearUsuario: (u: Usuario) => Promise<void>;
  actualizarUsuario: (id: string, patch: Partial<Usuario>) => Promise<void>;
  eliminarUsuario: (id: string) => Promise<void>;

  crearClienteIndividual: (c: ClienteIndividual) => Promise<void>;
  crearClienteCorporativo: (c: ClienteCorporativo) => Promise<void>;

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

  const crearUsuario = useCallback(async (u: Usuario) => {
    const creado = await dbCrearUsuario(u);
    setDatos((d) => ({ ...d, usuarios: [...d.usuarios, creado] }));
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
  const crearClienteCorporativo = useCallback(async (c: ClienteCorporativo) => {
    const creado = await dbCrearClienteCorporativo(c);
    setDatos((d) => ({ ...d, clientesCorporativos: [creado, ...d.clientesCorporativos] }));
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
    setDatos((d) => ({ ...d, seguimientos: [...d.seguimientos, creado] }));
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
    crearClienteIndividual, crearClienteCorporativo,
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
