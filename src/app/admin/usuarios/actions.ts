"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { usuarios } from "@/db/schema";
import { requerirPermiso } from "@/lib/auth/dal";
import { hashPassword } from "@/lib/auth/password";
import { cerrarSesionesDe, type UsuarioSesion } from "@/lib/auth/session";
import { errorNombreUsuario, errorPassword } from "@/lib/auth/validacion";
import { obtenerRol } from "@/lib/gestion/roles";
import {
  nombreUsuarioEnUso,
  obtenerUsuario,
  otrosAdministradoresActivos,
  usuarioConHistorial,
  type UsuarioDetalle,
} from "@/lib/gestion/usuarios";

export type EstadoFormulario = { error?: string; ok?: string } | undefined;

// Quien no tiene acceso total no puede tocar a un administrador ni crear uno:
// así nadie se da a sí mismo (ni a otro) más poder del que tiene.
function protegeAdministrador(actor: UsuarioSesion, objetivo: { accesoTotal: boolean }): string | null {
  return objetivo.accesoTotal && !actor.accesoTotal ? "Solo un administrador puede modificar a otro administrador" : null;
}

async function leerDatos(form: FormData) {
  const nombre = String(form.get("nombre") ?? "").trim();
  const nombreUsuario = String(form.get("nombreUsuario") ?? "").trim();
  if (nombre.length < 2) return { error: "El nombre debe tener al menos 2 letras" } as const;
  if (nombre.length > 120) return { error: "El nombre es muy largo" } as const;
  const errorUsuario = errorNombreUsuario(nombreUsuario);
  if (errorUsuario) return { error: errorUsuario } as const;
  return { nombre, nombreUsuario, rolId: Number(form.get("rolId")), activo: form.get("activo") === "on" } as const;
}

export async function crearUsuario(_prev: EstadoFormulario, form: FormData): Promise<EstadoFormulario> {
  const actor = await requerirPermiso("usuarios", "crear");
  const datos = await leerDatos(form);
  if ("error" in datos) return { error: datos.error };

  const rol = Number.isInteger(datos.rolId) ? await obtenerRol(datos.rolId) : null;
  // Las cuentas de clientes se crean solas al comprar en la web.
  if (!rol || !rol.activo || !rol.accesoGestion) return { error: "Elige un rol de la gestión" };
  const errorAdmin = protegeAdministrador(actor, rol);
  if (errorAdmin) return { error: errorAdmin };

  const password = String(form.get("password") ?? "");
  const errorClave = errorPassword(password, String(form.get("confirmacion") ?? ""));
  if (errorClave) return { error: errorClave };
  if (await nombreUsuarioEnUso(datos.nombreUsuario)) return { error: "Ese nombre de usuario ya existe" };

  await db.insert(usuarios).values({
    nombre: datos.nombre,
    nombreUsuario: datos.nombreUsuario,
    rolId: rol.id,
    activo: datos.activo,
    passwordHash: await hashPassword(password),
  });
  revalidatePath("/admin/usuarios");
  redirect("/admin/usuarios");
}

async function cargarObjetivo(actor: UsuarioSesion, id: number): Promise<UsuarioDetalle | string> {
  const objetivo = await obtenerUsuario(id);
  if (!objetivo) return "El usuario no existe";
  return protegeAdministrador(actor, objetivo) ?? objetivo;
}

export async function editarUsuario(id: number, _prev: EstadoFormulario, form: FormData): Promise<EstadoFormulario> {
  const actor = await requerirPermiso("usuarios", "editar");
  const objetivo = await cargarObjetivo(actor, id);
  if (typeof objetivo === "string") return { error: objetivo };
  const datos = await leerDatos(form);
  if ("error" in datos) return { error: datos.error };

  // Nadie cambia su propio rol ni se desactiva a sí mismo.
  const esPropio = objetivo.id === actor.id;
  const rolId = esPropio ? objetivo.rolId : datos.rolId;
  const activo = esPropio ? true : datos.activo;

  const rol = await obtenerRol(rolId);
  if (!rol || (!rol.activo && rol.id !== objetivo.rolId)) return { error: "Elige un rol válido" };
  // Un usuario del equipo no pasa a ser cliente de la web, ni al revés.
  if (rol.accesoGestion !== objetivo.accesoGestion) return { error: "Ese rol no corresponde a este tipo de usuario" };
  const errorAdmin = protegeAdministrador(actor, rol);
  if (errorAdmin) return { error: errorAdmin };

  const dejaDeSerAdmin = objetivo.accesoTotal && (!rol.accesoTotal || !activo);
  if (dejaDeSerAdmin && (await otrosAdministradoresActivos(id)) === 0) {
    return { error: "Tiene que quedar al menos un administrador activo" };
  }
  if (await nombreUsuarioEnUso(datos.nombreUsuario, id)) return { error: "Ese nombre de usuario ya existe" };

  await db
    .update(usuarios)
    .set({ nombre: datos.nombre, nombreUsuario: datos.nombreUsuario, rolId: rol.id, activo })
    .where(eq(usuarios.id, id));
  if (!activo) await cerrarSesionesDe(id);
  revalidatePath("/admin/usuarios");
  redirect("/admin/usuarios");
}

export async function cambiarPasswordDe(
  id: number,
  _prev: EstadoFormulario,
  form: FormData,
): Promise<EstadoFormulario> {
  const actor = await requerirPermiso("usuarios", "editar");
  const objetivo = await cargarObjetivo(actor, id);
  if (typeof objetivo === "string") return { error: objetivo };

  const password = String(form.get("password") ?? "");
  const errorClave = errorPassword(password, String(form.get("confirmacion") ?? ""));
  if (errorClave) return { error: errorClave };

  await db.update(usuarios).set({ passwordHash: await hashPassword(password) }).where(eq(usuarios.id, id));
  await cerrarSesionesDe(id, id === actor.id);
  return { ok: "Contraseña cambiada. Se cerraron sus sesiones abiertas." };
}

export async function eliminarUsuario(id: number): Promise<void> {
  const actor = await requerirPermiso("usuarios", "eliminar");
  const objetivo = await cargarObjetivo(actor, id);
  if (typeof objetivo === "string" || objetivo.id === actor.id) redirect(`/admin/usuarios/${id}?no-eliminar=1`);
  if (objetivo.accesoTotal && (await otrosAdministradoresActivos(id)) === 0) {
    redirect(`/admin/usuarios/${id}?no-eliminar=1`);
  }
  if (await usuarioConHistorial(id)) redirect(`/admin/usuarios/${id}?no-eliminar=1`);

  await db.delete(usuarios).where(eq(usuarios.id, id));
  revalidatePath("/admin/usuarios");
  redirect("/admin/usuarios");
}
