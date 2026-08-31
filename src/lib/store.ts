"use client";
/* eslint-disable react-hooks/set-state-in-effect */

// Lo que queda en localStorage a propósito — todo lo demás (usuarios,
// clientes, campañas, festividades, seguimiento de cumpleaños) ya vive en
// Supabase (ver src/lib/data-context.tsx). Acá solo queda lo que es
// deliberadamente simulado y no tiene sentido en una tabla real todavía:
// el chat de Mensajería (simulacro de la futura API de WhatsApp), el chat
// de Estrategias (simulacro del asistente de IA), las credenciales de esas
// dos futuras integraciones, y una preferencia de UI (modo automático).
//
// El patrón "leer localStorage en un useEffect al montar" dispara la regla
// set-state-in-effect en todos los hooks de este archivo — es intencional:
// es la forma estándar de hidratar estado del navegador sin romper el SSR.

import { useCallback, useEffect, useState } from "react";
import { Mensaje } from "./types";

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

// Escribe un mensaje directo al chat de un cliente sin pasar por el hook
// useChat — lo usa el envío automático de saludos (corre en un efecto, no en
// un componente que tenga esa conversación abierta).
export function agregarMensajeChatDirecto(clienteId: string, texto: string, de: "negocio" | "cliente" = "negocio") {
  const key = `crm-chat-${clienteId}`;
  const actuales = readLS<Mensaje[]>(key, []);
  const next = [...actuales, { id: `${Date.now()}-${de}-${clienteId}`, de, texto, hora: new Date().toISOString() }];
  writeLS(key, next);
}

// Lectura directa (sin hook) del chat ya guardado de un cliente — la usa la
// lista de Mensajería para ordenar las conversaciones por su último mensaje,
// igual que WhatsApp/Telegram, sin tener que abrir cada chat con useChat.
// null = todavía no se guardó nada real para este cliente (puede que igual
// tenga historial "sembrado" de cumpleaños/campañas, eso lo resuelve quien
// llama, igual que ya hace useChat con su parámetro `semilla`).
export function leerChatGuardado(clienteId: string): Mensaje[] | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(`crm-chat-${clienteId}`);
  return raw ? (JSON.parse(raw) as Mensaje[]) : null;
}

// --- Chat simulado por cliente ----------------------------------------------
// `semilla` solo se usa la primera vez que se abre la conversación (si nunca
// se guardó nada en localStorage para este cliente) — así los chats que ya
// tenían saludo/reserva en el seguimiento aparecen con su historial real
// desde el primer momento, no vacíos.
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

// Config de la API de WhatsApp Business (Cloud API de Meta) — mismo patrón
// que ConfigIA: las credenciales se guardan solo en este navegador para
// simular el flujo de "conectar tu número real". El envío de Campañas
// sigue siendo simulado aunque haya credenciales guardadas — conectar la
// API de verdad necesita un backend que llame a la Cloud API con este
// token (Meta no deja llamarla desde el navegador del cliente, por CORS y
// porque el token quedaría expuesto), y este prototipo no tiene backend.
// Queda listo para cuando se conecte: solo hay que reemplazar el cuerpo de
// `aprobarCampana` (en campanas/page.tsx) por la llamada real usando este
// `config`, sin tocar el resto de la pantalla.
export interface ConfigWhatsAppAPI {
  numeroTelefono: string;
  phoneNumberId: string;
  accessToken: string;
}

export function useConfigWhatsAppAPI() {
  const key = "crm-whatsapp-api-config";
  const [config, setConfigState] = useState<ConfigWhatsAppAPI | null>(null);
  const [listo, setListo] = useState(false);

  useEffect(() => {
    setConfigState(readLS<ConfigWhatsAppAPI | null>(key, null));
    setListo(true);
  }, []);

  const guardar = useCallback((c: ConfigWhatsAppAPI) => {
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
