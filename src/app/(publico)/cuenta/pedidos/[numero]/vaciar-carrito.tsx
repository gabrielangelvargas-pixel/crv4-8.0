"use client";

import { useEffect } from "react";
import { vaciarCarrito } from "../../../carrito/carrito-local";

// Después de confirmar un pedido, el carrito queda vacío.
export function VaciarCarrito() {
  useEffect(() => vaciarCarrito(), []);
  return null;
}
