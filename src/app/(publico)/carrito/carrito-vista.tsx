"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { formatearPrecio } from "@/lib/numeros";
import { subtotalDe } from "@/lib/pedidos";
import { consultarCarrito, type RenglonVista } from "./actions";
import { SelectorCantidad } from "./agregar-al-carrito";
import { cambiarCantidad, quitarDelCarrito, useCarrito, type ItemCarrito } from "./carrito-local";

// Trae de la base los datos de las variantes del carrito cada vez que cambia qué hay en él.
export function useRenglonesCarrito(items: ItemCarrito[]) {
  const clave = items.map((i) => i.varianteId).join(",");
  const [datos, setDatos] = useState<{ clave: string; renglones: Map<number, RenglonVista> } | null>(null);
  useEffect(() => {
    if (!clave) return;
    let vigente = true;
    consultarCarrito(clave.split(",").map(Number)).then((renglones) => {
      if (vigente) setDatos({ clave, renglones: new Map(renglones.map((r) => [r.varianteId, r])) });
    });
    return () => {
      vigente = false;
    };
  }, [clave]);
  // Mientras llega la consulta de un carrito distinto se sigue mostrando la anterior.
  return datos;
}

export function totalCarrito(items: ItemCarrito[], renglones: Map<number, RenglonVista>): number {
  return items.reduce((suma, i) => {
    const r = renglones.get(i.varianteId);
    return r ? suma + Number(subtotalDe(String(i.cantidad), r.precio)) : suma;
  }, 0);
}

export function CarritoVista() {
  const items = useCarrito();
  const datos = useRenglonesCarrito(items);

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-xl border border-borde bg-superficie px-6 py-12 text-center">
        <p className="text-lg font-medium">Tu carrito está vacío</p>
        <p className="text-sm text-texto-suave">Elegí productos en el catálogo y agregalos desde su ficha.</p>
        <Link href="/catalogo" className="inline-flex min-h-11 items-center rounded-lg bg-marca px-5 text-sm font-semibold text-white hover:bg-marca-oscuro">
          Ver el catálogo
        </Link>
      </div>
    );
  }
  if (!datos) return <p className="text-sm text-texto-suave">Cargando tu carrito…</p>;

  const { renglones } = datos;
  const problemas = items.filter((i) => !renglones.get(i.varianteId)?.disponible).length;
  const total = totalCarrito(items, renglones);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_20rem] lg:items-start">
      <ul className="flex flex-col divide-y divide-borde rounded-xl border border-borde bg-superficie">
        {items.map((item) => {
          const r = renglones.get(item.varianteId);
          return (
            <li key={item.varianteId} className="flex gap-3 p-3 sm:gap-4 sm:p-4">
              <div className="size-20 shrink-0 overflow-hidden rounded-lg border border-borde bg-white sm:size-24">
                {r?.imagen && (
                  // eslint-disable-next-line @next/next/no-img-element -- la foto ya está optimizada a 500x500 WEBP
                  <img src={r.imagen} alt="" className="size-full object-contain" />
                )}
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                {r ? (
                  <div>
                    <Link href={`/catalogo/${r.productoId}`} className="font-medium hover:text-marca">
                      {r.nombre}
                    </Link>
                    {r.variante && <p className="text-sm text-texto-suave">{r.variante}</p>}
                    <p className="text-sm">
                      {formatearPrecio(r.precio)}
                      {r.anterior && <span className="ml-2 text-texto-suave line-through">{formatearPrecio(r.anterior)}</span>}
                    </p>
                    {!r.disponible && <p className="text-sm font-medium text-peligro">Sin stock: quitalo para seguir.</p>}
                  </div>
                ) : (
                  <p className="text-sm font-medium text-peligro">Este producto ya no está en la web: quitalo para seguir.</p>
                )}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  {r?.disponible ? (
                    <SelectorCantidad valor={item.cantidad} cambiar={(n) => cambiarCantidad(item.varianteId, n)} />
                  ) : (
                    <span />
                  )}
                  <div className="flex items-center gap-3">
                    {r?.disponible && (
                      <span className="font-semibold tabular-nums">{formatearPrecio(subtotalDe(String(item.cantidad), r.precio))}</span>
                    )}
                    <button
                      type="button"
                      onClick={() => quitarDelCarrito(item.varianteId)}
                      className="min-h-11 rounded-lg px-2 text-sm text-texto-suave hover:text-peligro"
                    >
                      Quitar
                    </button>
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
      <aside className="flex flex-col gap-3 rounded-xl border border-borde bg-superficie p-4 lg:sticky lg:top-24">
        <div className="flex items-baseline justify-between">
          <span className="text-sm text-texto-suave">Total</span>
          <span className="text-2xl font-semibold tabular-nums">{formatearPrecio(total)}</span>
        </div>
        <p className="text-xs text-texto-suave">Te confirmamos el pedido y, si pedís envío, su costo.</p>
        {problemas > 0 ? (
          <p className="text-sm text-peligro">Quitá los productos sin stock para continuar.</p>
        ) : (
          <Link
            href="/carrito/confirmar"
            className="inline-flex min-h-11 items-center justify-center rounded-lg bg-marca px-5 text-sm font-semibold text-white hover:bg-marca-oscuro"
          >
            Continuar con el pedido
          </Link>
        )}
        <Link href="/catalogo" className="text-center text-sm text-marca hover:underline">
          Seguir comprando
        </Link>
      </aside>
    </div>
  );
}
