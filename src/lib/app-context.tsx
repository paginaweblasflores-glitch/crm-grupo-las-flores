"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Negocio, NegocioId, Usuario } from "./types";
import { NEGOCIOS, NEGOCIO_TODAS, getNegocio } from "./mock/negocios";
import { negociosPermitidos } from "./permissions";
import { useData } from "./data-context";

interface AppContextValue {
  usuario: Usuario | null;
  negocio: Negocio;
  negocios: Negocio[];
  negociosDisponibles: Negocio[];
  usuarios: Usuario[];
  listo: boolean;
  iniciarSesion: (usuario: string, contrasena: string) => boolean;
  cerrarSesion: () => void;
  cambiarNegocio: (id: NegocioId) => void;
  crearUsuario: (u: Usuario) => void;
  editarUsuario: (id: string, patch: Partial<Usuario>) => void;
  eliminarUsuario: (id: string) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

const STORAGE_USUARIO = "crm-usuario-id-activo";
const STORAGE_NEGOCIO = "crm-negocio-activo";

export function AppProvider({ children }: { children: ReactNode }) {
  // Las 3 sedes (nombre, color, si opera) son config del sistema, casi fija
  // — no el tipo de dato ficticio/generado que se migró a Supabase (eso son
  // clientes, campañas, festividades, seguimiento, usuarios). Se quedan acá.
  const negocios: Negocio[] = NEGOCIOS;
  const {
    usuarios, listo: listoDatos,
    crearUsuario: dbCrear, actualizarUsuario: dbActualizar, eliminarUsuario: dbEliminar,
  } = useData();
  const [usuarioId, setUsuarioId] = useState<string | null>(null);
  const [negocioId, setNegocioId] = useState<NegocioId>("las-flores");
  const [listoSesion, setListoSesion] = useState(false);

  const usuario = usuarioId ? usuarios.find((u) => u.id === usuarioId) ?? null : null;

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const usuarioGuardado = window.localStorage.getItem(STORAGE_USUARIO);
    const negocioGuardado = window.localStorage.getItem(STORAGE_NEGOCIO) as NegocioId | null;
    if (usuarioGuardado) setUsuarioId(usuarioGuardado);
    if (negocioGuardado) setNegocioId(negocioGuardado);
    setListoSesion(true);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  function iniciarSesion(loginUsuario: string, contrasena: string): boolean {
    const encontrado = usuarios.find(
      (u) => u.usuario.toLowerCase() === loginUsuario.trim().toLowerCase() && u.contrasena === contrasena
    );
    if (!encontrado) return false;
    setUsuarioId(encontrado.id);
    const alcance = negociosPermitidos(encontrado.rolTipo, encontrado.negocioId);
    const negocioInicial = alcance === "todos" ? encontrado.negocioId : alcance[0];
    setNegocioId(negocioInicial);
    window.localStorage.setItem(STORAGE_USUARIO, encontrado.id);
    window.localStorage.setItem(STORAGE_NEGOCIO, negocioInicial);
    return true;
  }

  // Ya no hace falta el truco de "semilla vs override" — cada cuenta es una
  // fila de verdad en Supabase, editar (aunque sea una de las 5 originales)
  // es un UPDATE normal.
  const editarUsuario = (id: string, patch: Partial<Usuario>) => {
    void dbActualizar(id, patch);
  };

  const eliminarUsuario = (id: string) => {
    void dbEliminar(id);
  };

  const crearUsuarioFn = (u: Usuario) => {
    void dbCrear(u);
  };

  const cerrarSesion = () => {
    setUsuarioId(null);
    window.localStorage.removeItem(STORAGE_USUARIO);
  };

  const cambiarNegocio = (id: NegocioId) => {
    if (!usuario) return;
    const alcance = negociosPermitidos(usuario.rolTipo, usuario.negocioId);
    if (alcance !== "todos" && !alcance.includes(id)) return;
    setNegocioId(id);
    window.localStorage.setItem(STORAGE_NEGOCIO, id);
  };

  const negociosDisponibles = usuario
    ? (() => {
        const alcance = negociosPermitidos(usuario.rolTipo, usuario.negocioId);
        return alcance === "todos" ? [NEGOCIO_TODAS, ...negocios] : negocios.filter((n) => alcance.includes(n.id));
      })()
    : [NEGOCIO_TODAS, ...negocios];

  const negocioActivo = getNegocio(negocioId) ?? negocios[0];

  const value: AppContextValue = {
    usuario,
    negocio: negocioActivo,
    negocios,
    negociosDisponibles,
    usuarios,
    listo: listoSesion && listoDatos,
    iniciarSesion,
    cerrarSesion,
    cambiarNegocio,
    crearUsuario: crearUsuarioFn,
    editarUsuario,
    eliminarUsuario,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp debe usarse dentro de <AppProvider>");
  return ctx;
}
