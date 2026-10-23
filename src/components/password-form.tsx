"use client";

import { useActionState } from "react";
import { BotonPrincipal, Campo, MensajeError } from "@/components/form";
import { Aviso } from "@/components/ui";

type Estado = { error?: string; ok?: string } | undefined;

// Cambio de contraseña: la propia (pide la actual) o la de otro usuario.
export function PasswordForm({
  accion,
  pedirActual = false,
  titulo,
}: {
  accion: (prev: Estado, form: FormData) => Promise<Estado>;
  pedirActual?: boolean;
  titulo: string;
}) {
  const [estado, enviar, enviando] = useActionState(accion, undefined);

  return (
    <form action={enviar} className="flex flex-col gap-4 rounded-xl border border-borde bg-superficie p-4 sm:max-w-2xl sm:p-6">
      <h2 className="font-semibold">{titulo}</h2>
      {pedirActual && (
        <Campo etiqueta="Contraseña actual" name="actual" type="password" required autoComplete="current-password" />
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <Campo etiqueta="Nueva contraseña" name="password" type="password" required autoComplete="new-password" minLength={8} />
        <Campo
          etiqueta="Repetir nueva contraseña"
          name="confirmacion"
          type="password"
          required
          autoComplete="new-password"
          minLength={8}
        />
      </div>
      <MensajeError>{estado?.error}</MensajeError>
      {estado?.ok && <Aviso>{estado.ok}</Aviso>}
      <BotonPrincipal variante="secundario" disabled={enviando} className="self-start">
        {enviando ? "Guardando…" : "Cambiar contraseña"}
      </BotonPrincipal>
    </form>
  );
}
