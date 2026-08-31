"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Download, UserPlus, MessageCircle, Pencil, Trash2 } from "lucide-react";
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
import { valorOGuion } from "@/lib/formato";
import { ClienteIndividual, ClienteCorporativo } from "@/lib/types";

export default function ClientesPage() {
  const { usuario, negocio } = useApp();
  const router = useRouter();
  const [tab, setTab] = useState<"individual" | "corporativo">("individual");
  const [busqueda, setBusqueda] = useState("");
  const [formAbierto, setFormAbierto] = useState(false);
  const [editandoIndividual, setEditandoIndividual] = useState<ClienteIndividual | null>(null);
  const [editandoCorporativo, setEditandoCorporativo] = useState<ClienteCorporativo | null>(null);
  const mostrarForm = formAbierto || editandoIndividual !== null || editandoCorporativo !== null;
  function cerrarForm() {
    setFormAbierto(false);
    setEditandoIndividual(null);
    setEditandoCorporativo(null);
  }

  const {
    clientesIndividuales, clientesCorporativos,
    crearClienteIndividual, actualizarClienteIndividual, eliminarClienteIndividual,
    crearClienteCorporativo, actualizarClienteCorporativo, eliminarClienteCorporativo,
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
                onClick={() => (mostrarForm ? cerrarForm() : setFormAbierto(true))}
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

        {mostrarForm && (
          <NuevoClienteForm
            negocioId={negocio.id}
            registradoPor={usuario.id}
            celularExiste={celularExiste}
            individualEditando={editandoIndividual ?? undefined}
            corporativoEditando={editandoCorporativo ?? undefined}
            onCancelar={cerrarForm}
            onGuardarIndividual={(c) => {
              void (editandoIndividual ? actualizarClienteIndividual(c.id, c) : crearClienteIndividual(c));
              setTab("individual");
              cerrarForm();
            }}
            onGuardarCorporativo={(c) => {
              void (editandoCorporativo ? actualizarClienteCorporativo(c.id, c) : crearClienteCorporativo(c));
              setTab("corporativo");
              cerrarForm();
            }}
          />
        )}

        <Card padding="p-0 pt-5">
          {tab === "individual" ? (
            <Table>
              <Thead>
                <Th>Nombre</Th>
                <Th>Celular</Th>
                <Th>País</Th>
                <Th>Departamento</Th>
                <Th>Provincia</Th>
                <Th>Distrito</Th>
                <Th>{" "}</Th>
              </Thead>
              <tbody>
                {individualesFiltrados.map((c) => (
                  <Tr key={c.id} onClick={() => router.push(`/clientes/${c.id}`)}>
                    <Td className="font-medium">{c.nombres} {c.apellidos}</Td>
                    <Td>{c.celular}</Td>
                    <Td>{valorOGuion(c.pais)}</Td>
                    <Td>{valorOGuion(c.departamento)}</Td>
                    <Td>{valorOGuion(c.provincia)}</Td>
                    <Td>{valorOGuion(c.distrito)}</Td>
                    <Td>
                      <div className="flex items-center gap-1">
                        <BotonWhatsApp celular={c.celular} />
                        {puedeRegistrarClientes(usuario.rolTipo) && (
                          <>
                            <BotonAccion
                              titulo="Editar cliente"
                              icono={<Pencil size={14} />}
                              onClick={(e) => { e.stopPropagation(); setEditandoIndividual(c); }}
                            />
                            <BotonAccion
                              titulo="Eliminar cliente"
                              icono={<Trash2 size={14} />}
                              tono="rojo"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (confirm(`¿Eliminar a ${c.nombres} ${c.apellidos}? Esto no se puede deshacer.`)) void eliminarClienteIndividual(c.id);
                              }}
                            />
                          </>
                        )}
                      </div>
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          ) : (
            <Table>
              <Thead>
                <Th>Razón social</Th>
                <Th>RUC</Th>
                <Th>Dirección</Th>
                <Th>Representante</Th>
                <Th>Cargo</Th>
                <Th>Celular</Th>
                <Th>País</Th>
                <Th>Departamento</Th>
                <Th>Provincia</Th>
                <Th>Distrito</Th>
                <Th>{" "}</Th>
              </Thead>
              <tbody>
                {corporativosFiltrados.map((c) => (
                  <Tr key={c.id}>
                    <Td className="font-medium">{c.razonSocial}</Td>
                    <Td>{c.ruc}</Td>
                    <Td>{c.direccion}</Td>
                    <Td>{c.nombreRepresentante}</Td>
                    <Td>{c.cargoRepresentante}</Td>
                    <Td>{c.celular}</Td>
                    <Td>{valorOGuion(c.pais)}</Td>
                    <Td>{valorOGuion(c.departamento)}</Td>
                    <Td>{valorOGuion(c.provincia)}</Td>
                    <Td>{valorOGuion(c.distrito)}</Td>
                    <Td>
                      <div className="flex items-center gap-1">
                        <BotonWhatsApp celular={c.celular} />
                        {puedeRegistrarClientes(usuario.rolTipo) && (
                          <>
                            <BotonAccion
                              titulo="Editar cliente"
                              icono={<Pencil size={14} />}
                              onClick={() => setEditandoCorporativo(c)}
                            />
                            <BotonAccion
                              titulo="Eliminar cliente"
                              icono={<Trash2 size={14} />}
                              tono="rojo"
                              onClick={() => {
                                if (confirm(`¿Eliminar a ${c.razonSocial}? Esto no se puede deshacer.`)) void eliminarClienteCorporativo(c.id);
                              }}
                            />
                          </>
                        )}
                      </div>
                    </Td>
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

function BotonAccion({
  titulo, icono, onClick, tono = "gris",
}: {
  titulo: string; icono: React.ReactNode; onClick: (e: React.MouseEvent) => void; tono?: "gris" | "rojo";
}) {
  return (
    <button
      onClick={onClick}
      title={titulo}
      className={`inline-flex items-center justify-center w-7 h-7 rounded-lg transition-colors ${
        tono === "rojo"
          ? "text-[var(--color-gris-medio)] hover:bg-[var(--color-rojo)]/10 hover:text-[var(--color-rojo)]"
          : "text-[var(--color-gris-medio)] hover:bg-[var(--color-crema)] hover:text-[var(--color-terracota)]"
      }`}
    >
      {icono}
    </button>
  );
}
