"use client";

import { useActionState } from "react";
import { BotonPrincipal, Campo, MensajeError } from "@/components/form";
import { importeParaCampo } from "@/lib/numeros";
import type { EstadoFormulario } from "../actions";

export function DatosPedidoForm({
  accion,
  notasInternas,
  adicional,
  adicionalDetalle,
  adicionalEditable,
}: {
  accion: (prev: EstadoFormulario, form: FormData) => Promise<EstadoFormulario>;
  notasInternas: string | null;
  adicional: string;
  adicionalDetalle: string | null;
  adicionalEditable: boolean;
}) {
  const [estado, enviar, enviando] = useActionState(accion, undefined);

  return (
    <form action={enviar} className="flex flex-col gap-4 rounded-xl border border-borde bg-superficie p-4 sm:p-5">
      <h2 className="font-semibold">Datos internos</h2>
      {adicionalEditable && (
        <div className="grid grid-cols-[1fr_8rem] gap-2">
          <Campo etiqueta="Adicional (detalle)" name="adicionalDetalle" defaultValue={adicionalDetalle ?? ""} placeholder="Ej.: Envío" />
          <Campo etiqueta="Importe" name="adicional" inputMode="decimal" defaultValue={importeParaCampo(adicional)} />
        </div>
      )}
      <label className="flex flex-col gap-1.5 text-sm font-medium">
        Notas internas
        <textarea
          name="notasInternas"
          rows={3}
          defaultValue={notasInternas ?? ""}
          className="min-h-11 w-full rounded-lg border border-borde bg-superficie px-3 py-2 text-base"
        />
      </label>
      <MensajeError>{estado?.error}</MensajeError>
      <BotonPrincipal variante="secundario" disabled={enviando} className="self-start">
        {enviando ? "Guardando…" : "Guardar"}
      </BotonPrincipal>
    </form>
  );
}
