"use server";

import { and, eq, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { rolPermisos, roles } from "@/db/schema";
import { requerirPermiso } from "@/lib/auth/dal";
import { ACCIONES, MODULOS, type Accion, type Modulo } from "@/lib/auth/permisos-catalogo";
import { contarUsuariosDelRol, obtenerRol } from "@/lib/gestion/roles";

export type EstadoRol = { error?: string } | undefined;

const PARES_VALIDOS = new Set<string>(MODULOS.flatMap((m) => ACCIONES.map((a) => `${m}:${a}`)));

const datosRol = z.object({
  nombre: z.string().trim().min(2, "El nombre debe tener al menos 2 letras").max(60),
  descripcion: z.string().trim().max(255),
  activo: z.boolean(),
  permisos: z.array(z.string().refine((p) => PARES_VALIDOS.has(p))),
});

function leerFormulario(form: FormData) {
  return datosRol.safeParse({
    nombre: form.get("nombre") ?? "",
    descripcion: form.get("descripcion") ?? "",
    activo: form.get("activo") === "on",
    permisos: form.getAll("permisos"),
  });
}

async function nombreEnUso(nombre: string, excepto?: number): Promise<boolean> {
  const condicion = excepto ? and(eq(roles.nombre, nombre), ne(roles.id, excepto)) : eq(roles.nombre, nombre);
  const [fila] = await db.select({ id: roles.id }).from(roles).where(condicion).limit(1);
  return Boolean(fila);
}

function aFilas(rolId: number, permisos: string[]) {
  return permisos.map((p) => {
    const [modulo, accion] = p.split(":") as [Modulo, Accion];
    return { rolId, modulo, accion };
  });
}

export async function crearRol(_prev: EstadoRol, form: FormData): Promise<EstadoRol> {
  await requerirPermiso("roles", "crear");
  const datos = leerFormulario(form);
  if (!datos.success) return { error: datos.error.issues[0]?.message ?? "Datos inválidos" };
  if (await nombreEnUso(datos.data.nombre)) return { error: "Ya existe un rol con ese nombre" };

  await db.transaction(async (tx) => {
    const [res] = await tx.insert(roles).values({
      nombre: datos.data.nombre,
      descripcion: datos.data.descripcion || null,
      activo: datos.data.activo,
    });
    const filas = aFilas(res.insertId, datos.data.permisos);
    if (filas.length) await tx.insert(rolPermisos).values(filas);
  });

  revalidatePath("/admin/roles");
  redirect("/admin/roles");
}

export async function editarRol(id: number, _prev: EstadoRol, form: FormData): Promise<EstadoRol> {
  const usuario = await requerirPermiso("roles", "editar");
  const rol = await obtenerRol(id);
  if (!rol) return { error: "El rol no existe" };
  // Evita que alguien se dé más permisos a sí mismo.
  if (rol.id === usuario.rol.id && !usuario.accesoTotal) {
    return { error: "No puedes modificar tu propio rol" };
  }

  const esSistema = rol.codigo !== null;
  // El campo nombre va deshabilitado en los roles del sistema y no se envía.
  if (esSistema) form.set("nombre", rol.nombre);
  const datos = leerFormulario(form);
  if (!datos.success) return { error: datos.error.issues[0]?.message ?? "Datos inválidos" };

  // Los roles del sistema conservan nombre y estado; sus permisos son fijos.
  const nombre = esSistema ? rol.nombre : datos.data.nombre;
  if (!esSistema && (await nombreEnUso(nombre, id))) return { error: "Ya existe un rol con ese nombre" };

  await db.transaction(async (tx) => {
    await tx
      .update(roles)
      .set({
        nombre,
        descripcion: datos.data.descripcion || null,
        activo: esSistema ? true : datos.data.activo,
      })
      .where(eq(roles.id, id));
    if (rol.accesoGestion && !rol.accesoTotal) {
      await tx.delete(rolPermisos).where(eq(rolPermisos.rolId, id));
      const filas = aFilas(id, datos.data.permisos);
      if (filas.length) await tx.insert(rolPermisos).values(filas);
    }
  });

  revalidatePath("/admin", "layout");
  redirect("/admin/roles");
}

export async function eliminarRol(id: number): Promise<void> {
  await requerirPermiso("roles", "eliminar");
  const rol = await obtenerRol(id);
  if (!rol || rol.codigo !== null) redirect("/admin/roles");
  if ((await contarUsuariosDelRol(id)) > 0) redirect(`/admin/roles/${id}?con-usuarios=1`);

  await db.delete(roles).where(eq(roles.id, id));
  revalidatePath("/admin/roles");
  redirect("/admin/roles");
}
