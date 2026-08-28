"use client";
/* eslint-disable react-hooks/set-state-in-effect */

// Almacenes simulados en localStorage — reemplazan lo que en producción sería
// Supabase. Cada uno modela una acción real del sistema (registrar un
// cliente, crear un usuario, chatear con un cliente) para que el prototipo
// funcione de verdad, sin backend.
//
// El patrón "leer localStorage en un useEffect al montar" dispara la regla
// set-state-in-effect en todos los hooks de este archivo — es intencional:
// es la forma estándar de hidratar estado del navegador sin romper el SSR.

import { useCallback, useEffect, useState } from "react";
import {
  Usuario, ClienteIndividual, ClienteCorporativo, Mensaje, Campana, Festividad,
} from "./types";
import { PLANTILLA_CUMPLEANOS_DEFECTO, HORA_ENVIO_DEFECTO } from "./mensajes";
import { FESTIVIDADES } from "./mock/festividades";

function readLS<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeLS<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

function useLocalArray<T>(key: string) {
  const [items, setItems] = useState<T[]>([]);
  const [listo, setListo] = useState(false);

  useEffect(() => {
    setItems(readLS<T[]>(key, []));
    setListo(true);
  }, [key]);

  const add = useCallback(
    (item: T) => {
      setItems((prev) => {
        const next = [item, ...prev];
        writeLS(key, next);
        return next;
      });
    },
    [key]
  );

  const update = useCallback(
    (predicate: (item: T) => boolean, updater: (item: T) => T) => {
      setItems((prev) => {
        const next = prev.map((it) => (predicate(it) ? updater(it) : it));
        writeLS(key, next);
        return next;
      });
    },
    [key]
  );

  const remove = useCallback(
    (predicate: (item: T) => boolean) => {
      setItems((prev) => {
        const next = prev.filter((it) => !predicate(it));
        writeLS(key, next);
        return next;
      });
    },
    [key]
  );

  return { items, add, update, remove, listo };
}

// --- Cuentas creadas por Gerente General ------------------------------------
export function useUsuariosCreados() {
  return useLocalArray<Usuario>("crm-usuarios-creados");
}

// --- Clientes registrados desde el sistema (ya no en Excel) ----------------
export function useClientesCreados() {
  return useLocalArray<ClienteIndividual>("crm-clientes-creados");
}

export function useClientesCorporativosCreados() {
  return useLocalArray<ClienteCorporativo>("crm-clientes-corporativos-creados");
}

// --- Campañas creadas desde el sistema (Gerencial: crear/editar/eliminar) --
export function useCampanasCreadas() {
  return useLocalArray<Campana>("crm-campanas-creadas");
}

// --- Días festivos y fechas comerciales (Gerencial: crear/editar/eliminar) -
// Se siembra con FESTIVIDADES la primera vez que se abre el módulo — mismo
// principio que la conversación "sembrada" de useChat: si nunca se guardó
// nada, arranca con la semilla; si ya hay datos guardados (porque Gerencial
// editó/eliminó algo), respeta eso.
export function useFestividades() {
  const key = "crm-festividades";
  const [festividades, setFestividades] = useState<Festividad[]>([]);
  const [listo, setListo] = useState(false);

  useEffect(() => {
    const yaExiste = typeof window !== "undefined" && window.localStorage.getItem(key) !== null;
    if (yaExiste) {
      setFestividades(readLS<Festividad[]>(key, FESTIVIDADES));
    } else {
      setFestividades(FESTIVIDADES);
      writeLS(key, FESTIVIDADES);
    }
    setListo(true);
  }, []);

  const add = useCallback((f: Festividad) => {
    setFestividades((prev) => {
      const next = [f, ...prev];
      writeLS(key, next);
      return next;
    });
  }, []);

  const update = useCallback((id: string, patch: Partial<Festividad>) => {
    setFestividades((prev) => {
      const next = prev.map((f) => (f.id === id ? { ...f, ...patch } : f));
      writeLS(key, next);
      return next;
    });
  }, []);

  const remove = useCallback((id: string) => {
    setFestividades((prev) => {
      const next = prev.filter((f) => f.id !== id);
      writeLS(key, next);
      return next;
    });
  }, []);

  return { festividades, add, update, remove, listo };
}

// --- Aprobación mensual del seguimiento de cumpleaños (la hace Gerente General) --
export function useAprobacionCumpleanos(negocioId: string) {
  const key = `crm-cumpleanos-aprobado-${negocioId}`;
  const [aprobado, setAprobado] = useState(false);
  const [listo, setListo] = useState(false);

  useEffect(() => {
    setAprobado(readLS<boolean>(key, false));
    setListo(true);
  }, [key]);

  const aprobar = useCallback(() => {
    setAprobado(true);
    writeLS(key, true);
  }, [key]);

  return { aprobado, aprobar, listo };
}

// --- Overrides de seguimiento (saludo/visto/respuesta/reserva) -------------
export interface SeguimientoOverride {
  saludoEnviado?: boolean;
  visto?: boolean;
  respuesta?: "si" | "no" | "pendiente";
  reservacion?: "si" | "no" | "pendiente";
  // Personalización del saludo automático para ESTE cliente en particular —
  // si no están definidos, se usa la plantilla/hora general del negocio.
  mensaje?: string;
  hora?: string; // "HH:mm"
}

export function useSeguimientoOverrides() {
  const [overrides, setOverrides] = useState<Record<string, SeguimientoOverride>>({});
  const [listo, setListo] = useState(false);
  const key = "crm-seguimiento-overrides";

  useEffect(() => {
    setOverrides(readLS<Record<string, SeguimientoOverride>>(key, {}));
    setListo(true);
  }, []);

  const set = useCallback((id: string, patch: SeguimientoOverride) => {
    setOverrides((prev) => {
      const next = { ...prev, [id]: { ...prev[id], ...patch } };
      writeLS(key, next);
      return next;
    });
  }, []);

  return { overrides, set, listo };
}

// --- Configuración general del saludo automático de cumpleaños -------------
// Plantilla + hora que se aplican a TODOS los clientes de un negocio, salvo
// que un cliente tenga su propia personalización (ver SeguimientoOverride).
export interface ConfigSaludo {
  mensaje: string;
  hora: string; // "HH:mm"
}

const CONFIG_SALUDO_DEFECTO: ConfigSaludo = { mensaje: PLANTILLA_CUMPLEANOS_DEFECTO, hora: HORA_ENVIO_DEFECTO };

export function useConfigSaludoCumpleanos(negocioId: string) {
  const key = `crm-config-saludo-${negocioId}`;
  const [config, setConfigState] = useState<ConfigSaludo>(CONFIG_SALUDO_DEFECTO);
  const [listo, setListo] = useState(false);

  useEffect(() => {
    setConfigState(readLS<ConfigSaludo>(key, CONFIG_SALUDO_DEFECTO));
    setListo(true);
  }, [key]);

  const guardar = useCallback(
    (c: ConfigSaludo) => {
      setConfigState(c);
      writeLS(key, c);
    },
    [key]
  );

  return { config, guardar, listo };
}

// Escribe un mensaje directo al chat de un cliente sin pasar por el hook
// useChat — lo usa el envío automático de saludos (corre en un efecto, no en
// un componente que tenga esa conversación abierta).
export function agregarMensajeChatDirecto(clienteId: string, texto: string, de: "negocio" | "cliente" = "negocio") {
  const key = `crm-chat-${clienteId}`;
  const actuales = readLS<Mensaje[]>(key, []);
  const next = [...actuales, { id: `${Date.now()}-${de}-${clienteId}`, de, texto, hora: new Date().toISOString() }];
  writeLS(key, next);
}

// --- Chat simulado por cliente ----------------------------------------------
// `semilla` solo se usa la primera vez que se abre la conversación (si nunca
// se guardó nada en localStorage para este cliente) — así los chats que ya
// tenían saludo/respuesta/reserva en el seguimiento aparecen con su
// historial real desde el primer momento, no vacíos.
export function useChat(clienteId: string, semilla: Mensaje[] = []) {
  const key = `crm-chat-${clienteId}`;
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [listo, setListo] = useState(false);

  useEffect(() => {
    const yaExiste = typeof window !== "undefined" && window.localStorage.getItem(key) !== null;
    if (yaExiste) {
      setMensajes(readLS<Mensaje[]>(key, []));
    } else if (semilla.length > 0) {
      setMensajes(semilla);
      writeLS(key, semilla);
    } else {
      setMensajes([]);
    }
    setListo(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const enviar = useCallback(
    (texto: string, de: "negocio" | "cliente" = "negocio") => {
      setMensajes((prev) => {
        const next = [...prev, { id: `${Date.now()}-${de}`, de, texto, hora: new Date().toISOString() }];
        writeLS(key, next);
        return next;
      });
    },
    [key]
  );

  return { mensajes, enviar, listo };
}

// --- Chat de Estrategias (asistente de IA) ----------------------------------
export interface MensajeEstrategia {
  id: string;
  de: "usuario" | "agente";
  texto: string;
  hora: string;
}

export function useEstrategiasChat(negocioId: string) {
  const key = `crm-estrategias-chat-${negocioId}`;
  const [mensajes, setMensajes] = useState<MensajeEstrategia[]>([]);
  const [listo, setListo] = useState(false);

  useEffect(() => {
    setMensajes(readLS<MensajeEstrategia[]>(key, []));
    setListo(true);
  }, [key]);

  const enviar = useCallback(
    (texto: string, de: "usuario" | "agente") => {
      setMensajes((prev) => {
        const next = [...prev, { id: `${Date.now()}-${de}`, de, texto, hora: new Date().toISOString() }];
        writeLS(key, next);
        return next;
      });
    },
    [key]
  );

  return { mensajes, enviar, listo };
}

// Config de la API de IA — solo se guarda localmente para simular el flujo de
// "conectar tu proveedor"; el chat sigue siendo simulado aunque haya una
// clave guardada, porque este prototipo no tiene backend que la use de verdad.
export interface ConfigIA {
  proveedor: "openai" | "anthropic" | "otro";
  apiKey: string;
}

export function useConfigIA() {
  const key = "crm-estrategias-config-ia";
  const [config, setConfigState] = useState<ConfigIA | null>(null);
  const [listo, setListo] = useState(false);

  useEffect(() => {
    setConfigState(readLS<ConfigIA | null>(key, null));
    setListo(true);
  }, []);

  const guardar = useCallback((c: ConfigIA) => {
    setConfigState(c);
    writeLS(key, c);
  }, []);

  const desconectar = useCallback(() => {
    setConfigState(null);
    writeLS(key, null);
  }, []);

  return { config, guardar, desconectar, listo };
}

export function useModoAutomatico() {
  const [modo, setModoState] = useState(false);
  const [listo, setListo] = useState(false);

  useEffect(() => {
    setModoState(readLS<boolean>("crm-chat-modo-automatico", false));
    setListo(true);
  }, []);

  const setModo = useCallback((v: boolean) => {
    setModoState(v);
    writeLS("crm-chat-modo-automatico", v);
  }, []);

  return { modo, setModo, listo };
}
