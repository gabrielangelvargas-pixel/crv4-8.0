"use client";

import Link from "next/link";
import { Fragment, useEffect, useRef } from "react";
import { lineasDeTexto } from "@/lib/iconos-bloque";
import type { FrecuenciaAviso } from "@/lib/promociones";

type Props = {
  // Cambia cada vez que se guarda el aviso, así un aviso nuevo vuelve a mostrarse.
  clave: string;
  frecuencia: FrecuenciaAviso;
  titulo: string | null;
  texto: string | null;
  imagen: string | null;
  botonTexto: string | null;
  enlace: string | null;
};

const LLAVE = "crv4-aviso-visto";

function hoy() {
  return new Date().toLocaleDateString("sv-SE");
}

// Recuerda en el navegador que ya se mostró; si el navegador no deja guardar, se muestra igual.
function yaVisto(clave: string, frecuencia: FrecuenciaAviso): boolean {
  try {
    if (frecuencia === "siempre") return sessionStorage.getItem(LLAVE) === clave;
    const guardado = localStorage.getItem(LLAVE);
    return frecuencia === "dia" ? guardado === `${clave}|${hoy()}` : guardado?.split("|")[0] === clave;
  } catch {
    return false;
  }
}

function marcarVisto(clave: string, frecuencia: FrecuenciaAviso) {
  try {
    if (frecuencia === "siempre") sessionStorage.setItem(LLAVE, clave);
    else localStorage.setItem(LLAVE, `${clave}|${hoy()}`);
  } catch {
    // Sin almacenamiento: se volverá a mostrar.
  }
}

export function AvisoEmergente({ clave, frecuencia, titulo, texto, imagen, botonTexto, enlace }: Props) {
  const dialogo = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (yaVisto(clave, frecuencia)) return;
    const espera = setTimeout(() => {
      dialogo.current?.showModal();
      // El foco va a la ventana y no a la ×, para que no aparezca el borde de foco al abrirse.
      dialogo.current?.focus();
      marcarVisto(clave, frecuencia);
    }, 800);
    return () => clearTimeout(espera);
  }, [clave, frecuencia]);

  const cerrar = () => dialogo.current?.close();
  const foto = imagen && (
    // eslint-disable-next-line @next/next/no-img-element -- la imagen ya está optimizada
    <img src={imagen} alt={titulo ?? ""} className="block h-auto max-h-[85dvh] w-full object-contain" />
  );

  return (
    <dialog
      ref={dialogo}
      tabIndex={-1}
      style={{ outline: "none" }}
      aria-label={titulo ?? "Aviso"}
      onClick={(e) => e.target === e.currentTarget && cerrar()}
      className="m-auto w-[calc(100%-2rem)] max-w-md overflow-hidden rounded-2xl bg-superficie p-0 text-texto shadow-2xl backdrop:bg-black/50"
    >
      <div className="relative">
        <button
          type="button"
          onClick={cerrar}
          aria-label="Cerrar"
          className="absolute top-2 right-2 z-10 flex size-10 items-center justify-center rounded-full bg-white/90 text-xl leading-none text-texto shadow hover:bg-white"
        >
          ×
        </button>
        {foto && enlace && !botonTexto ? (
          <Link href={enlace} onClick={cerrar}>
            {foto}
          </Link>
        ) : (
          foto
        )}
        {(titulo || texto || botonTexto) && (
          <div className="flex flex-col items-center gap-3 px-5 py-6 text-center">
            {titulo && <h2 className="pr-6 text-xl font-bold tracking-tight">{titulo}</h2>}
            {texto && (
              <p className="text-texto-suave">
                {lineasDeTexto(texto).map((linea, i) => (
                  <Fragment key={i}>
                    {i > 0 && <br />}
                    {linea}
                  </Fragment>
                ))}
              </p>
            )}
            {botonTexto && enlace && (
              <Link
                href={enlace}
                onClick={cerrar}
                className="inline-flex min-h-11 items-center rounded-lg bg-marca px-5 font-semibold text-white hover:bg-marca-oscuro"
              >
                {botonTexto}
              </Link>
            )}
          </div>
        )}
      </div>
    </dialog>
  );
}
