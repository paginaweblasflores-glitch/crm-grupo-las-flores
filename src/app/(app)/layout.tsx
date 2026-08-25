"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/lib/app-context";
import { Sidebar } from "@/components/layout/Sidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { usuario, listo } = useApp();
  const router = useRouter();

  useEffect(() => {
    if (listo && !usuario) router.replace("/login");
  }, [listo, usuario, router]);

  if (!listo || !usuario) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-crema)]">
        <p className="text-sm text-[var(--color-gris-medio)]">Cargando…</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[var(--background)]">
      <Sidebar />
      <div className="flex-1 min-w-0 flex flex-col">{children}</div>
    </div>
  );
}
