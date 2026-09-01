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
import { Paginador } from "@/components/ui/Paginador";
import { exportarExcel } from "@/lib/exportar-excel";
import { useData } from "@/lib/data-context";
import { NuevoClienteForm } from "@/components/clientes/NuevoClienteForm";
import { ModalConfirmar } from "@/components/ui/ModalConfirmar";
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
  const [eliminandoIndividual, setEliminandoIndividual] = useState<ClienteIndividual | null>(null);
  const [eliminandoCorporativo, setEliminandoCorporativo] = useState<ClienteCorporativo | null>(null);
  const [exportando, setExportando] = useState(false);
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
      `${c.nombres} ${c.apellidos} ${c.celular} ${c.distrito} ${c.registradoPor ?? ""}`.toLowerCase().includes(q)
    );
  }, [individuales, busqueda]);

  const corporativosFiltrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return corporativos;
    return corporativos.filter((c) =>
      `${c.razonSocial} ${c.ruc} ${c.celular} ${c.distrito} ${c.registradoPor ?? ""}`.toLowerCase().includes(q)
    );
  }, [corporativos, busqueda]);

  // Celulares de los 3 negocios del grupo — sigue usándose tal cual para
  // clientes corporativos, donde el RUC ya es el identificador de verdad
  // de la empresa y el celular repetido entre negocios sigue siendo raro.
  const celularesExistentes = useMemo(() => {
    const s = new Set<string>();
    clientesIndividuales.forEach((c) => s.add(c.celular));
    clientesCorporativos.forEach((c) => s.add(c.celular));
    return s;
  }, [clientesIndividuales, clientesCorporativos]);
  const celularExiste = (celular: string) => celularesExistentes.has(celular);

  // Para clientes individuales, en cambio, un mismo celular repetido YA NO
  // basta para tratarlos como "el mismo cliente" — los datos reales que se
  // subieron mostraron casos genuinos de dos personas distintas
  // compartiendo un teléfono familiar. Ahora hace falta que coincidan
  // celular Y fecha de nacimiento a la vez (de los 3 negocios del grupo,
  // igual que antes) para bloquear el registro como duplicado.
  const clienteIndividualDuplicado = (celular: string, fechaNacimiento: string, idExcluir?: string) =>
    clientesIndividuales.some(
      (c) => c.id !== idExcluir && c.celular === celular && c.fechaNacimiento === fechaNacimiento
    );

  const listaActiva = tab === "individual" ? individualesFiltrados : corporativosFiltrados;

  // 100 por página — con miles de clientes reales (Restaurante Las Flores
  // ya pasó los 8000), mostrarlos todos de una sola vez en la tabla se
  // sentía lento y pesado de scrollear. La página se reinicia a la 1 cada
  // vez que cambia la pestaña, la búsqueda o el negocio — quedarse "en la
  // página 40" después de filtrar a 3 resultados sería confuso.
  const POR_PAGINA = 100;
  const [pagina, setPagina] = useState(1);
  // Sincroniza la página con filtros que cambian fuera de este estado
  // (pestaña, búsqueda, negocio) — no arranca un ciclo de renders en
  // cascada, solo vuelve a la 1 cuando cambia alguno de esos tres.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    setPagina(1);
  }, [tab, busqueda, negocio.id]);
  /* eslint-enable react-hooks/set-state-in-effect */
  const totalPaginas = Math.max(1, Math.ceil(listaActiva.length / POR_PAGINA));
  const paginaSegura = Math.min(pagina, totalPaginas);
  const inicioPagina = (paginaSegura - 1) * POR_PAGINA;
  const individualesPagina = individualesFiltrados.slice(inicioPagina, inicioPagina + POR_PAGINA);
  const corporativosPagina = corporativosFiltrados.slice(inicioPagina, inicioPagina + POR_PAGINA);

  const fueraDeAlcance = negocio.id === "todas";

  useEffect(() => {
    if (fueraDeAlcance) router.replace("/dashboard");
  }, [fueraDeAlcance, router]);

  if (!usuario || fueraDeAlcance) return null;

  async function exportar() {
    if (exportando) return;
    setExportando(true);
    const nombreGenerador = usuario?.nombreReal ?? usuario?.nombre ?? "";
    try {
      if (tab === "individual") {
        await exportarExcel({
          archivo: `clientes-individuales-${negocio.id}`,
          hoja: "Clientes individuales",
          negocioId: negocio.id,
          titulo: "Clientes individuales",
          generadoPor: nombreGenerador,
          columnas: ["N°", "Fecha registro", "Nombres", "Apellidos", "Fecha nacimiento", "Celular", "Departamento", "Provincia", "Distrito", "Origen"],
          filas: individualesFiltrados.map((c) => [
            c.numero, c.fechaRegistro, c.nombres, c.apellidos, c.fechaNacimiento, c.celular,
            c.departamento, c.provincia, c.distrito, c.origen,
          ]),
        });
      } else {
        await exportarExcel({
          archivo: `clientes-corporativos-${negocio.id}`,
          hoja: "Clientes corporativos",
          negocioId: negocio.id,
          titulo: "Clientes corporativos",
          generadoPor: nombreGenerador,
          columnas: ["N°", "Razón social", "RUC", "Dirección", "Celular", "Representante", "Departamento", "Provincia", "Distrito"],
          filas: corporativosFiltrados.map((c) => [
            c.numero, c.razonSocial, c.ruc, c.direccion, c.celular, c.nombreRepresentante,
            c.departamento, c.provincia, c.distrito,
          ]),
        });
      }
    } finally {
      setExportando(false);
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
                onClick={() => (mostrarForm ? cerrarForm() : setFormAbierto(true))}
                className="flex items-center gap-2 bg-[var(--color-terracota)] text-white text-sm font-semibold rounded-xl px-4 py-2.5 hover:opacity-90 transition-opacity whitespace-nowrap"
              >
                <UserPlus size={15} />
                Nuevo cliente
              </button>
            )}
            <button
              onClick={exportar}
              disabled={exportando}
              className="flex items-center gap-2 bg-[var(--color-verde)] text-white text-sm font-semibold rounded-xl px-4 py-2.5 hover:opacity-90 transition-opacity whitespace-nowrap disabled:opacity-60 disabled:cursor-wait"
            >
              <Download size={15} />
              {exportando ? "Generando…" : "Exportar a Excel"}
            </button>
          </div>
        </div>

        {mostrarForm && (
          <NuevoClienteForm
            negocioId={negocio.id}
            registradoPor={usuario.id}
            celularExiste={celularExiste}
            individualDuplicado={clienteIndividualDuplicado}
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
                <Th>Departamento</Th>
                <Th>Provincia</Th>
                <Th>Distrito</Th>
                <Th>{" "}</Th>
              </Thead>
              <tbody className="uppercase">
                {individualesPagina.map((c) => (
                  <Tr key={c.id} onClick={() => router.push(`/clientes/${c.id}`)}>
                    <Td className="font-medium">{c.nombres} {c.apellidos}</Td>
                    <Td>{c.celular}</Td>
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
                              onClick={(e) => { e.stopPropagation(); setEliminandoIndividual(c); }}
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
                <Th>Departamento</Th>
                <Th>Provincia</Th>
                <Th>Distrito</Th>
                <Th>{" "}</Th>
              </Thead>
              <tbody className="uppercase">
                {corporativosPagina.map((c) => (
                  <Tr key={c.id}>
                    <Td className="font-medium">{c.razonSocial}</Td>
                    <Td>{c.ruc}</Td>
                    <Td>{c.direccion}</Td>
                    <Td>{c.nombreRepresentante}</Td>
                    <Td>{c.cargoRepresentante}</Td>
                    <Td>{c.celular}</Td>
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
                              onClick={() => setEliminandoCorporativo(c)}
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
          {listaActiva.length > 0 && (
            <>
              <p className="text-center text-xs text-[var(--color-gris-medio)] pt-3">
                Mostrando {inicioPagina + 1}–{Math.min(inicioPagina + POR_PAGINA, listaActiva.length)} de {listaActiva.length}
              </p>
              <Paginador pagina={paginaSegura} totalPaginas={totalPaginas} onCambiar={setPagina} />
            </>
          )}
        </Card>
      </main>

      {eliminandoIndividual && (
        <ModalConfirmar
          titulo="Eliminar cliente"
          mensaje={`¿Eliminar a ${eliminandoIndividual.nombres} ${eliminandoIndividual.apellidos}? Esto no se puede deshacer.`}
          textoConfirmar="Eliminar"
          onCancelar={() => setEliminandoIndividual(null)}
          onConfirmar={() => { void eliminarClienteIndividual(eliminandoIndividual.id); setEliminandoIndividual(null); }}
        />
      )}
      {eliminandoCorporativo && (
        <ModalConfirmar
          titulo="Eliminar cliente"
          mensaje={`¿Eliminar a ${eliminandoCorporativo.razonSocial}? Esto no se puede deshacer.`}
          textoConfirmar="Eliminar"
          onCancelar={() => setEliminandoCorporativo(null)}
          onConfirmar={() => { void eliminarClienteCorporativo(eliminandoCorporativo.id); setEliminandoCorporativo(null); }}
        />
      )}
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
