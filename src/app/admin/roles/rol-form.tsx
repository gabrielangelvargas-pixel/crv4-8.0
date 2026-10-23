"use client";

import Link from "next/link";
import { useActionState } from "react";
import { BotonPrincipal, Campo, Casilla, MensajeError } from "@/components/form";
import { ACCIONES, MODULOS, NOMBRE_MODULO, type Permiso } from "@/lib/auth/permisos-catalogo";
import type { EstadoRol } from "./actions";

type Props = {
  accion: (prev: EstadoRol, form: FormData) => Promise<EstadoRol>;
  inicial?: {
    nombre: string;
    descripcion: string | null;
    activo: boolean;
    permisos: Permiso[];
    esSistema: boolean;
    accesoTotal: boolean;
    accesoGestion: boolean;
  };
  soloLectura?: boolean;
};

const NOMBRE_ACCION = { ver: "Ver", crear: "Crear", editar: "Editar", eliminar: "Eliminar" };

export function RolForm({ accion, inicial, soloLectura = false }: Props) {
  const [estado, enviar, enviando] = useActionState(accion, undefined);
  const permisosFijos = inicial?.accesoTotal || inicial?.accesoGestion === false;

  return (
    <form
      action={enviar}
      className="flex flex-col gap-5 rounded-xl border border-borde bg-superficie p-4 sm:max-w-3xl sm:p-6"
    >
      <fieldset disabled={soloLectura} className="flex flex-col gap-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo etiqueta="Nombre" name="nombre" required defaultValue={inicial?.nombre} disabled={inicial?.esSistema} />
          <Campo etiqueta="Descripción" name="descripcion" defaultValue={inicial?.descripcion ?? ""} />
        </div>
        {!inicial?.esSistema && <Casilla etiqueta="Activo" name="activo" defaultChecked={inicial?.activo ?? true} />}

        <div className="flex flex-col gap-2">
          <h2 className="font-semibold">Permisos</h2>
          {inicial?.accesoTotal ? (
            <p className="text-sm text-texto-suave">Este rol tiene acceso total al sistema.</p>
          ) : inicial?.accesoGestion === false ? (
            <p className="text-sm text-texto-suave">Este rol es para compradores de la web y no entra a la gestión.</p>
          ) : (
            <div className="-mx-4 overflow-x-auto sm:mx-0">
              <table className="w-full min-w-[22rem] text-sm">
                <thead className="text-texto-suave">
                  <tr className="border-b border-borde text-left">
                    <th className="px-4 py-2 font-medium sm:pl-0">Módulo</th>
                    {ACCIONES.map((a) => (
                      <th key={a} className="px-1 py-2 text-center font-medium">
                        {NOMBRE_ACCION[a]}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {MODULOS.map((m) => (
                    <tr key={m} className="border-b border-borde last:border-0">
                      <td className="px-4 py-1 sm:pl-0">{NOMBRE_MODULO[m]}</td>
                      {ACCIONES.map((a) => {
                        const valor = `${m}:${a}` as Permiso;
                        return (
                          <td key={a} className="px-1 py-1 text-center">
                            <label className="inline-flex size-11 cursor-pointer items-center justify-center">
                              <input
                                type="checkbox"
                                name="permisos"
                                value={valor}
                                aria-label={`${NOMBRE_ACCION[a]} ${NOMBRE_MODULO[m]}`}
                                defaultChecked={inicial?.permisos.includes(valor)}
                                disabled={permisosFijos}
                                className="size-5 accent-marca"
                              />
                            </label>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </fieldset>

      <MensajeError>{estado?.error}</MensajeError>
      <div className="flex items-center gap-4">
        {!soloLectura && <BotonPrincipal disabled={enviando}>{enviando ? "Guardando…" : "Guardar"}</BotonPrincipal>}
        <Link href="/admin/roles" className="text-sm text-texto-suave hover:text-marca">
          Volver
        </Link>
      </div>
    </form>
  );
}
