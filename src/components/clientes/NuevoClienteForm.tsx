"use client";

import { useState } from "react";
import { X, User, Building2 } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { DISTRITOS_AYACUCHO, DEPARTAMENTOS_PERU, PROVINCIAS_AYACUCHO } from "@/lib/mock/nombres";
import { ClienteIndividual, ClienteCorporativo, NegocioId, Genero } from "@/lib/types";
import {
  requerido, celularPeru, emailOpcional, fechaPasada, limitarDigitos,
  rucPeru, soloLetras, nombrePersona, Errores,
} from "@/lib/validacion";

const GENEROS: Genero[] = ["Femenino", "Masculino"];

export function NuevoClienteForm({
  negocioId, registradoPor, celularExiste, individualDuplicado, onGuardarIndividual, onGuardarCorporativo, onCancelar,
  individualEditando, corporativoEditando,
}: {
  negocioId: NegocioId;
  registradoPor: string;
  // Para clientes corporativos: verifica el celular contra la base de los 3
  // negocios del grupo — el RUC ya identifica a la empresa, pero un celular
  // repetido igual conviene avisarlo.
  celularExiste: (celular: string) => boolean;
  // Para clientes individuales: un celular repetido YA NO basta para
  // tratarlos como el mismo cliente (puede ser un teléfono familiar
  // compartido por dos personas distintas) — hace falta que coincidan
  // celular Y fecha de nacimiento a la vez.
  individualDuplicado: (celular: string, fechaNacimiento: string, idExcluir?: string) => boolean;
  onGuardarIndividual: (c: ClienteIndividual) => void;
  onGuardarCorporativo: (c: ClienteCorporativo) => void;
  onCancelar: () => void;
  // Presente solo cuando se está EDITANDO un cliente ya existente (nunca los
  // dos a la vez) — precarga el formulario y esconde el selector Natural/
  // Corporativo, porque no se puede "convertir" un cliente de un tipo a otro
  // (son tablas distintas, con campos distintos).
  individualEditando?: ClienteIndividual;
  corporativoEditando?: ClienteCorporativo;
}) {
  const editando = individualEditando ?? corporativoEditando;
  const [tipo, setTipo] = useState<"individual" | "corporativo">(corporativoEditando ? "corporativo" : "individual");

  return (
    <Card className="animate-fade-in">
      <div className="flex items-center justify-between mb-1">
        <CardHeader
          title={editando ? "Editar cliente" : "Registrar cliente nuevo"}
          subtitle={editando ? "Los cambios se guardan directo en el sistema" : "Directo en el sistema — ya no hace falta pasarlo a Excel después"}
        />
        <button onClick={onCancelar} className="text-[var(--color-gris-medio)] hover:text-[var(--color-gris)]">
          <X size={18} />
        </button>
      </div>

      {!editando && (
        <div className="flex bg-[var(--color-crema)] rounded-xl p-1 mb-5 w-fit">
          <button
            type="button"
            onClick={() => setTipo("individual")}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${tipo === "individual" ? "bg-white shadow-sm text-[var(--color-terracota)]" : "text-[var(--color-gris-medio)]"}`}
          >
            <User size={14} /> Natural
          </button>
          <button
            type="button"
            onClick={() => setTipo("corporativo")}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${tipo === "corporativo" ? "bg-white shadow-sm text-[var(--color-terracota)]" : "text-[var(--color-gris-medio)]"}`}
          >
            <Building2 size={14} /> Corporativo
          </button>
        </div>
      )}

      {tipo === "individual" ? (
        <FormIndividual
          negocioId={negocioId} registradoPor={registradoPor} individualDuplicado={individualDuplicado}
          onGuardar={onGuardarIndividual} onCancelar={onCancelar} editar={individualEditando}
        />
      ) : (
        <FormCorporativo
          negocioId={negocioId} registradoPor={registradoPor} celularExiste={celularExiste}
          onGuardar={onGuardarCorporativo} onCancelar={onCancelar} editar={corporativoEditando}
        />
      )}
    </Card>
  );
}

// --- Procedencia: Departamento → Provincia → Distrito -----------------------
// Sin campo de país — el negocio solo atiende clientes de Perú (decisión de
// Mijael, los pocos casos de otros países no ameritan el campo). El negocio
// es local de Huamanga, así que la cascada empieza ya resuelta en los
// valores por defecto (Ayacucho / Huamanga) — quien registra no tiene que
// tocar nada si el cliente es de acá. En cuanto alguien elige un valor
// distinto del default en un nivel, ya no tiene sentido pedir (ni guardar)
// el siguiente nivel — no tenemos distritos de Lima — así que el "efectivo"
// de un campo oculto por la cascada es "", calculado acá mismo en cada
// render (nunca con un efecto que limpie estado): si el campo vuelve a
// mostrarse, recupera lo último que se había escrito ahí en vez de
// reiniciarse al valor por defecto.
function useUbicacion(inicial?: { departamento: string; provincia: string; distrito: string }) {
  const [departamento, setDepartamento] = useState<string>(inicial?.departamento || DEPARTAMENTOS_PERU[0]);
  const [provincia, setProvincia] = useState<string>(inicial?.provincia || PROVINCIAS_AYACUCHO[0]);
  const [distrito, setDistrito] = useState<string>(inicial?.distrito || DISTRITOS_AYACUCHO[0]);

  const provinciaEfectiva = departamento === "Ayacucho" ? provincia : "";
  const distritoEfectivo = provinciaEfectiva === "Huamanga" ? distrito : "";

  return {
    departamento, setDepartamento,
    provincia: provinciaEfectiva, setProvincia,
    distrito: distritoEfectivo, setDistrito,
  };
}

function CamposUbicacion({
  departamento, setDepartamento, provincia, setProvincia, distrito, setDistrito, errores,
}: {
  departamento: string; setDepartamento: (v: string) => void;
  provincia: string; setProvincia: (v: string) => void;
  distrito: string; setDistrito: (v: string) => void;
  errores: Errores;
}) {
  return (
    <>
      <SelectConOtro label="Departamento" opciones={DEPARTAMENTOS_PERU} value={departamento} onChange={setDepartamento} requerido error={errores.departamento} />
      {departamento === "Ayacucho" && (
        <SelectConOtro label="Provincia" opciones={PROVINCIAS_AYACUCHO} value={provincia} onChange={setProvincia} requerido error={errores.provincia} />
      )}
      {departamento === "Ayacucho" && provincia === "Huamanga" && (
        <SelectConOtro label="Distrito" opciones={DISTRITOS_AYACUCHO} value={distrito} onChange={setDistrito} requerido error={errores.distrito} />
      )}
    </>
  );
}

function validarUbicacion(departamento: string, provincia: string, distrito: string): Errores {
  const err: Errores = {};
  const eDepto = requerido(departamento, "El departamento");
  if (eDepto) err.departamento = eDepto;
  if (departamento !== "Ayacucho") return err;
  const eProv = requerido(provincia, "La provincia");
  if (eProv) err.provincia = eProv;
  if (provincia !== "Huamanga") return err;
  const eDist = requerido(distrito, "El distrito");
  if (eDist) err.distrito = eDist;
  return err;
}

function FormIndividual({
  negocioId, registradoPor, individualDuplicado, onGuardar, onCancelar, editar,
}: {
  negocioId: NegocioId; registradoPor: string;
  individualDuplicado: (celular: string, fechaNacimiento: string, idExcluir?: string) => boolean;
  onGuardar: (c: ClienteIndividual) => void; onCancelar: () => void;
  editar?: ClienteIndividual;
}) {
  const [nombres, setNombres] = useState(editar?.nombres ?? "");
  const [apellidos, setApellidos] = useState(editar?.apellidos ?? "");
  const [celular, setCelular] = useState(editar?.celular ?? "");
  const [email, setEmail] = useState(editar?.email ?? "");
  const [fechaNacimiento, setFechaNacimiento] = useState(editar?.fechaNacimiento ?? "");
  const [genero, setGenero] = useState<Genero | "">(editar?.genero ?? "Masculino");
  const ubicacion = useUbicacion(editar);
  const [aceptaComunicaciones, setAceptaComunicaciones] = useState(editar?.aceptaComunicaciones ?? true);
  const [errores, setErrores] = useState<Errores>({});

  function validar(): Errores {
    const err: Errores = {};
    const eNombres = nombrePersona(nombres, "El nombre");
    if (eNombres) err.nombres = eNombres;
    const eApellidos = nombrePersona(apellidos, "El apellido");
    if (eApellidos) err.apellidos = eApellidos;
    const eCelular = celularPeru(celular);
    if (eCelular) err.celular = eCelular;
    const eEmail = emailOpcional(email);
    if (eEmail) err.email = eEmail;
    const eFecha = fechaPasada(fechaNacimiento, "La fecha de nacimiento");
    if (eFecha) err.fechaNacimiento = eFecha;
    // Recién con las dos cosas válidas tiene sentido buscar el duplicado —
    // un celular repetido ya no basta solo, hace falta que la fecha de
    // nacimiento también coincida (puede ser un teléfono familiar
    // compartido por dos personas distintas, no la misma).
    if (!eCelular && !eFecha && individualDuplicado(celular, fechaNacimiento, editar?.id)) {
      err.celular = "Ya existe un cliente registrado con este celular y esta fecha de nacimiento.";
    }
    Object.assign(err, validarUbicacion(ubicacion.departamento, ubicacion.provincia, ubicacion.distrito));
    return err;
  }

  function guardar(e: React.FormEvent) {
    e.preventDefault();
    const err = validar();
    setErrores(err);
    if (Object.keys(err).length > 0) return;
    onGuardar({
      // Editando: se conserva todo lo que no se toca en este formulario
      // (id, numero, fechaRegistro, origen, registradoPor) — solo cambian
      // los campos que sí se muestran acá.
      ...(editar ?? {
        id: `${negocioId}-cli-manual-${Date.now()}`,
        negocioId,
        numero: 0,
        fechaRegistro: new Date().toISOString().slice(0, 10),
        // Se registra desde este formulario → siempre es captación CRM
        // (presencial). "web" solo lo pone la futura integración con la
        // página de cada negocio, nunca alguien llenando este formulario.
        origen: "crm" as const,
        registradoPor,
      }),
      negocioId,
      nombres: nombres.trim(),
      apellidos: apellidos.trim(),
      fechaNacimiento,
      celular,
      departamento: ubicacion.departamento,
      provincia: ubicacion.provincia,
      distrito: ubicacion.distrito,
      email: email.trim() || undefined,
      genero: genero || undefined,
      aceptaComunicaciones,
    });
  }

  return (
    <form onSubmit={guardar} noValidate className="grid sm:grid-cols-2 gap-3">
      <Campo label="Nombres" requerido error={errores.nombres}>
        <input value={nombres} onChange={(e) => setNombres(soloLetras(e.target.value))} className="input" />
      </Campo>
      <Campo label="Apellidos" requerido error={errores.apellidos}>
        <input value={apellidos} onChange={(e) => setApellidos(soloLetras(e.target.value))} className="input" />
      </Campo>

      <Campo label="Celular (WhatsApp)" requerido error={errores.celular}>
        <input
          value={celular}
          onChange={(e) => setCelular(limitarDigitos(e.target.value, 9))}
          maxLength={9}
          inputMode="numeric"
          placeholder="9XXXXXXXX"
          className="input"
        />
      </Campo>
      <Campo label="Correo (opcional)" error={errores.email}>
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nombre@correo.com" className="input" />
      </Campo>

      <Campo label="Fecha de nacimiento" requerido error={errores.fechaNacimiento}>
        <input type="date" value={fechaNacimiento} onChange={(e) => setFechaNacimiento(e.target.value)} className="input" />
      </Campo>
      <Campo label="Género" requerido>
        <select value={genero} onChange={(e) => setGenero(e.target.value as Genero)} className="input bg-white">
          {GENEROS.map((g) => <option key={g} value={g}>{g}</option>)}
        </select>
      </Campo>

      <CamposUbicacion {...ubicacion} errores={errores} />

      <label className="sm:col-span-2 flex items-center gap-2 text-xs text-[var(--color-gris-medio)] mt-1">
        <input type="checkbox" checked={aceptaComunicaciones} onChange={(e) => setAceptaComunicaciones(e.target.checked)} className="rounded" />
        Acepta recibir promociones y saludos de cumpleaños por WhatsApp
      </label>

      <BotonesForm onCancelar={onCancelar} editando={!!editar} />
    </form>
  );
}

function FormCorporativo({
  negocioId, registradoPor, celularExiste, onGuardar, onCancelar, editar,
}: {
  negocioId: NegocioId; registradoPor: string; celularExiste: (celular: string) => boolean;
  onGuardar: (c: ClienteCorporativo) => void; onCancelar: () => void;
  editar?: ClienteCorporativo;
}) {
  const [razonSocial, setRazonSocial] = useState(editar?.razonSocial ?? "");
  const [ruc, setRuc] = useState(editar?.ruc ?? "");
  const [direccion, setDireccion] = useState(editar?.direccion ?? "");
  const [fechaAniversario, setFechaAniversario] = useState(editar?.fechaAniversario ?? "");
  const [nombreRepresentante, setNombreRepresentante] = useState(editar?.nombreRepresentante ?? "");
  const [cargoRepresentante, setCargoRepresentante] = useState(editar?.cargoRepresentante ?? "Gerente General");
  // Un solo celular, el del representante — en la práctica Ventas siempre
  // termina hablando con una persona puntual, nunca con "el teléfono de la
  // empresa" en abstracto, así que pedir los dos era redundante. Este es el
  // único número del cliente corporativo, y por eso es obligatorio.
  const [celular, setCelular] = useState(editar?.celular ?? "");
  const ubicacion = useUbicacion(editar);
  const [aceptaComunicaciones, setAceptaComunicaciones] = useState(editar?.aceptaComunicaciones ?? true);
  const [errores, setErrores] = useState<Errores>({});

  function validar(): Errores {
    const err: Errores = {};
    const eRazon = requerido(razonSocial, "La razón social");
    if (eRazon) err.razonSocial = eRazon;
    const eRuc = rucPeru(ruc);
    if (eRuc) err.ruc = eRuc;
    const eDireccion = requerido(direccion, "La dirección");
    if (eDireccion) err.direccion = eDireccion;
    const eRepresentante = nombrePersona(nombreRepresentante, "El nombre del representante");
    if (eRepresentante) err.nombreRepresentante = eRepresentante;
    const eCelular = celularPeru(celular);
    if (eCelular) err.celular = eCelular;
    else if (celular !== editar?.celular && celularExiste(celular)) err.celular = "Ese celular ya pertenece a un cliente registrado en el grupo.";
    Object.assign(err, validarUbicacion(ubicacion.departamento, ubicacion.provincia, ubicacion.distrito));
    return err;
  }

  function guardar(e: React.FormEvent) {
    e.preventDefault();
    const err = validar();
    setErrores(err);
    if (Object.keys(err).length > 0) return;
    onGuardar({
      ...(editar ?? {
        id: `${negocioId}-corp-manual-${Date.now()}`,
        negocioId,
        numero: 0,
        fechaRegistro: new Date().toISOString().slice(0, 10),
        registradoPor,
      }),
      negocioId,
      razonSocial: razonSocial.trim(),
      ruc,
      direccion: direccion.trim(),
      celular,
      fechaAniversario: fechaAniversario || "",
      nombreRepresentante: nombreRepresentante.trim(),
      cargoRepresentante,
      departamento: ubicacion.departamento,
      provincia: ubicacion.provincia,
      distrito: ubicacion.distrito,
      aceptaComunicaciones,
    });
  }

  return (
    <form onSubmit={guardar} noValidate className="grid sm:grid-cols-2 gap-3">
      <Campo label="Razón social" requerido error={errores.razonSocial}>
        <input value={razonSocial} onChange={(e) => setRazonSocial(e.target.value)} className="input" />
      </Campo>
      <Campo label="RUC" requerido error={errores.ruc}>
        <input value={ruc} onChange={(e) => setRuc(limitarDigitos(e.target.value, 11))} maxLength={11} inputMode="numeric" className="input" />
      </Campo>

      <Campo label="Dirección" requerido error={errores.direccion}>
        <input value={direccion} onChange={(e) => setDireccion(e.target.value)} className="input" />
      </Campo>
      <Campo label="Nombre del representante" requerido error={errores.nombreRepresentante}>
        <input value={nombreRepresentante} onChange={(e) => setNombreRepresentante(soloLetras(e.target.value))} className="input" />
      </Campo>

      <Campo label="Cargo del representante">
        <select value={cargoRepresentante} onChange={(e) => setCargoRepresentante(e.target.value)} className="input bg-white">
          <option>Gerente General</option>
          <option>Administrador</option>
          <option>Jefe de Recursos Humanos</option>
          <option>Asistente de Gerencia</option>
        </select>
      </Campo>
      <Campo label="Celular del representante (WhatsApp)" requerido error={errores.celular}>
        <input value={celular} onChange={(e) => setCelular(limitarDigitos(e.target.value, 9))} maxLength={9} inputMode="numeric" placeholder="9XXXXXXXX" className="input" />
      </Campo>

      <Campo label="Fecha de aniversario (opcional)">
        <input type="date" value={fechaAniversario} onChange={(e) => setFechaAniversario(e.target.value)} className="input" />
      </Campo>

      <CamposUbicacion {...ubicacion} errores={errores} />

      <label className="sm:col-span-2 flex items-center gap-2 text-xs text-[var(--color-gris-medio)] mt-1">
        <input type="checkbox" checked={aceptaComunicaciones} onChange={(e) => setAceptaComunicaciones(e.target.checked)} className="rounded" />
        Acepta recibir promociones y saludos por aniversario por WhatsApp
      </label>

      <BotonesForm onCancelar={onCancelar} editando={!!editar} />
    </form>
  );
}

function BotonesForm({ onCancelar, editando }: { onCancelar: () => void; editando?: boolean }) {
  return (
    <div className="sm:col-span-2 flex justify-end gap-2 pt-1">
      <button type="button" onClick={onCancelar} className="text-sm font-medium text-[var(--color-gris-medio)] px-4 py-2">
        Cancelar
      </button>
      <button type="submit" className="bg-[var(--color-terracota)] text-white text-sm font-semibold rounded-xl px-5 py-2.5 hover:opacity-90 transition-opacity">
        {editando ? "Guardar cambios" : "Guardar cliente"}
      </button>
    </div>
  );
}

function Campo({
  label, children, requerido, error,
}: {
  label: string; children: React.ReactNode; requerido?: boolean; error?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-[var(--color-gris-medio)] mb-1">
        {label} {requerido && <span className="text-[var(--color-rojo)]">*</span>}
      </label>
      {children}
      {error && <p className="text-[11px] text-[var(--color-rojo)] mt-1 font-medium">{error}</p>}
    </div>
  );
}

// Sentinela para "el valor no está en la lista" — nunca se guarda tal cual,
// solo decide si el <select> muestra el <input> de texto libre debajo.
const OTRO = "__otro__";

// Select con salida a mano: si lo que hace falta no está en la lista corta
// de opciones, "Otro" revela un campo de texto libre — así ningún selector
// de este formulario deja a alguien sin poder registrar el dato real.
function SelectConOtro({
  label, opciones, value, onChange, requerido, error,
}: {
  label: string; opciones: readonly string[]; value: string; onChange: (v: string) => void;
  requerido?: boolean; error?: string;
}) {
  const esManual = value !== "" && !opciones.includes(value);
  const [seleccion, setSeleccion] = useState(esManual ? OTRO : value);

  return (
    <Campo label={label} requerido={requerido} error={error}>
      <select
        value={seleccion}
        onChange={(e) => {
          const v = e.target.value;
          setSeleccion(v);
          onChange(v === OTRO ? "" : v);
        }}
        className="input bg-white"
      >
        {opciones.map((o) => <option key={o} value={o}>{o}</option>)}
        <option value={OTRO}>Otro (escribir)</option>
      </select>
      {seleccion === OTRO && (
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Escríbelo"
          className="input mt-1.5"
          autoFocus
        />
      )}
    </Campo>
  );
}
