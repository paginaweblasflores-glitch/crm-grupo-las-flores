"use client";
/* eslint-disable react-hooks/set-state-in-effect */

// Lo que queda en localStorage a propósito — todo lo demás (usuarios,
// clientes, campañas, festividades, seguimiento de cumpleaños, y desde este
// cambio también los MENSAJES de Mensajería) ya vive en Supabase (ver
// src/lib/data-context.tsx). El chat de Mensajería dejó de ser simulado en
// localStorage — antes cada mensaje "enviado" solo existía en el navegador
// de quien lo mandó (no se veía en otro dispositivo/sesión) y, para saber
// qué clientes tenían conversación, Mensajería tenía que cruzar CADA cliente
// contra el arreglo `contactados` de cada campaña — con miles de clientes
// reales eso se volvía muy lento. Ahora es una fila real por mensaje (tabla
// `mensajes`, ver src/lib/db.ts) — acá solo queda lo que sigue siendo
// deliberadamente simulado o local: el chat de Estrategias, las credenciales
// de la API de WhatsApp (pendiente de conectar) y una clave PROPIA opcional
// de Gemini (Estrategias ya está conectado de verdad vía
// src/app/api/estrategias/route.ts — esto es solo para quien quiera usar su
// propia cuota en vez de la del sistema).
//
// El patrón "leer localStorage en un useEffect al montar" dispara la regla
// set-state-in-effect en todos los hooks de este archivo — es intencional:
// es la forma estándar de hidratar estado del navegador sin romper el SSR.

import { useCallback, useEffect, useState } from "react";

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

  const limpiar = useCallback(() => {
    writeLS(key, []);
    setMensajes([]);
  }, [key]);

  return { mensajes, enviar, limpiar, listo };
}

// Clave propia de Gemini, opcional — solo se guarda en este navegador. Si
// está vacía, /api/estrategias usa la clave del sistema (GEMINI_API_KEY en
// el servidor); si Mijael (o quien sea) pega la suya acá, esa se usa en su
// lugar para ESTE navegador — útil si en algún momento quiere su propia
// cuota/facturación de Gemini, sin depender de la clave que configuró
// Sistemas.
export interface ConfigIA {
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
