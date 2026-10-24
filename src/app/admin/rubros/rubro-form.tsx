"use client";

import Link from "next/link";
import { startTransition, useActionState, useState, type FormEvent } from "react";
import { AreaTexto, BotonPrincipal, Campo, Casilla, MensajeError, Selector } from "@/components/form";
import type { EstadoFormulario } from "./actions";

type RubroInicial = {
  nombre: string;
  slug: string;
  descripcion: string | null;
  rubroPadreId: number | null;
  orden: number;
  visibleWeb: boolean;
  activo: boolean;
  // Dirección para mostrar la foto actual.
  imagen: string | null;
};

type Props = {
  accion: (prev: EstadoFormulario, form: FormData) => Promise<EstadoFormulario>;
  principales: { id: number; nombre: string }[];
  inicial?: Partial<RubroInicial>;
  soloLectura?: boolean;
};

export function RubroForm({ accion, principales, inicial, soloLectura = false }: Props) {
  const [estado, enviar, enviando] = useActionState(accion, undefined);
  const [vista, setVista] = useState<string | null>(null);
  const [quitar, setQuitar] = useState(false);
  const actual = inicial?.imagen ?? null;
  const mostrada = vista ?? (quitar ? null : actual);

  // Se envía a mano para que React no vacíe el formulario (y la foto elegida) si hay un error.
  function alEnviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const datos = new FormData(evento.currentTarget);
    startTransition(() => enviar(datos));
  }

  return (
    <form onSubmit={alEnviar} className="flex flex-col gap-5 rounded-xl border border-borde bg-superficie p-4 sm:max-w-2xl sm:p-6">
      <fieldset disabled={soloLectura} className="flex flex-col gap-4">
        <Campo etiqueta="Nombre" name="nombre" required defaultValue={inicial?.nombre} />
        <Selector etiqueta="Ubicación" name="rubroPadreId" defaultValue={inicial?.rubroPadreId ?? ""}>
          <option value="">Rubro principal</option>
          {principales.map((r) => (
            <option key={r.id} value={r.id}>
              Subrubro de {r.nombre}
            </option>
          ))}
        </Selector>
        <AreaTexto etiqueta="Descripción" name="descripcion" defaultValue={inicial?.descripcion ?? ""} />
        <Campo
          etiqueta="Dirección web"
          name="slug"
          defaultValue={inicial?.slug}
          ayuda="Se usa en el enlace del catálogo. Si la dejas vacía se arma con el nombre."
        />
        <Campo
          etiqueta="Orden"
          name="orden"
          type="number"
          min={0}
          defaultValue={inicial?.orden ?? 0}
          ayuda="Los números más bajos aparecen primero."
        />
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
          <div className="flex size-32 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-borde bg-fondo">
            {mostrada ? (
              // eslint-disable-next-line @next/next/no-img-element -- vista previa local o imagen ya optimizada
              <img src={mostrada} alt="" className="size-full object-cover" />
            ) : (
              <span className="text-sm text-texto-suave">Sin imagen</span>
            )}
          </div>
          <div className="flex flex-col gap-2 text-sm">
            <span className="font-medium">Imagen (opcional)</span>
            <span className="text-texto-suave">Se muestra en el inicio de la web. Se recorta cuadrada desde el centro (600 × 600 píxeles).</span>
            <input
              type="file"
              name="imagen"
              accept="image/*"
              onChange={(e) => {
                const elegido = e.currentTarget.files?.[0];
                setVista(elegido ? URL.createObjectURL(elegido) : null);
              }}
              className="text-sm file:mr-3 file:min-h-11 file:rounded-lg file:border file:border-borde file:bg-superficie file:px-4 file:text-sm file:font-medium"
            />
            {actual && !vista && (
              <Casilla etiqueta="Quitar la imagen" name="quitarImagen" checked={quitar} onChange={(e) => setQuitar(e.currentTarget.checked)} />
            )}
          </div>
        </div>
        <Casilla etiqueta="Visible en el catálogo web" name="visibleWeb" defaultChecked={inicial?.visibleWeb ?? true} />
        <Casilla etiqueta="Activo" name="activo" defaultChecked={inicial?.activo ?? true} />
      </fieldset>
      <MensajeError>{estado?.error}</MensajeError>
      <div className="flex items-center gap-4">
        {!soloLectura && <BotonPrincipal disabled={enviando}>{enviando ? "Guardando…" : "Guardar"}</BotonPrincipal>}
        <Link href="/admin/rubros" className="text-sm text-texto-suave hover:text-marca">
          Volver
        </Link>
      </div>
    </form>
  );
}
