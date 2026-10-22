import "server-only";
import { redirect } from "next/navigation";
import { cache } from "react";
import type { Rol } from "@/db/schema";
import { inicioSegunRol } from "./roles";
import { leerSesion, type UsuarioSesion } from "./session";

// Capa de acceso: todas las páginas y acciones privadas pasan por aquí.
export const usuarioActual = cache(leerSesion);

export async function requerirRol(...roles: Rol[]): Promise<UsuarioSesion> {
  const usuario = await usuarioActual();
  if (!usuario) redirect("/login");
  if (!roles.includes(usuario.rol)) redirect(inicioSegunRol(usuario.rol));
  return usuario;
}
