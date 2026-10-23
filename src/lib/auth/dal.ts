import "server-only";
import { redirect } from "next/navigation";
import { cache } from "react";
import type { Accion, Modulo } from "./permisos-catalogo";
import { tienePermiso } from "./permisos";
import { inicioSegun } from "./roles";
import { leerSesion, type UsuarioSesion } from "./session";

// Capa de acceso: todas las páginas y acciones privadas pasan por aquí.
export const usuarioActual = cache(leerSesion);

async function requerirSesion(): Promise<UsuarioSesion> {
  const usuario = await usuarioActual();
  if (!usuario) redirect("/login");
  return usuario;
}

// Cualquier rol con acceso a la zona de gestión (/admin).
export async function requerirGestion(): Promise<UsuarioSesion> {
  const usuario = await requerirSesion();
  if (!usuario.accesoGestion) redirect(inicioSegun(false));
  return usuario;
}

// Un permiso concreto, ej. requerirPermiso("productos", "editar").
export async function requerirPermiso(modulo: Modulo, accion: Accion): Promise<UsuarioSesion> {
  const usuario = await requerirGestion();
  if (!tienePermiso(usuario, modulo, accion)) redirect("/admin?sin-permiso=1");
  return usuario;
}

// Usuarios de la web (rol sin acceso a gestión).
export async function requerirCliente(): Promise<UsuarioSesion> {
  const usuario = await requerirSesion();
  if (usuario.accesoGestion) redirect(inicioSegun(true));
  return usuario;
}
