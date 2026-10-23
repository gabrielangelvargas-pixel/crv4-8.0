import { Fragment, type CSSProperties } from "react";
import { IconoBloque } from "@/components/iconos-bloques";

type Props = { frases: string[]; icono: string; colorFondo: string; colorTexto: string; className?: string };

// Franja de frases que pasan de derecha a izquierda. Se repiten hasta llenar el ancho y
// la animación corre media pista (una copia), así el salto al reiniciar no se nota.
// Con "reducir movimiento" activado en el equipo, queda quieta y centrada.
export function Franja({ frases, icono, colorFondo, colorTexto, className = "" }: Props) {
  if (frases.length === 0) return null;
  const letras = frases.join("").length + frases.length * 4;
  const repetir = Math.max(1, Math.ceil(140 / letras));
  const copia = Array.from({ length: repetir }, () => frases).flat();
  const estilo = { backgroundColor: colorFondo, color: colorTexto, "--duracion": `${Math.max(15, letras * repetir * 0.2)}s` } as CSSProperties;

  const lista = (oculta: boolean) => (
    <ul aria-hidden={oculta || undefined} className="flex shrink-0 items-center">
      {copia.map((frase, i) => (
        <Fragment key={i}>
          <li className="px-5 whitespace-nowrap">{frase}</li>
          <li aria-hidden="true">
            <IconoBloque icono={icono} className="size-4" />
          </li>
        </Fragment>
      ))}
    </ul>
  );

  return (
    <section aria-label="Promociones" style={estilo} className={`overflow-hidden py-3 text-base font-semibold italic md:text-lg ${className}`}>
      <div className="flex w-max animate-franja hover:[animation-play-state:paused] motion-reduce:hidden">
        {lista(false)}
        {lista(true)}
      </div>
      <ul className="hidden flex-wrap items-center justify-center gap-x-5 gap-y-1 px-4 text-center motion-reduce:flex">
        {frases.map((frase, i) => (
          <li key={i}>{frase}</li>
        ))}
      </ul>
    </section>
  );
}
