"use client";

import Link from "next/link";
import { startTransition, useActionState, type FormEvent } from "react";
import { BotonPrincipal, Campo, Casilla, MensajeError, Selector } from "@/components/form";
import type { EstadoFormulario } from "./actions";

type Props = {
  accion: (prev: EstadoFormulario, form: FormData) => Promise<EstadoFormulario>;
  roles: { id: number; nombre: string }[];
  inicial?: { nombre: string; nombreUsuario: string; rolId: number; activo: boolean };
  // El propio usuario no cambia su rol ni se desactiva.
  esPropio?: boolean;
  conPassword?: boolean;
  soloLectura?: boolean;
};

export function UsuarioForm({ accion, roles, inicial, esPropio = false, conPassword = false, soloLectura = false }: Props) {
  const [estado, enviar, enviando] = useActionState(accion, undefined);

  // Se envía a mano para que React no vacíe el formulario si el servidor devuelve un error.
  function alEnviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const datos = new FormData(evento.currentTarget);
    startTransition(() => enviar(datos));
  }

  return (
    <form onSubmit={alEnviar} className="flex flex-col gap-5 rounded-xl border border-borde bg-superficie p-4 sm:max-w-2xl sm:p-6">
      <fieldset disabled={soloLectura} className="flex flex-col gap-4">
        <Campo etiqueta="Nombre visible" name="nombre" required defaultValue={inicial?.nombre} />
        <Campo
          etiqueta="Nombre de usuario"
          name="nombreUsuario"
          required
          autoCapitalize="none"
          autoComplete="off"
          defaultValue={inicial?.nombreUsuario}
          ayuda="Con el que entra al sistema. Letras, números, punto o guion, sin espacios."
        />
        <Selector etiqueta="Rol" name="rolId" required defaultValue={inicial?.rolId ?? ""} disabled={esPropio}>
          <option value="" disabled>
            Elegir…
          </option>
          {roles.map((r) => (
            <option key={r.id} value={r.id}>
              {r.nombre}
            </option>
          ))}
        </Selector>
        {conPassword && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Campo etiqueta="Contraseña" name="password" type="password" required autoComplete="new-password" minLength={8} />
            <Campo
              etiqueta="Repetir contraseña"
              name="confirmacion"
              type="password"
              required
              autoComplete="new-password"
              minLength={8}
            />
          </div>
        )}
        {esPropio ? (
          <p className="text-sm text-texto-suave">Es tu usuario: no puedes cambiar tu rol ni desactivarte.</p>
        ) : (
          <Casilla etiqueta="Activo (puede entrar al sistema)" name="activo" defaultChecked={inicial?.activo ?? true} />
        )}
      </fieldset>
      <MensajeError>{estado?.error}</MensajeError>
      <div className="flex items-center gap-4">
        {!soloLectura && <BotonPrincipal disabled={enviando}>{enviando ? "Guardando…" : "Guardar"}</BotonPrincipal>}
        <Link href="/admin/usuarios" className="text-sm text-texto-suave hover:text-marca">
          Volver
        </Link>
      </div>
    </form>
  );
}
