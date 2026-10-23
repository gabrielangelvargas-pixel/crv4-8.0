"use client";

import { startTransition, useActionState, useState, type FormEvent } from "react";
import { BotonPrincipal, Campo, MensajeError } from "@/components/form";
import type { EstadoFormulario } from "./actions";
import type { TipoCarga } from "./datos";

type Props = {
  accion: (prev: EstadoFormulario, form: FormData) => Promise<EstadoFormulario>;
  stockActual: string;
};

export function CargaForm({ accion, stockActual }: Props) {
  const [estado, enviar, enviando] = useActionState(accion, undefined);
  const [tipo, setTipo] = useState<TipoCarga>("ingreso");

  // Se envía a mano para que React no vacíe el formulario si el servidor devuelve un error.
  function alEnviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const datos = new FormData(evento.currentTarget);
    startTransition(() => enviar(datos));
  }

  return (
    <form onSubmit={alEnviar} className="flex flex-col gap-4 rounded-xl border border-borde bg-superficie p-4 sm:p-6">
      <div role="radiogroup" aria-label="Tipo de carga" className="grid grid-cols-2 gap-2">
        {(["ingreso", "ajuste"] as const).map((t) => (
          <label
            key={t}
            className={`flex min-h-11 cursor-pointer items-center justify-center rounded-lg border px-3 text-sm font-medium ${
              tipo === t ? "border-marca bg-marca-suave text-marca-oscuro" : "border-borde"
            }`}
          >
            <input
              type="radio"
              name="tipo"
              value={t}
              checked={tipo === t}
              onChange={() => setTipo(t)}
              className="sr-only"
            />
            {t === "ingreso" ? "Ingreso" : "Ajuste por conteo"}
          </label>
        ))}
      </div>
      <Campo
        key={tipo}
        etiqueta={tipo === "ingreso" ? "Cantidad que ingresa" : "Stock contado"}
        name="cantidad"
        inputMode="decimal"
        required
        autoComplete="off"
        ayuda={
          tipo === "ingreso"
            ? `Se suma al stock actual (${stockActual}).`
            : `Reemplaza el stock actual (${stockActual}) y queda registrada la diferencia.`
        }
      />
      <Campo
        etiqueta={tipo === "ingreso" ? "Motivo (opcional)" : "Motivo"}
        name="motivo"
        required={tipo === "ajuste"}
        maxLength={255}
        placeholder={tipo === "ingreso" ? "Ej.: compra a Distribuidora Norte" : "Ej.: rotura, inventario mensual"}
      />
      <MensajeError>{estado?.error}</MensajeError>
      <BotonPrincipal disabled={enviando} className="self-start">
        {enviando ? "Guardando…" : tipo === "ingreso" ? "Registrar ingreso" : "Registrar ajuste"}
      </BotonPrincipal>
    </form>
  );
}
