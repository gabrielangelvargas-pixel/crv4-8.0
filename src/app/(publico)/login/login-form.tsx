"use client";

import { useActionState } from "react";
import { BotonPrincipal, Campo, MensajeError } from "@/components/form";
import { iniciarSesion } from "./actions";

export function LoginForm({ next }: { next?: string }) {
  const [estado, accion, enviando] = useActionState(iniciarSesion, undefined);

  return (
    <form action={accion} className="flex flex-col gap-4">
      {next && <input type="hidden" name="next" value={next} />}
      <Campo
        etiqueta="Usuario"
        name="nombreUsuario"
        defaultValue={estado?.nombreUsuario}
        autoComplete="username"
        autoCapitalize="none"
        required
      />
      <Campo etiqueta="Contraseña" name="password" type="password" autoComplete="current-password" required />
      <MensajeError>{estado?.error}</MensajeError>
      <BotonPrincipal disabled={enviando} className="w-full">
        {enviando ? "Ingresando…" : "Ingresar"}
      </BotonPrincipal>
    </form>
  );
}
