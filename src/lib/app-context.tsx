"use client";

import { createContext, useContext, useEffect, useState, ReactNode, useMemo } from "react";
import { NegocioId, Usuario } from "./types";
import { USUARIOS } from "./mock/usuarios";
import { NEGOCIOS, getNegocio } from "./mock/negocios";
import { negociosPermitidos } from "./permissions";
import { useUsuariosCreados } from "./store";

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

type Negocio = (typeof NEGOCIOS)[number];

const AppContext = createContext<AppContextValue | null>(null);

const STORAGE_USUARIO = "crm-usuario-id-activo";
const STORAGE_NEGOCIO = "crm-negocio-activo";

export function AppProvider({ children }: { children: ReactNode }) {
  const [usuarioId, setUsuarioId] = useState<string | null>(null);
  const [negocioId, setNegocioId] = useState<NegocioId>("las-flores");
  const [listo, setListo] = useState(false);
  const { items: usuariosCreados, add: crearUsuario, update: actualizarUsuario, remove: removerUsuario, listo: listoCreados } = useUsuariosCreados();

  const todosLosUsuarios = useMemo(() => [...USUARIOS, ...usuariosCreados], [usuariosCreados]);
  const usuario = usuarioId ? todosLosUsuarios.find((u) => u.id === usuarioId) ?? null : null;

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const usuarioGuardado = window.localStorage.getItem(STORAGE_USUARIO);
    const negocioGuardado = window.localStorage.getItem(STORAGE_NEGOCIO) as NegocioId | null;
    if (usuarioGuardado) setUsuarioId(usuarioGuardado);
    if (negocioGuardado) setNegocioId(negocioGuardado);
    setListo(true);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  function iniciarSesion(loginUsuario: string, contrasena: string): boolean {
    const encontrado = todosLosUsuarios.find(
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

  const editarUsuario = (id: string, patch: Partial<Usuario>) => {
    actualizarUsuario((u) => u.id === id, (u) => ({ ...u, ...patch }));
  };

  const eliminarUsuario = (id: string) => {
    removerUsuario((u) => u.id === id);
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
        return alcance === "todos" ? NEGOCIOS : NEGOCIOS.filter((n) => alcance.includes(n.id));
      })()
    : NEGOCIOS;

  const value: AppContextValue = {
    usuario,
    negocio: getNegocio(negocioId) ?? NEGOCIOS[0],
    negocios: NEGOCIOS,
    negociosDisponibles,
    usuarios: todosLosUsuarios,
    listo: listo && listoCreados,
    iniciarSesion,
    cerrarSesion,
    cambiarNegocio,
    crearUsuario,
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
