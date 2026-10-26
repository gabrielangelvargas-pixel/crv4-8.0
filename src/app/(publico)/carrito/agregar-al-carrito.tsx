"use client";

import Link from "next/link";
import { useState } from "react";
import { agregarAlCarrito, CANTIDAD_MAXIMA } from "./carrito-local";

export function SelectorCantidad({
  valor,
  cambiar,
  etiqueta = "Cantidad",
}: {
  valor: number;
  cambiar: (n: number) => void;
  etiqueta?: string;
}) {
  const boton =
    "flex size-11 items-center justify-center text-lg font-medium text-texto hover:bg-fondo disabled:text-texto-suave disabled:hover:bg-transparent";
  return (
    <div role="group" aria-label={etiqueta} className="inline-flex items-center rounded-lg border border-borde bg-superficie">
      <button type="button" aria-label="Uno menos" className={`${boton} rounded-l-lg`} disabled={valor <= 1} onClick={() => cambiar(valor - 1)}>
        −
      </button>
      <input
        aria-label={etiqueta}
        inputMode="numeric"
        value={valor}
        onChange={(e) => {
          const n = Number(e.target.value.replace(/\D/g, ""));
          if (n >= 1) cambiar(Math.min(CANTIDAD_MAXIMA, n));
        }}
        className="h-11 w-14 border-x border-borde text-center text-base tabular-nums"
      />
      <button
        type="button"
        aria-label="Uno más"
        className={`${boton} rounded-r-lg`}
        disabled={valor >= CANTIDAD_MAXIMA}
        onClick={() => cambiar(valor + 1)}
      >
        +
      </button>
    </div>
  );
}

// Botón de la ficha. Sin disponible no se puede agregar.
export function AgregarAlCarrito({ varianteId, disponible }: { varianteId: number; disponible: boolean }) {
  const [cantidad, setCantidad] = useState(1);
  const [agregado, setAgregado] = useState<number | null>(null);

  if (!disponible) {
    return <p className="rounded-lg bg-fondo px-4 py-3 text-sm text-texto-suave">Sin stock por ahora: no se puede agregar al carrito.</p>;
  }
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <SelectorCantidad valor={cantidad} cambiar={setCantidad} />
        <button
          type="button"
          onClick={() => {
            agregarAlCarrito(varianteId, cantidad);
            setAgregado(varianteId);
          }}
          className="inline-flex min-h-11 flex-1 items-center justify-center rounded-lg bg-marca px-5 text-sm font-semibold text-white hover:bg-marca-oscuro sm:flex-none"
        >
          Agregar al carrito
        </button>
      </div>
      {agregado === varianteId && (
        <p role="status" className="flex flex-wrap items-center gap-x-3 text-sm text-green-700">
          Listo, está en tu carrito.
          <Link href="/carrito" className="font-medium text-marca underline underline-offset-4">
            Ver carrito
          </Link>
        </p>
      )}
    </div>
  );
}
