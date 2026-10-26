"use client";

import { useCarrito } from "./carrito-local";

// Globito con la cantidad de productos distintos del carrito, sobre el ícono.
export function ContadorCarrito() {
  const items = useCarrito();
  if (items.length === 0) return null;
  return (
    <span className="absolute -top-1 right-0 flex h-5 min-w-5 items-center justify-center rounded-full bg-acento px-1 text-[11px] leading-none font-bold text-white tabular-nums">
      <span className="sr-only">Productos en el carrito: </span>
      {items.length > 99 ? "99+" : items.length}
    </span>
  );
}
