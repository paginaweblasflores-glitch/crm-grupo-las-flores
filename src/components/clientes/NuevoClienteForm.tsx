"use client";

import { useState } from "react";
import { X, User, Building2 } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { DISTRITOS_AYACUCHO, ACTIVIDADES_ECONOMICAS } from "@/lib/mock/nombres";
import { getNegocio } from "@/lib/mock/negocios";
import { ClienteIndividual, ClienteCorporativo, NegocioId, TipoDocumento, Genero } from "@/lib/types";
import {
  requerido, celularPeru, emailOpcional, fechaPasada, exactoDigitos, limitarDigitos,
  rucPeru, soloLetras, nombrePersona, Errores,
} from "@/lib/validacion";

const TIPOS_DOCUMENTO: TipoDocumento[] = ["DNI", "Carné de extranjería", "Pasaporte"];
const GENEROS: Genero[] = ["Femenino", "Masculino", "Prefiere no decirlo"];

export function NuevoClienteForm({
  negocioId, registradoPor, celularExiste, onGuardarIndividual, onGuardarCorporativo, onCancelar,
}: {
  negocioId: NegocioId;
  registradoPor: string;
  // Verifica el celular contra la base de los 3 negocios del grupo — un mismo
  // número no debería registrarse dos veces como cliente distinto (SFIDA #3).
  celularExiste: (celular: string) => boolean;
  onGuardarIndividual: (c: ClienteIndividual) => void;
  onGuardarCorporativo: (c: ClienteCorporativo) => void;
  onCancelar: () => void;
}) {
  const [tipo, setTipo] = useState<"individual" | "corporativo">("individual");

  return (
    <Card className="animate-fade-in">
      <div className="flex items-center justify-between mb-1">
        <CardHeader title="Registrar cliente nuevo" subtitle="Directo en el sistema — ya no hace falta pasarlo a Excel después" />
        <button onClick={onCancelar} className="text-[var(--color-gris-medio)] hover:text-[var(--color-gris)]">
          <X size={18} />
        </button>
      </div>

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

      {tipo === "individual" ? (
        <FormIndividual negocioId={negocioId} registradoPor={registradoPor} celularExiste={celularExiste} onGuardar={onGuardarIndividual} onCancelar={onCancelar} />
      ) : (
        <FormCorporativo negocioId={negocioId} registradoPor={registradoPor} celularExiste={celularExiste} onGuardar={onGuardarCorporativo} onCancelar={onCancelar} />
      )}
    </Card>
  );
}

function FormIndividual({
  negocioId, registradoPor, celularExiste, onGuardar, onCancelar,
}: {
  negocioId: NegocioId; registradoPor: string; celularExiste: (celular: string) => boolean;
  onGuardar: (c: ClienteIndividual) => void; onCancelar: () => void;
}) {
  const [nombres, setNombres] = useState("");
  const [apellidos, setApellidos] = useState("");
  const [tipoDocumento, setTipoDocumento] = useState<TipoDocumento>("DNI");
  const [numeroDocumento, setNumeroDocumento] = useState("");
  const [celular, setCelular] = useState("");
  const [email, setEmail] = useState("");
  const [fechaNacimiento, setFechaNacimiento] = useState("");
  const [genero, setGenero] = useState<Genero | "">("");
  const [distrito, setDistrito] = useState<string>(DISTRITOS_AYACUCHO[0]);
  const [direccionExacta, setDireccionExacta] = useState("");
  const [origen, setOrigen] = useState<ClienteIndividual["origen"]>("crm");
  const nombreNegocio = getNegocio(negocioId)?.nombre ?? "este negocio";
  const [aceptaComunicaciones, setAceptaComunicaciones] = useState(true);
  const [observaciones, setObservaciones] = useState("");
  const [errores, setErrores] = useState<Errores>({});

  function validar(): Errores {
    const err: Errores = {};
    const eNombres = nombrePersona(nombres, "El nombre");
    if (eNombres) err.nombres = eNombres;
    const eApellidos = nombrePersona(apellidos, "El apellido");
    if (eApellidos) err.apellidos = eApellidos;
    const eDoc = tipoDocumento === "DNI" ? exactoDigitos(numeroDocumento, 8, "El DNI") : requerido(numeroDocumento, "El número de documento");
    if (eDoc) err.numeroDocumento = eDoc;
    const eCelular = celularPeru(celular);
    if (eCelular) err.celular = eCelular;
    else if (celularExiste(celular)) err.celular = "Ese celular ya pertenece a un cliente registrado en el grupo.";
    const eEmail = emailOpcional(email);
    if (eEmail) err.email = eEmail;
    const eFecha = fechaPasada(fechaNacimiento, "La fecha de nacimiento");
    if (eFecha) err.fechaNacimiento = eFecha;
    return err;
  }

  function guardar(e: React.FormEvent) {
    e.preventDefault();
    const err = validar();
    setErrores(err);
    if (Object.keys(err).length > 0) return;
    onGuardar({
      id: `${negocioId}-cli-manual-${Date.now()}`,
      negocioId,
      numero: 0,
      fechaRegistro: new Date().toISOString().slice(0, 10),
      nombres: nombres.trim(),
      apellidos: apellidos.trim(),
      fechaNacimiento,
      celular,
      departamento: "Ayacucho",
      provincia: "Huamanga",
      distrito,
      origen,
      observaciones: observaciones.trim() || undefined,
      registradoPor,
      tipoDocumento,
      numeroDocumento,
      email: email.trim() || undefined,
      genero: genero || undefined,
      direccionExacta: direccionExacta.trim() || undefined,
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

      <Campo label="Tipo de documento" requerido>
        <select value={tipoDocumento} onChange={(e) => setTipoDocumento(e.target.value as TipoDocumento)} className="input bg-white">
          {TIPOS_DOCUMENTO.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </Campo>
      <Campo label="Número de documento" requerido error={errores.numeroDocumento}>
        <input
          value={numeroDocumento}
          onChange={(e) => setNumeroDocumento(tipoDocumento === "DNI" ? limitarDigitos(e.target.value, 8) : e.target.value)}
          maxLength={tipoDocumento === "DNI" ? 8 : 20}
          className="input"
        />
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
      <Campo label="Género (opcional)">
        <select value={genero} onChange={(e) => setGenero(e.target.value as Genero)} className="input bg-white">
          <option value="">Prefiere no decir</option>
          {GENEROS.map((g) => <option key={g} value={g}>{g}</option>)}
        </select>
      </Campo>

      <Campo label="Distrito" requerido>
        <select value={distrito} onChange={(e) => setDistrito(e.target.value)} className="input bg-white">
          {DISTRITOS_AYACUCHO.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
      </Campo>
      <Campo label="Dirección exacta (opcional)">
        <input value={direccionExacta} onChange={(e) => setDireccionExacta(e.target.value)} className="input" />
      </Campo>

      <Campo label="¿Cómo llegó el cliente?">
        <select value={origen} onChange={(e) => setOrigen(e.target.value as ClienteIndividual["origen"])} className="input bg-white">
          <option value="crm">CRM (registro presencial)</option>
          <option value="web">{`Web — ${nombreNegocio}`}</option>
          <option value="redes-sociales">Redes sociales</option>
          <option value="referido">Referido por otro cliente</option>
        </select>
      </Campo>
      <Campo label="Observaciones (preferencias, alergias)">
        <input value={observaciones} onChange={(e) => setObservaciones(e.target.value)} className="input" />
      </Campo>

      <label className="sm:col-span-2 flex items-center gap-2 text-xs text-[var(--color-gris-medio)] mt-1">
        <input type="checkbox" checked={aceptaComunicaciones} onChange={(e) => setAceptaComunicaciones(e.target.checked)} className="rounded" />
        Acepta recibir promociones y saludos de cumpleaños por WhatsApp
      </label>

      <BotonesForm onCancelar={onCancelar} />
    </form>
  );
}

function FormCorporativo({
  negocioId, registradoPor, celularExiste, onGuardar, onCancelar,
}: {
  negocioId: NegocioId; registradoPor: string; celularExiste: (celular: string) => boolean;
  onGuardar: (c: ClienteCorporativo) => void; onCancelar: () => void;
}) {
  const [razonSocial, setRazonSocial] = useState("");
  const [ruc, setRuc] = useState("");
  const [direccion, setDireccion] = useState("");
  const [celular, setCelular] = useState("");
  const [fechaAniversario, setFechaAniversario] = useState("");
  const [nombreRepresentante, setNombreRepresentante] = useState("");
  const [cargoRepresentante, setCargoRepresentante] = useState("Gerente General");
  const [celularRepresentante, setCelularRepresentante] = useState("");
  const [actividadEconomica, setActividadEconomica] = useState<string>(ACTIVIDADES_ECONOMICAS[0]);
  const [distrito, setDistrito] = useState<string>(DISTRITOS_AYACUCHO[0]);
  const [aceptaComunicaciones, setAceptaComunicaciones] = useState(true);
  const [errores, setErrores] = useState<Errores>({});

  function validar(): Errores {
    const err: Errores = {};
    const eRazon = requerido(razonSocial, "La razón social");
    if (eRazon) err.razonSocial = eRazon;
    const eRuc = rucPeru(ruc);
    if (eRuc) err.ruc = eRuc;
    const eDireccion = requerido(direccion, "La dirección");
    if (eDireccion) err.direccion = eDireccion;
    const eCelular = celularPeru(celular);
    if (eCelular) err.celular = eCelular;
    else if (celularExiste(celular)) err.celular = "Ese celular ya pertenece a un cliente registrado en el grupo.";
    const eRepresentante = nombrePersona(nombreRepresentante, "El nombre del representante");
    if (eRepresentante) err.nombreRepresentante = eRepresentante;
    if (celularRepresentante) {
      const eCelRep = celularPeru(celularRepresentante);
      if (eCelRep) err.celularRepresentante = eCelRep;
    }
    return err;
  }

  function guardar(e: React.FormEvent) {
    e.preventDefault();
    const err = validar();
    setErrores(err);
    if (Object.keys(err).length > 0) return;
    onGuardar({
      id: `${negocioId}-corp-manual-${Date.now()}`,
      negocioId,
      numero: 0,
      fechaRegistro: new Date().toISOString().slice(0, 10),
      razonSocial: razonSocial.trim(),
      ruc,
      direccion: direccion.trim(),
      celular,
      fechaAniversario: fechaAniversario || "",
      nombreRepresentante: nombreRepresentante.trim(),
      cargoRepresentante,
      celularRepresentante,
      ciiu: "",
      actividadEconomica,
      departamento: "Ayacucho",
      provincia: "Huamanga",
      distrito,
      registradoPor,
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
      <Campo label="Celular / teléfono" requerido error={errores.celular}>
        <input value={celular} onChange={(e) => setCelular(limitarDigitos(e.target.value, 9))} maxLength={9} inputMode="numeric" placeholder="9XXXXXXXX" className="input" />
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

      <Campo label="Celular del representante (opcional)" error={errores.celularRepresentante}>
        <input value={celularRepresentante} onChange={(e) => setCelularRepresentante(limitarDigitos(e.target.value, 9))} maxLength={9} inputMode="numeric" className="input" />
      </Campo>
      <Campo label="Fecha de aniversario (opcional)">
        <input type="date" value={fechaAniversario} onChange={(e) => setFechaAniversario(e.target.value)} className="input" />
      </Campo>

      <Campo label="Actividad económica">
        <select value={actividadEconomica} onChange={(e) => setActividadEconomica(e.target.value)} className="input bg-white">
          {ACTIVIDADES_ECONOMICAS.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
      </Campo>
      <Campo label="Distrito" requerido>
        <select value={distrito} onChange={(e) => setDistrito(e.target.value)} className="input bg-white">
          {DISTRITOS_AYACUCHO.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
      </Campo>

      <label className="sm:col-span-2 flex items-center gap-2 text-xs text-[var(--color-gris-medio)] mt-1">
        <input type="checkbox" checked={aceptaComunicaciones} onChange={(e) => setAceptaComunicaciones(e.target.checked)} className="rounded" />
        Acepta recibir promociones y saludos por aniversario por WhatsApp
      </label>

      <BotonesForm onCancelar={onCancelar} />
    </form>
  );
}

function BotonesForm({ onCancelar }: { onCancelar: () => void }) {
  return (
    <div className="sm:col-span-2 flex justify-end gap-2 pt-1">
      <button type="button" onClick={onCancelar} className="text-sm font-medium text-[var(--color-gris-medio)] px-4 py-2">
        Cancelar
      </button>
      <button type="submit" className="bg-[var(--color-terracota)] text-white text-sm font-semibold rounded-xl px-5 py-2.5 hover:opacity-90 transition-opacity">
        Guardar cliente
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
