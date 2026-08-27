"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { useApp } from "@/lib/app-context";
import { puedeVer, accesoA } from "@/lib/permissions";
import { NAV_ITEMS } from "./nav-items";

export function Sidebar() {
  const pathname = usePathname();
  const { usuario, negocio } = useApp();

  if (!usuario) return null;

  const items = NAV_ITEMS.filter((item) => {
    if (!puedeVer(usuario.rolTipo, item.modulo)) return false;
    if (item.soloUmaru && negocio.id !== "umaru") return false;
    if (item.soloLasFlores && negocio.id !== "las-flores") return false;
    if (negocio.id === "todas" && !item.disponibleEnTodas) return false;
    return true;
  });

  return (
    <aside className="no-imprimir w-64 shrink-0 bg-[var(--color-sidebar)] text-white flex flex-col h-screen sticky top-0">
      <div className="flex items-center gap-3 px-5 h-20 border-b border-[var(--color-sidebar-border)]">
        <Image src="/logo.png" alt="Grupo Las Flores" width={36} height={36} className="w-9 h-9 shrink-0" priority />
        <div>
          <p className="font-semibold text-sm leading-tight">CRM Grupo Las Flores</p>
          <p className="text-[11px] text-white/50">Prototipo interno</p>
        </div>
      </div>

      <nav
        className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5"
        style={{
          // Sombra de scroll: avisa que hay más ítems arriba/abajo cuando el
          // menú no entra completo (ej. rol Gerencial con 12 módulos en una
          // ventana chica) — sin esto un módulo al final de la lista puede
          // parecer que no existe, solo porque quedó bajo el borde visible.
          backgroundImage:
            "linear-gradient(var(--color-sidebar) 30%, rgba(0,0,0,0)), " +
            "linear-gradient(rgba(0,0,0,0), var(--color-sidebar) 70%) 0 100%, " +
            "linear-gradient(180deg, rgba(0,0,0,0.35), rgba(0,0,0,0)), " +
            "linear-gradient(0deg, rgba(0,0,0,0.35), rgba(0,0,0,0)) 0 100%",
          backgroundRepeat: "no-repeat",
          backgroundSize: "100% 28px, 100% 28px, 100% 10px, 100% 10px",
          backgroundAttachment: "local, local, scroll, scroll",
        }}
      >
        {items.map((item, i) => {
          const activo = pathname === item.href || pathname.startsWith(item.href + "/");
          const nivel = accesoA(usuario.rolTipo, item.modulo);
          const Icon = item.icon;
          const label = nivel === "resumen" && item.labelResumen ? item.labelResumen : item.label;
          const nuevoGrupo = i > 0 && item.grupo !== items[i - 1]?.grupo;
          return (
            <div key={item.href}>
              {nuevoGrupo && (
                <p className="px-3 mt-4 mb-1.5 text-[10px] font-bold uppercase tracking-wider text-white/35">
                  {item.grupo}
                </p>
              )}
              <Link
                href={item.href}
                className={clsx(
                  "flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors min-w-0",
                  activo
                    ? "bg-[var(--color-terracota)] text-white"
                    : "text-white/70 hover:bg-[var(--color-sidebar-hover)] hover:text-white"
                )}
              >
                <Icon size={17} strokeWidth={2} className="shrink-0" />
                <span className="truncate">{label}</span>
              </Link>
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
