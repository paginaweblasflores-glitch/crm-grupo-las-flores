"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Download, UserPlus, MessageCircle } from "lucide-react";
import { useApp } from "@/lib/app-context";
import { puedeRegistrarClientes } from "@/lib/permissions";
import { Topbar } from "@/components/layout/Topbar";
import { Card } from "@/components/ui/Card";
import { SearchInput } from "@/components/ui/SearchInput";
import { Badge } from "@/components/ui/Badge";
import { Table, Thead, Th, Tr, Td } from "@/components/ui/Table";
import { Paginacion, paginar } from "@/components/ui/Paginacion";
import {
  clientesIndividualesPorNegocio, corporativosPorNegocio, CLIENTES_INDIVIDUALES, CLIENTES_CORPORATIVOS,
} from "@/lib/mock/clientes";
import { resumenDeCliente, ETIQUETA_CLASIFICACION, COLOR_CLASIFICACION } from "@/lib/frecuencia";
import { exportarCSV } from "@/lib/export-csv";
import { useClientesCreados, useClientesCorporativosCreados } from "@/lib/store";
import { NuevoClienteForm } from "@/components/clientes/NuevoClienteForm";
import { enlaceWhatsApp } from "@/lib/whatsapp";

const POR_PAGINA = 15;

export default function ClientesPage() {
  const { usuario, negocio } = useApp();
  const router = useRouter();
  const [tab, setTabState] = useState<"individual" | "corporativo">("individual");
  const [busqueda, setBusquedaState] = useState("");
  const [pagina, setPagina] = useState(1);
  const [formAbierto, setFormAbierto] = useState(false);

  // Cambiar de pestaña o buscar reinicia la página — si no, podrías quedar
  // "varado" en una página 4 que ya no existe para el nuevo filtro.
  function setTab(t: "individual" | "corporativo") {
    setTabState(t);
    setPagina(1);
  }
  function setBusqueda(v: string) {
    setBusquedaState(v);
    setPagina(1);
  }
  const { items: creados, add: agregarCliente } = useClientesCreados();
  const { items: corpCreados, add: agregarCorporativo } = useClientesCorporativosCreados();

  const individuales = useMemo(
    () => [...creados.filter((c) => c.negocioId === negocio.id), ...clientesIndividualesPorNegocio(negocio.id)],
    [creados, negocio.id]
  );
  const corporativos = useMemo(
    () => [...corpCreados.filter((c) => c.negocioId === negocio.id), ...corporativosPorNegocio(negocio.id)],
    [corpCreados, negocio.id]
  );

  const individualesFiltrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return individuales;
    return individuales.filter((c) =>
      `${c.nombres} ${c.apellidos} ${c.celular} ${c.distrito}`.toLowerCase().includes(q)
    );
  }, [individuales, busqueda]);

  const corporativosFiltrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return corporativos;
    return corporativos.filter((c) =>
      `${c.razonSocial} ${c.ruc} ${c.celular} ${c.distrito}`.toLowerCase().includes(q)
    );
  }, [corporativos, busqueda]);

  // Celulares de los 3 negocios del grupo — un mismo número no debería
  // registrarse dos veces como cliente distinto (SFIDA #3).
  const celularesExistentes = useMemo(() => {
    const s = new Set<string>();
    CLIENTES_INDIVIDUALES.forEach((c) => s.add(c.celular));
    CLIENTES_CORPORATIVOS.forEach((c) => s.add(c.celular));
    creados.forEach((c) => s.add(c.celular));
    corpCreados.forEach((c) => s.add(c.celular));
    return s;
  }, [creados, corpCreados]);
  const celularExiste = (celular: string) => celularesExistentes.has(celular);

  const listaActiva = tab === "individual" ? individualesFiltrados : corporativosFiltrados;
  const totalPaginas = Math.max(1, Math.ceil(listaActiva.length / POR_PAGINA));
  const individualesPagina = useMemo(() => paginar(individualesFiltrados, pagina, POR_PAGINA), [individualesFiltrados, pagina]);
  const corporativosPagina = useMemo(() => paginar(corporativosFiltrados, pagina, POR_PAGINA), [corporativosFiltrados, pagina]);

  if (!usuario) return null;

  function exportar() {
    if (tab === "individual") {
      exportarCSV(
        `clientes-individuales-${negocio.id}`,
        ["N°", "Fecha registro", "Nombres", "Apellidos", "Fecha nacimiento", "Celular", "Distrito", "Origen"],
        individualesFiltrados.map((c) => [
          c.numero, c.fechaRegistro, c.nombres, c.apellidos, c.fechaNacimiento, c.celular, c.distrito, c.origen,
        ])
      );
    } else {
      exportarCSV(
        `clientes-corporativos-${negocio.id}`,
        ["N°", "Razón social", "RUC", "Dirección", "Celular", "Representante", "Distrito"],
        corporativosFiltrados.map((c) => [
          c.numero, c.razonSocial, c.ruc, c.direccion, c.celular, c.nombreRepresentante, c.distrito,
        ])
      );
    }
  }

  return (
    <>
      <Topbar titulo="Clientes" descripcion={`${negocio.nombre} · ficha 360° por cliente`} />
      <main className="flex-1 p-8 animate-fade-in space-y-5">
        <div className="flex flex-wrap items-center gap-3 justify-between">
          <div className="flex bg-white rounded-xl border border-[var(--color-gris-claro)]/50 p-1">
            <button
              onClick={() => setTab("individual")}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${tab === "individual" ? "bg-[var(--color-terracota)] text-white" : "text-[var(--color-gris-medio)]"}`}
            >
              Individuales ({individuales.length})
            </button>
            <button
              onClick={() => setTab("corporativo")}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${tab === "corporativo" ? "bg-[var(--color-terracota)] text-white" : "text-[var(--color-gris-medio)]"}`}
            >
              Corporativos ({corporativos.length})
            </button>
          </div>
          <div className="flex items-center gap-3 flex-1 justify-end">
            <SearchInput value={busqueda} onChange={setBusqueda} placeholder="Buscar por nombre, teléfono, distrito o RUC…" />
            {puedeRegistrarClientes(usuario.rolTipo) && (
              <button
                onClick={() => setFormAbierto((v) => !v)}
                className="flex items-center gap-2 bg-[var(--color-terracota)] text-white text-sm font-semibold rounded-xl px-4 py-2.5 hover:opacity-90 transition-opacity whitespace-nowrap"
              >
                <UserPlus size={15} />
                Nuevo cliente
              </button>
            )}
            <button
              onClick={exportar}
              className="flex items-center gap-2 bg-[var(--color-verde)] text-white text-sm font-semibold rounded-xl px-4 py-2.5 hover:opacity-90 transition-opacity whitespace-nowrap"
            >
              <Download size={15} />
              Exportar a Excel
            </button>
          </div>
        </div>

        {formAbierto && (
          <NuevoClienteForm
            negocioId={negocio.id}
            registradoPor={usuario.nombre}
            celularExiste={celularExiste}
            onCancelar={() => setFormAbierto(false)}
            onGuardarIndividual={(c) => {
              agregarCliente(c);
              setTab("individual");
              setFormAbierto(false);
            }}
            onGuardarCorporativo={(c) => {
              agregarCorporativo(c);
              setTab("corporativo");
              setFormAbierto(false);
            }}
          />
        )}

        <Card padding="p-0 pt-5">
          {tab === "individual" ? (
            <Table>
              <Thead>
                <Th>Nombre</Th>
                <Th>Celular</Th>
                <Th>Distrito</Th>
                <Th>Origen</Th>
                <Th>Frecuencia</Th>
                <Th>{" "}</Th>
              </Thead>
              <tbody>
                {individualesPagina.map((c) => {
                  const resumen = resumenDeCliente(c);
                  return (
                    <Tr key={c.id} onClick={() => router.push(`/clientes/${c.id}`)}>
                      <Td className="font-medium">{c.nombres} {c.apellidos}</Td>
                      <Td>{c.celular}</Td>
                      <Td>{c.distrito}</Td>
                      <Td className="capitalize">{c.origen.replace("-", " ")}</Td>
                      <Td>
                        <Badge tono={COLOR_CLASIFICACION[resumen.clasificacion]}>
                          {ETIQUETA_CLASIFICACION[resumen.clasificacion]}
                        </Badge>
                      </Td>
                      <Td><BotonWhatsApp celular={c.celular} /></Td>
                    </Tr>
                  );
                })}
              </tbody>
            </Table>
          ) : (
            <Table>
              <Thead>
                <Th>Razón social</Th>
                <Th>RUC</Th>
                <Th>Representante</Th>
                <Th>Distrito</Th>
                <Th>Celular</Th>
                <Th>{" "}</Th>
              </Thead>
              <tbody>
                {corporativosPagina.map((c) => (
                  <Tr key={c.id}>
                    <Td className="font-medium">{c.razonSocial}</Td>
                    <Td>{c.ruc}</Td>
                    <Td>{c.nombreRepresentante}</Td>
                    <Td>{c.distrito}</Td>
                    <Td>{c.celular}</Td>
                    <Td><BotonWhatsApp celular={c.celular} /></Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          )}
          {listaActiva.length === 0 && (
            <p className="text-center text-sm text-[var(--color-gris-medio)] py-10">Sin resultados para esa búsqueda.</p>
          )}
          <Paginacion pagina={pagina} totalPaginas={totalPaginas} onCambiar={setPagina} totalItems={listaActiva.length} porPagina={POR_PAGINA} />
        </Card>
      </main>
    </>
  );
}

function BotonWhatsApp({ celular }: { celular: string }) {
  return (
    <a
      href={enlaceWhatsApp(celular)}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      title="Abrir WhatsApp"
      className="inline-flex items-center justify-center w-7 h-7 rounded-lg text-[var(--color-verde)] hover:bg-[var(--color-verde-claro)] transition-colors"
    >
      <MessageCircle size={15} />
    </a>
  );
}
