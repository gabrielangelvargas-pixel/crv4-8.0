"use client";

import Link from "next/link";
import { useActionState } from "react";
import { AreaTexto, BotonPrincipal, Campo, Casilla, MensajeError } from "@/components/form";
import type { Proveedor } from "@/lib/gestion/proveedores";
import type { EstadoFormulario } from "./actions";

type Props = {
  accion: (prev: EstadoFormulario, form: FormData) => Promise<EstadoFormulario>;
  inicial?: Proveedor;
  soloLectura?: boolean;
};

export function ProveedorForm({ accion, inicial, soloLectura = false }: Props) {
  const [estado, enviar, enviando] = useActionState(accion, undefined);

  return (
    <form action={enviar} className="flex flex-col gap-5 rounded-xl border border-borde bg-superficie p-4 sm:max-w-2xl sm:p-6">
      <fieldset disabled={soloLectura} className="flex flex-col gap-4">
        <Campo etiqueta="Razón social" name="nombre" required defaultValue={inicial?.nombre} />
        <Campo etiqueta="Nombre de fantasía" name="nombreFantasia" defaultValue={inicial?.nombreFantasia ?? ""} />
        <Campo etiqueta="Persona de contacto" name="contacto" defaultValue={inicial?.contacto ?? ""} />
        <Campo etiqueta="Teléfono" name="telefono" type="tel" defaultValue={inicial?.telefono ?? ""} />
        <Campo etiqueta="Email" name="email" type="email" defaultValue={inicial?.email ?? ""} />
        <Campo etiqueta="Dirección" name="direccion" defaultValue={inicial?.direccion ?? ""} />
        <AreaTexto etiqueta="Notas" name="notas" defaultValue={inicial?.notas ?? ""} />
        <Casilla etiqueta="Activo" name="activo" defaultChecked={inicial?.activo ?? true} />
      </fieldset>
      <MensajeError>{estado?.error}</MensajeError>
      <div className="flex items-center gap-4">
        {!soloLectura && <BotonPrincipal disabled={enviando}>{enviando ? "Guardando…" : "Guardar"}</BotonPrincipal>}
        <Link href="/admin/proveedores" className="text-sm text-texto-suave hover:text-marca">
          Volver
        </Link>
      </div>
    </form>
  );
}
