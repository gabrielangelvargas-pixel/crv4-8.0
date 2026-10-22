"use client";

import { useActionState } from "react";
import { iniciarSesion } from "./actions";

export function LoginForm({ next }: { next?: string }) {
  const [estado, accion, enviando] = useActionState(iniciarSesion, undefined);

  return (
    <form action={accion} className="flex flex-col gap-4">
      {next && <input type="hidden" name="next" value={next} />}
      <label className="flex flex-col gap-1 text-sm">
        Usuario
        <input
          name="nombreUsuario"
          defaultValue={estado?.nombreUsuario}
          autoComplete="username"
          required
          className="rounded-md border border-neutral-300 px-3 py-2 text-base"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Contraseña
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="rounded-md border border-neutral-300 px-3 py-2 text-base"
        />
      </label>
      {estado?.error && (
        <p role="alert" className="text-sm text-red-600">
          {estado.error}
        </p>
      )}
      <button
        disabled={enviando}
        className="rounded-md bg-neutral-900 px-4 py-2 font-medium text-white disabled:opacity-60"
      >
        {enviando ? "Ingresando…" : "Ingresar"}
      </button>
    </form>
  );
}
