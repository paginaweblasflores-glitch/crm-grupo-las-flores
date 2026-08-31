"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

// Input de contraseña con un ícono de ojo para revelarla temporalmente —
// se usa tanto para escribir una contraseña nueva (Usuarios, Mi Perfil)
// como para ver la actual de un vistazo, sin tener que adivinarla.
export function CampoContrasena({
  value, onChange, placeholder, disabled, className,
}: {
  value: string;
  onChange?: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <input
        type={visible ? "text" : "password"}
        value={value}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        readOnly={!onChange}
        disabled={disabled}
        placeholder={placeholder}
        className={`input pr-9 ${disabled ? "bg-[var(--color-crema)] text-[var(--color-gris-medio)]" : ""} ${className ?? ""}`}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        tabIndex={-1}
        title={visible ? "Ocultar" : "Ver contraseña"}
        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--color-gris-medio)] hover:text-[var(--color-gris)] transition-colors"
      >
        {visible ? <EyeOff size={15} /> : <Eye size={15} />}
      </button>
    </div>
  );
}
