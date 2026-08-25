import {
  LayoutDashboard, Store, Users, CalendarCheck, Bike, BedDouble, Gift, Megaphone,
  MessageCircle, UserCog, Sparkles,
} from "lucide-react";
import { ModuloId } from "@/lib/permissions";

export interface NavItem {
  href: string;
  label: string;
  modulo: ModuloId;
  icon: typeof LayoutDashboard;
  soloUmaru?: boolean;
  soloLasFlores?: boolean;
  // Para el módulo "dashboard": qué mostrar cuando el rol solo ve resumen
  // (Dirección) — ahí se separa del tablero de un solo negocio.
  labelResumen?: string;
  // El label incluye el nombre del negocio activo (se arma en el Sidebar).
  labelConNegocio?: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Tablero", modulo: "dashboard", icon: LayoutDashboard, labelResumen: "Tablero general" },
  { href: "/tablero-negocio", label: "Tablero del negocio", modulo: "tableroNegocio", icon: Store, labelConNegocio: true },
  { href: "/clientes", label: "Clientes", modulo: "clientes", icon: Users },
  { href: "/reservas", label: "Reservas", modulo: "reservas", icon: CalendarCheck },
  { href: "/delivery", label: "Delivery", modulo: "delivery", icon: Bike, soloLasFlores: true },
  { href: "/hospedaje", label: "Hospedaje", modulo: "hospedaje", icon: BedDouble, soloUmaru: true },
  { href: "/cumpleanos", label: "Cumpleaños", modulo: "cumpleanos", icon: Gift },
  { href: "/mensajeria", label: "Mensajería", modulo: "mensajeria", icon: MessageCircle },
  { href: "/campanas", label: "Campañas", modulo: "campanas", icon: Megaphone },
  { href: "/estrategias", label: "Estrategias", modulo: "estrategias", icon: Sparkles },
  { href: "/usuarios", label: "Usuarios", modulo: "usuarios", icon: UserCog },
];
