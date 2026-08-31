"use client";

import { AlertTriangle } from "lucide-react";
import { Modal } from "./Modal";

// Confirmación de una acción destructiva (eliminar, borrar) con el mismo
// diseño del resto del sistema — reemplaza el confirm() nativo del
// navegador, que se ve fuera de lugar y no se puede estilizar.
export function ModalConfirmar({
  titulo, mensaje, textoConfirmar = "Confirmar", onConfirmar, onCancelar,
}: {
  titulo: string;
  mensaje: string;
  textoConfirmar?: string;
  onConfirmar: () => void;
  onCancelar: () => void;
}) {
  return (
    <Modal titulo={titulo} onCerrar={onCancelar}>
      <div className="p-5 space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 bg-[var(--color-rojo)]/10 text-[var(--color-rojo)]">
            <AlertTriangle size={18} />
          </div>
          <p className="text-sm text-[var(--color-gris)] pt-1.5">{mensaje}</p>
        </div>
        <div className="flex justify-end gap-2">
          <button
            onClick={onCancelar}
            className="text-sm font-medium text-[var(--color-gris-medio)] px-4 py-2 rounded-lg hover:bg-[var(--color-crema)] transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirmar}
            className="text-sm font-semibold text-white px-4 py-2 rounded-lg transition-opacity hover:opacity-90 bg-[var(--color-rojo)]"
          >
            {textoConfirmar}
          </button>
        </div>
      </div>
    </Modal>
  );
}
