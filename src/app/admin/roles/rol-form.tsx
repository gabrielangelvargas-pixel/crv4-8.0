"use client";

import Link from "next/link";
import { useActionState } from "react";
import {
  ACCIONES,
  MODULOS,
  NOMBRE_MODULO,
  type Permiso,
} from "@/lib/auth/permisos-catalogo";
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
    <form action={enviar} className="flex max-w-2xl flex-col gap-5">
      <fieldset disabled={soloLectura} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm">
          Nombre
          <input
            name="nombre"
            required
            defaultValue={inicial?.nombre}
            disabled={inicial?.esSistema}
            className="rounded-md border border-neutral-300 px-3 py-2 text-base disabled:bg-neutral-100"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Descripción
          <input
            name="descripcion"
            defaultValue={inicial?.descripcion ?? ""}
            className="rounded-md border border-neutral-300 px-3 py-2 text-base"
          />
        </label>
        {!inicial?.esSistema && (
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="activo" defaultChecked={inicial?.activo ?? true} />
            Activo
          </label>
        )}

        <div className="flex flex-col gap-2">
          <h2 className="font-medium">Permisos</h2>
          {inicial?.accesoTotal ? (
            <p className="text-sm text-neutral-600">Este rol tiene acceso total al sistema.</p>
          ) : inicial?.accesoGestion === false ? (
            <p className="text-sm text-neutral-600">
              Este rol es para compradores de la web y no entra a la gestión.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-200 text-left">
                    <th className="py-2 pr-4 font-medium">Módulo</th>
                    {ACCIONES.map((a) => (
                      <th key={a} className="px-2 py-2 text-center font-medium">
                        {NOMBRE_ACCION[a]}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {MODULOS.map((m) => (
                    <tr key={m} className="border-b border-neutral-100">
                      <td className="py-2 pr-4">{NOMBRE_MODULO[m]}</td>
                      {ACCIONES.map((a) => {
                        const valor = `${m}:${a}` as Permiso;
                        return (
                          <td key={a} className="px-2 py-2 text-center">
                            <input
                              type="checkbox"
                              name="permisos"
                              value={valor}
                              aria-label={`${NOMBRE_ACCION[a]} ${NOMBRE_MODULO[m]}`}
                              defaultChecked={inicial?.permisos.includes(valor)}
                              disabled={permisosFijos}
                            />
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

      {estado?.error && (
        <p role="alert" className="text-sm text-red-600">
          {estado.error}
        </p>
      )}
      <div className="flex items-center gap-4">
        {!soloLectura && (
          <button
            disabled={enviando}
            className="rounded-md bg-neutral-900 px-4 py-2 font-medium text-white disabled:opacity-60"
          >
            {enviando ? "Guardando…" : "Guardar"}
          </button>
        )}
        <Link href="/admin/roles" className="text-sm underline underline-offset-4">
          Volver
        </Link>
      </div>
    </form>
  );
}
