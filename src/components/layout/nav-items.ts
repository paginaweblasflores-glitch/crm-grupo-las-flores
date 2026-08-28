import {
  LayoutDashboard, Users, BedDouble, Gift, Megaphone,
  MessageCircle, UserCog, Sparkles, PartyPopper, Users2,
} from "lucide-react";
import { ModuloId } from "@/lib/permissions";

// Los módulos se agrupan por prioridad/importancia real de uso — no es una
// lista plana. "Principal" es el panel de entrada; "Operación diaria" es lo
// que el equipo usa hora a hora; "Relación con el cliente" es seguimiento y
// marketing (menos frecuente que la operación, pero recurrente); "Gestión"
// es lo administrativo, lo que Gerencial revisa cada cierto tiempo, no cada
// día. El orden dentro de NAV_ITEMS ya refleja esta prioridad de arriba a
// abajo — Sidebar.tsx solo le pone el rótulo de sección encima.
export type GrupoNav = "Principal" | "Operación diaria" | "Relación con el cliente" | "Gestión";

export interface NavItem {
  href: string;
  label: string;
  modulo: ModuloId;
  icon: typeof LayoutDashboard;
  grupo: GrupoNav;
  soloUmaru?: boolean;
  soloLasFlores?: boolean;
  // Casi todos los módulos son operativos — necesitan un negocio específico
  // para tener sentido (registrar un cliente, crear una reserva, todo cuelga
  // de un negocioId real). "Todas las sucursales" es una vista consolidada
  // de solo lectura, así que por default un módulo NO está disponible ahí —
  // hay que marcarlo true explícitamente si de verdad tiene sentido verlo
  // con los 3 negocios juntos (hoy solo Panel Principal y Mi Equipo).
  disponibleEnTodas?: boolean;
  // Para el módulo "dashboard": qué mostrar cuando el rol solo ve resumen
  // (Dirección) — su panel se llama distinto al de Gerencial/Ventas.
  labelResumen?: string;
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Panel Principal", modulo: "dashboard", icon: LayoutDashboard, grupo: "Principal", labelResumen: "Panel Ejecutivo", disponibleEnTodas: true },
  { href: "/clientes", label: "Clientes", modulo: "clientes", icon: Users, grupo: "Operación diaria" },
  { href: "/hospedaje", label: "Hospedaje", modulo: "hospedaje", icon: BedDouble, grupo: "Operación diaria", soloUmaru: true },
  { href: "/cumpleanos", label: "Cumpleaños", modulo: "cumpleanos", icon: Gift, grupo: "Relación con el cliente" },
  { href: "/mensajeria", label: "Mensajería", modulo: "mensajeria", icon: MessageCircle, grupo: "Relación con el cliente" },
  { href: "/campanas", label: "Campañas", modulo: "campanas", icon: Megaphone, grupo: "Relación con el cliente" },
  { href: "/dias-festivos", label: "Días Festivos", modulo: "diasFestivos", icon: PartyPopper, grupo: "Relación con el cliente" },
  { href: "/estrategias", label: "Estrategias", modulo: "estrategias", icon: Sparkles, grupo: "Gestión" },
  { href: "/equipo", label: "Mi Equipo", modulo: "equipo", icon: Users2, grupo: "Gestión", disponibleEnTodas: true },
  { href: "/usuarios", label: "Usuarios", modulo: "usuarios", icon: UserCog, grupo: "Gestión" },
];
