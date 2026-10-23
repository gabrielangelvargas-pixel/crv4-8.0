export const COOKIE_SESION = "crv4_sesion";

const DIA_MS = 24 * 60 * 60 * 1000;

// Los clientes quedan logueados de forma persistente; el personal, una semana.
export function duracionSesionMs(accesoGestion: boolean): number {
  return accesoGestion ? 7 * DIA_MS : 365 * DIA_MS;
}

export function inicioSegun(accesoGestion: boolean): string {
  return accesoGestion ? "/admin" : "/cuenta";
}

// Evita redirecciones abiertas: solo rutas internas como "/admin/productos".
export function destinoSeguro(next: unknown): string | null {
  if (typeof next !== "string") return null;
  if (!next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return null;
  return next;
}
