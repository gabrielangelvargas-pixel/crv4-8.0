"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

export type Diapositiva = { id: number; escritorio: string; movil: string | null; titulo: string | null; enlace: string | null };

const INTERVALO = 5000;

// Slider del inicio: pasa solo cada 5 segundos, se puede deslizar con el dedo y
// se frena mientras el mouse o el foco están encima. En el celular usa la imagen
// cuadrada si todas la tienen; si no, la ancha.
export function SliderPortada({ diapositivas }: { diapositivas: Diapositiva[] }) {
  const [actual, setActual] = useState(0);
  const [pausado, setPausado] = useState(false);
  const inicioToque = useRef<number | null>(null);
  const total = diapositivas.length;
  const cuadradaEnCelular = diapositivas.every((d) => d.movil);

  const ir = useCallback((n: number) => setActual(((n % total) + total) % total), [total]);

  useEffect(() => {
    if (total < 2 || pausado || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const reloj = setInterval(() => setActual((a) => (a + 1) % total), INTERVALO);
    return () => clearInterval(reloj);
  }, [total, pausado]);

  return (
    <section
      aria-roledescription="carrusel"
      aria-label="Novedades"
      className={`relative overflow-hidden rounded-2xl bg-fondo ${cuadradaEnCelular ? "aspect-square" : "aspect-[3/1]"} md:aspect-[3/1]`}
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
              {cuadradaEnCelular && d.movil && <source media="(max-width: 767px)" srcSet={d.movil} />}
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
