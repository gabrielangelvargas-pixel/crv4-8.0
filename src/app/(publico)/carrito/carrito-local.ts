import { useSyncExternalStore } from "react";

// El carrito vive en el navegador (localStorage): se puede llenar sin cuenta.
// Solo guarda qué variante y cuántas; precios y disponibilidad se consultan siempre en el servidor.
export type ItemCarrito = { varianteId: number; cantidad: number };

const CLAVE = "crv4-carrito";
export const CANTIDAD_MAXIMA = 9999;
const VACIO: ItemCarrito[] = [];
let memoria: ItemCarrito[] | null = null;
const oyentes = new Set<() => void>();

function leer(): ItemCarrito[] {
  try {
    const datos: unknown = JSON.parse(localStorage.getItem(CLAVE) ?? "[]");
    if (!Array.isArray(datos)) return VACIO;
    return datos.filter(
      (i): i is ItemCarrito =>
        Number.isInteger(i?.varianteId) && i.varianteId > 0 && Number.isInteger(i?.cantidad) && i.cantidad > 0,
    );
  } catch {
    return VACIO;
  }
}

function itemsCarrito(): ItemCarrito[] {
  memoria ??= leer();
  return memoria;
}

function guardar(items: ItemCarrito[]) {
  memoria = items;
  try {
    localStorage.setItem(CLAVE, JSON.stringify(items));
  } catch {
    // Sin almacenamiento (modo privado): el carrito dura mientras la página esté abierta.
  }
  oyentes.forEach((avisar) => avisar());
}

function suscribir(avisar: () => void) {
  oyentes.add(avisar);
  // Otra pestaña cambió el carrito.
  const alCambiar = (e: StorageEvent) => {
    if (e.key !== CLAVE) return;
    memoria = null;
    avisar();
  };
  window.addEventListener("storage", alCambiar);
  return () => {
    oyentes.delete(avisar);
    window.removeEventListener("storage", alCambiar);
  };
}

export function useCarrito(): ItemCarrito[] {
  return useSyncExternalStore(suscribir, itemsCarrito, () => VACIO);
}

const limitar = (n: number) => Math.min(CANTIDAD_MAXIMA, Math.max(1, Math.round(n)));

export function agregarAlCarrito(varianteId: number, cantidad: number) {
  const items = itemsCarrito();
  const previo = items.find((i) => i.varianteId === varianteId);
  guardar(
    previo
      ? items.map((i) => (i === previo ? { varianteId, cantidad: limitar(i.cantidad + cantidad) } : i))
      : [...items, { varianteId, cantidad: limitar(cantidad) }],
  );
}

export function cambiarCantidad(varianteId: number, cantidad: number) {
  guardar(itemsCarrito().map((i) => (i.varianteId === varianteId ? { varianteId, cantidad: limitar(cantidad) } : i)));
}

export function quitarDelCarrito(varianteId: number) {
  guardar(itemsCarrito().filter((i) => i.varianteId !== varianteId));
}

export function vaciarCarrito() {
  guardar(VACIO);
}
