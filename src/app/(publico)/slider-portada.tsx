"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

export type Diapositiva = { id: number; escritorio: string; movil: string | null; titulo: string | null; enlace: string | null };

const INTERVALO = 5000;
const CONSULTA_CELULAR = "(max-width: 767px)";

function suscribirCelular(avisar: () => void) {
  const consulta = window.matchMedia(CONSULTA_CELULAR);
  consulta.addEventListener("change", avisar);
  return () => consulta.removeEventListener("change", avisar);
}

// En el servidor se arma como en compu; al cargar en el celular se ajusta.
function useEsCelular() {
  return useSyncExternalStore(suscribirCelular, () => window.matchMedia(CONSULTA_CELULAR).matches, () => false);
}

// Slider del inicio: pasa solo cada 5 segundos, se puede deslizar con el dedo y
// se frena mientras el mouse o el foco están encima. En el celular es cuadrado
// si al menos una tiene imagen cuadrada, y entonces muestra solo esas.
export function SliderPortada({ diapositivas: todas }: { diapositivas: Diapositiva[] }) {
  const [elegida, setElegida] = useState(0);
  const [pausado, setPausado] = useState(false);
  const inicioToque = useRef<number | null>(null);
  const esCelular = useEsCelular();
  const cuadradaEnCelular = todas.some((d) => d.movil);
  const cuadrada = esCelular && cuadradaEnCelular;
  const diapositivas = cuadrada ? todas.filter((d) => d.movil) : todas;
  const total = diapositivas.length;
  const actual = elegida % total;

  const ir = useCallback((n: number) => setElegida(((n % total) + total) % total), [total]);

  useEffect(() => {
    if (total < 2 || pausado || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const reloj = setInterval(() => setElegida((a) => (a + 1) % total), INTERVALO);
    return () => clearInterval(reloj);
  }, [total, pausado]);

  return (
    <section
      aria-roledescription="carrusel"
      aria-label="Novedades"
      className={`relative overflow-hidden rounded-2xl bg-fondo ${cuadrada ? "aspect-square" : "aspect-[3/1]"}`}
      onMouseEnter={() => setPausado(true)}
      onMouseLeave={() => setPausado(false)}
      onFocus={() => setPausado(true)}
      onBlur={() => setPausado(false)}
      onTouchStart={(e) => (inicioToque.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (inicioToque.current === null) return;
        const recorrido = e.changedTouches[0].clientX - inicioToque.current;
        inicioToque.current = null;
        if (Math.abs(recorrido) > 40) ir(actual + (recorrido < 0 ? 1 : -1));
      }}
    >
      <div className="flex h-full transition-transform duration-700 ease-out motion-reduce:transition-none" style={{ transform: `translateX(-${actual * 100}%)` }}>
        {diapositivas.map((d, i) => {
          const imagen = (
            <picture>
              {cuadrada && d.movil && <source media={CONSULTA_CELULAR} srcSet={d.movil} />}
              <img
                src={d.escritorio}
                alt={d.titulo ?? ""}
                className="size-full object-cover"
                loading={i === 0 ? "eager" : "lazy"}
                fetchPriority={i === 0 ? "high" : undefined}
              />
            </picture>
          );
          return (
            <div key={d.id} className="h-full w-full shrink-0" aria-hidden={i !== actual} aria-roledescription="diapositiva" aria-label={`${i + 1} de ${total}`}>
              {d.enlace ? (
                <Link href={d.enlace} tabIndex={i === actual ? 0 : -1} className="block size-full">
                  {imagen}
                </Link>
              ) : (
                imagen
              )}
            </div>
          );
        })}
      </div>

      {total > 1 && (
        <>
          <button
            type="button"
            aria-label="Anterior"
            onClick={() => ir(actual - 1)}
            className="absolute top-1/2 left-2 hidden size-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-xl text-texto shadow hover:bg-white md:flex"
          >
            ‹
          </button>
          <button
            type="button"
            aria-label="Siguiente"
            onClick={() => ir(actual + 1)}
            className="absolute top-1/2 right-2 hidden size-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-xl text-texto shadow hover:bg-white md:flex"
          >
            ›
          </button>
          <div className="absolute inset-x-0 bottom-2 flex justify-center gap-1">
            {diapositivas.map((d, i) => (
              <button
                key={d.id}
                type="button"
                aria-label={`Ir a la imagen ${i + 1}`}
                aria-current={i === actual}
                onClick={() => ir(i)}
                className="flex size-6 items-center justify-center"
              >
                <span className={`block h-2 rounded-full bg-white shadow transition-all ${i === actual ? "w-5" : "w-2 opacity-60"}`} />
              </button>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
