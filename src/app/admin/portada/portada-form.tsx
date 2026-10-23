"use client";

import Link from "next/link";
import { startTransition, useActionState, useState, type FormEvent } from "react";
import { BotonPrincipal, Campo, Casilla, MensajeError } from "@/components/form";
import type { EstadoFormulario } from "./actions";

type Inicial = {
  titulo: string | null;
  enlace: string | null;
  orden: number;
  activo: boolean;
  imagenEscritorio: string | null;
  imagenMovil: string | null;
};

type Props = {
  accion: (prev: EstadoFormulario, form: FormData) => Promise<EstadoFormulario>;
  inicial?: Inicial;
  soloLectura?: boolean;
};

function SelectorImagen({
  nombre,
  titulo,
  ayuda,
  actual,
  proporcion,
  quitar,
}: {
  nombre: string;
  titulo: string;
  ayuda: string;
  actual: string | null;
  proporcion: string;
  quitar?: { marcado: boolean; cambiar: (v: boolean) => void };
}) {
  const [vista, setVista] = useState<string | null>(null);
  const mostrada = vista ?? (quitar?.marcado ? null : actual);
  return (
    <section className="flex flex-col gap-3">
      <div>
        <h2 className="font-semibold">{titulo}</h2>
        <p className="text-sm text-texto-suave">{ayuda}</p>
      </div>
      <div className={`${proporcion} w-full max-w-xl overflow-hidden rounded-lg border border-borde bg-fondo`}>
        {mostrada ? (
          // eslint-disable-next-line @next/next/no-img-element -- vista previa local o imagen ya optimizada
          <img src={mostrada} alt="" className="size-full object-cover" />
        ) : (
          <div className="flex size-full items-center justify-center text-sm text-texto-suave">Sin imagen</div>
        )}
      </div>
      <input
        type="file"
        name={nombre}
        accept="image/*"
        onChange={(e) => {
          const elegido = e.currentTarget.files?.[0];
          setVista(elegido ? URL.createObjectURL(elegido) : null);
        }}
        className="text-sm file:mr-3 file:min-h-11 file:rounded-lg file:border file:border-borde file:bg-superficie file:px-4 file:text-sm file:font-medium"
      />
      {quitar && actual && !vista && (
        <Casilla etiqueta="Quitar la imagen para celular" checked={quitar.marcado} onChange={(e) => quitar.cambiar(e.currentTarget.checked)} name="quitarMovil" />
      )}
    </section>
  );
}

export function PortadaForm({ accion, inicial, soloLectura = false }: Props) {
  const [estado, enviar, enviando] = useActionState(accion, undefined);
  const [quitarMovil, setQuitarMovil] = useState(false);

  // Se envía a mano para que React no vacíe el formulario si el servidor devuelve un error.
  function alEnviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const datos = new FormData(evento.currentTarget);
    startTransition(() => enviar(datos));
  }

  return (
    <form onSubmit={alEnviar} className="flex flex-col gap-5 rounded-xl border border-borde bg-superficie p-4 sm:p-6 lg:max-w-4xl">
      <fieldset disabled={soloLectura} className="flex flex-col gap-6">
        <SelectorImagen
          nombre="imagenEscritorio"
          titulo="Imagen para compu y tablet"
          ayuda="Formato 3:1, ideal 1920 × 640 píxeles. Si tiene otra forma se recorta desde el centro."
          actual={inicial?.imagenEscritorio ?? null}
          proporcion="aspect-[3/1]"
        />
        <SelectorImagen
          nombre="imagenMovil"
          titulo="Imagen para celular (opcional)"
          ayuda="Cuadrada 1:1, ideal 1080 × 1080 píxeles. Si no la cargas, en el celular se usa la de compu."
          actual={inicial?.imagenMovil ?? null}
          proporcion="aspect-square max-w-xs"
          quitar={{ marcado: quitarMovil, cambiar: setQuitarMovil }}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo etiqueta="Título (opcional)" name="titulo" defaultValue={inicial?.titulo ?? ""} ayuda="Describe la imagen para buscadores y lectores de pantalla." />
          <Campo
            etiqueta="Enlace al tocarla (opcional)"
            name="enlace"
            defaultValue={inicial?.enlace ?? ""}
            placeholder="/catalogo?rubro=aros-plata"
            ayuda="Una página de la web (empieza con /) o una dirección https://"
          />
          <Campo etiqueta="Orden" name="orden" type="number" min={0} max={9999} defaultValue={inicial?.orden ?? 0} ayuda="Las de número menor salen primero." />
        </div>
        <Casilla etiqueta="Activa (se muestra en la web)" name="activo" defaultChecked={inicial?.activo ?? true} />
      </fieldset>
      <MensajeError>{estado?.error}</MensajeError>
      <div className="flex items-center gap-4">
        {!soloLectura && <BotonPrincipal disabled={enviando}>{enviando ? "Guardando…" : "Guardar"}</BotonPrincipal>}
        <Link href="/admin/portada" className="text-sm text-texto-suave hover:text-marca">
          Volver
        </Link>
      </div>
    </form>
  );
}
