"use client";

import { startTransition, useActionState, useState, type FormEvent } from "react";
import { BotonPrincipal, MensajeError } from "@/components/form";
import { IconoBloque } from "@/components/iconos-bloques";
import { ICONOS_BLOQUE, NOMBRE_ICONO, type ClaveIcono } from "@/lib/iconos-bloque";
import { MAXIMO_BLOQUES, type BloqueFormulario } from "./bloques-datos";
import type { EstadoBloques } from "./actions";

type Props = {
  accion: (prev: EstadoBloques, form: FormData) => Promise<EstadoBloques>;
  inicial: BloqueFormulario[];
  soloLectura?: boolean;
};

const claseCampo = "min-h-11 w-full rounded-lg border border-borde bg-superficie px-3 py-2 text-base focus:border-marca disabled:bg-fondo";
const claseMini = "inline-flex min-h-9 items-center rounded-lg border border-borde px-3 text-sm hover:bg-fondo disabled:opacity-40";

export function BloquesForm({ accion, inicial, soloLectura = false }: Props) {
  const [estado, enviar, enviando] = useActionState(accion, undefined);
  const [filas, setFilas] = useState(inicial);
  const [cambiado, setCambiado] = useState(false);

  const cambiar = (i: number, cambios: Partial<BloqueFormulario>) => {
    setFilas((f) => f.map((b, j) => (j === i ? { ...b, ...cambios } : b)));
    setCambiado(true);
  };
  const mover = (i: number, paso: number) => {
    setFilas((f) => {
      const copia = [...f];
      [copia[i], copia[i + paso]] = [copia[i + paso], copia[i]];
      return copia;
    });
    setCambiado(true);
  };

  function alEnviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const datos = new FormData();
    datos.set("bloques", JSON.stringify(filas));
    setCambiado(false);
    startTransition(() => enviar(datos));
  }

  return (
    <form onSubmit={alEnviar} className="flex flex-col gap-4 rounded-xl border border-borde bg-superficie p-4 sm:p-6 lg:max-w-4xl">
      <div>
        <h2 className="font-semibold">Bloques de información</h2>
        <p className="text-sm text-texto-suave">Se muestran debajo del slider, en este orden. Destilda “Visible” para ocultar uno sin borrarlo.</p>
      </div>
      <fieldset disabled={soloLectura} className="flex flex-col gap-3">
        {filas.map((b, i) => (
          <div key={i} className="flex flex-col gap-3 rounded-lg border border-borde p-3 sm:flex-row sm:items-start">
            <div className="flex items-center gap-3 sm:w-56 sm:shrink-0">
              <span className={`flex size-11 shrink-0 items-center justify-center rounded-lg bg-fondo ${b.activo ? "text-texto" : "text-texto-suave"}`}>
                <IconoBloque icono={b.icono} className="size-7" />
              </span>
              <label className="flex-1">
                <span className="sr-only">Ícono</span>
                <select value={b.icono} onChange={(e) => cambiar(i, { icono: e.currentTarget.value as ClaveIcono })} className={claseCampo}>
                  {ICONOS_BLOQUE.map((clave) => (
                    <option key={clave} value={clave}>
                      {NOMBRE_ICONO[clave]}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="flex flex-1 flex-col gap-2">
              <input aria-label="Título" placeholder="Título" maxLength={60} value={b.titulo} onChange={(e) => cambiar(i, { titulo: e.currentTarget.value })} className={claseCampo} />
              <input aria-label="Texto" placeholder="Texto (opcional)" maxLength={160} value={b.texto} onChange={(e) => cambiar(i, { texto: e.currentTarget.value })} className={claseCampo} />
              <div className="flex flex-wrap items-center gap-2">
                <label className="mr-auto flex min-h-9 items-center gap-2 text-sm">
                  <input type="checkbox" className="size-5 accent-marca" checked={b.activo} onChange={(e) => cambiar(i, { activo: e.currentTarget.checked })} />
                  Visible
                </label>
                <button type="button" aria-label="Subir" onClick={() => mover(i, -1)} disabled={i === 0} className={claseMini}>↑</button>
                <button type="button" aria-label="Bajar" onClick={() => mover(i, 1)} disabled={i === filas.length - 1} className={claseMini}>↓</button>
                <button
                  type="button"
                  onClick={() => {
                    setFilas((f) => f.filter((_, j) => j !== i));
                    setCambiado(true);
                  }}
                  className={`${claseMini} text-peligro`}
                >
                  Quitar
                </button>
              </div>
            </div>
          </div>
        ))}
        {filas.length < MAXIMO_BLOQUES && (
          <button
            type="button"
            onClick={() => {
              setFilas((f) => [...f, { icono: "estrella", titulo: "", texto: "", activo: true }]);
              setCambiado(true);
            }}
            className={`${claseMini} self-start`}
          >
            + Agregar bloque
          </button>
        )}
      </fieldset>
      <MensajeError>{estado?.error}</MensajeError>
      {estado?.ok && !cambiado && <p role="status" className="text-sm text-green-700">Bloques guardados.</p>}
      {!soloLectura && (
        <BotonPrincipal disabled={enviando} className="self-start">
          {enviando ? "Guardando…" : "Guardar bloques"}
        </BotonPrincipal>
      )}
    </form>
  );
}
