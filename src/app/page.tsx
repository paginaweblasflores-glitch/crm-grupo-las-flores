"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/lib/app-context";

export default function RootPage() {
  const { usuario, listo } = useApp();
  const router = useRouter();

  useEffect(() => {
    if (!listo) return;
    router.replace(usuario ? "/dashboard" : "/login");
  }, [listo, usuario, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-crema)]">
      <p className="text-sm text-[var(--color-gris-medio)]">Cargando…</p>
    </div>
  );
}
