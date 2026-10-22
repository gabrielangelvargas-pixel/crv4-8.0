import type { Rol } from "@/db/schema";

export const COOKIE_SESION = "crv4_sesion";

const DIA_MS = 24 * 60 * 60 * 1000;

// Los clientes quedan logueados de forma persistente; el personal, una semana.
export function duracionSesionMs(rol: Rol): number {
  return rol === "cliente" ? 365 * DIA_MS : 7 * DIA_MS;
}

export function puedeEntrarAGestion(rol: Rol): boolean {
  return rol === "admin" || rol === "vendedor";
}

export function inicioSegunRol(rol: Rol): string {
  return puedeEntrarAGestion(rol) ? "/admin" : "/cuenta";
}

// Evita redirecciones abiertas: solo rutas internas como "/admin/productos".
export function destinoSeguro(next: unknown): string | null {
  if (typeof next !== "string") return null;
  if (!next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return null;
  return next;
}
