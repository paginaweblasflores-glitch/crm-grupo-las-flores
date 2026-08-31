"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Download, UserPlus, MessageCircle } from "lucide-react";
import { useApp } from "@/lib/app-context";
import { puedeRegistrarClientes } from "@/lib/permissions";
import { Topbar } from "@/components/layout/Topbar";
import { Card } from "@/components/ui/Card";
import { SearchInput } from "@/components/ui/SearchInput";
import { Table, Thead, Th, Tr, Td } from "@/components/ui/Table";
import { exportarCSV } from "@/lib/export-csv";
import { useData } from "@/lib/data-context";
import { NuevoClienteForm } from "@/components/clientes/NuevoClienteForm";
import { enlaceWhatsApp } from "@/lib/whatsapp";
import { procedenciaDe } from "@/lib/formato";

export default function ClientesPage() {
  const { usuario, negocio } = useApp();
  const router = useRouter();
  const [tab, setTab] = useState<"individual" | "corporativo">("individual");
  const [busqueda, setBusqueda] = useState("");
  const [formAbierto, setFormAbierto] = useState(false);

  const {
    clientesIndividuales, clientesCorporativos,
    crearClienteIndividual, crearClienteCorporativo,
  } = useData();

  // "Todas las sucursales" no es un negocio real donde se pueda registrar un
  // cliente — se redirige a Panel Principal, ver fueraDeAlcance más abajo.
  const individuales = useMemo(
    () => clientesIndividuales.filter((c) => c.negocioId === negocio.id),
    [clientesIndividuales, negocio.id]
  );
  const corporativos = useMemo(
    () => clientesCorporativos.filter((c) => c.negocioId === negocio.id),
    [clientesCorporativos, negocio.id]
  );

  const individualesFiltrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return individuales;
    return individuales.filter((c) =>
      `${c.nombres} ${c.apellidos} ${c.celular} ${c.distrito} ${c.pais} ${c.registradoPor ?? ""}`.toLowerCase().includes(q)
    );
  }, [individuales, busqueda]);

  const corporativosFiltrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return corporativos;
    return corporativos.filter((c) =>
      `${c.razonSocial} ${c.ruc} ${c.celular} ${c.distrito} ${c.pais} ${c.registradoPor ?? ""}`.toLowerCase().includes(q)
    );
  }, [corporativos, busqueda]);

  // Celulares de los 3 negocios del grupo — un mismo número no debería
  // registrarse dos veces como cliente distinto (SFIDA #3).
  const celularesExistentes = useMemo(() => {
    const s = new Set<string>();
    clientesIndividuales.forEach((c) => s.add(c.celular));
    clientesCorporativos.forEach((c) => s.add(c.celular));
    return s;
  }, [clientesIndividuales, clientesCorporativos]);
  const celularExiste = (celular: string) => celularesExistentes.has(celular);

  const listaActiva = tab === "individual" ? individualesFiltrados : corporativosFiltrados;

  const fueraDeAlcance = negocio.id === "todas";

  useEffect(() => {
    if (fueraDeAlcance) router.replace("/dashboard");
  }, [fueraDeAlcance, router]);

  if (!usuario || fueraDeAlcance) return null;

  function exportar() {
    if (tab === "individual") {
      exportarCSV(
        `clientes-individuales-${negocio.id}`,
        ["N°", "Fecha registro", "Nombres", "Apellidos", "Fecha nacimiento", "Celular", "País", "Departamento", "Provincia", "Distrito", "Origen"],
        individualesFiltrados.map((c) => [
          c.numero, c.fechaRegistro, c.nombres, c.apellidos, c.fechaNacimiento, c.celular,
          c.pais, c.departamento, c.provincia, c.distrito, c.origen,
        ])
      );
    } else {
      exportarCSV(
        `clientes-corporativos-${negocio.id}`,
        ["N°", "Razón social", "RUC", "Dirección", "Celular", "Representante", "País", "Departamento", "Provincia", "Distrito"],
        corporativosFiltrados.map((c) => [
          c.numero, c.razonSocial, c.ruc, c.direccion, c.celular, c.nombreRepresentante,
          c.pais, c.departamento, c.provincia, c.distrito,
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
            <SearchInput value={busqueda} onChange={setBusqueda} placeholder="Buscar por nombre, teléfono, país o RUC…" />
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
            registradoPor={usuario.id}
            celularExiste={celularExiste}
            onCancelar={() => setFormAbierto(false)}
            onGuardarIndividual={(c) => {
              void crearClienteIndividual(c);
              setTab("individual");
              setFormAbierto(false);
            }}
            onGuardarCorporativo={(c) => {
              void crearClienteCorporativo(c);
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
                <Th>Procedencia</Th>
                <Th>Origen</Th>
                <Th>{" "}</Th>
              </Thead>
              <tbody>
                {individualesFiltrados.map((c) => (
                  <Tr key={c.id} onClick={() => router.push(`/clientes/${c.id}`)}>
                    <Td className="font-medium">{c.nombres} {c.apellidos}</Td>
                    <Td>{c.celular}</Td>
                    <Td>{procedenciaDe(c)}</Td>
                    <Td className="capitalize">{c.origen.replace("-", " ")}</Td>
                    <Td><BotonWhatsApp celular={c.celular} /></Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          ) : (
            <Table>
              <Thead>
                <Th>Razón social</Th>
                <Th>RUC</Th>
                <Th>Representante</Th>
                <Th>Procedencia</Th>
                <Th>Celular</Th>
                <Th>{" "}</Th>
              </Thead>
              <tbody>
                {corporativosFiltrados.map((c) => (
                  <Tr key={c.id}>
                    <Td className="font-medium">{c.razonSocial}</Td>
                    <Td>{c.ruc}</Td>
                    <Td>{c.nombreRepresentante}</Td>
                    <Td>{procedenciaDe(c)}</Td>
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
