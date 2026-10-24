"use server";

import { and, eq, isNotNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { productos, rubros } from "@/db/schema";
import { requerirPermiso } from "@/lib/auth/dal";
import { obtenerRubro, slugEnUso, usoDelRubro } from "@/lib/gestion/rubros";
import { borrarImagen, ErrorImagen, guardarImagenRubro, moverImagen } from "@/lib/imagenes";
import { rutaFotoProducto } from "@/lib/rutas-imagen";
import { slugificar, textoOpcional } from "@/lib/texto";

export type EstadoFormulario = { error?: string } | undefined;

const datosRubro = z.object({
  nombre: z.string().trim().min(2, "El nombre debe tener al menos 2 letras").max(100),
  slug: z.string().min(1, "La dirección web no puede quedar vacía").max(120),
  descripcion: z.string().nullable(),
  rubroPadreId: z.number().int().positive().nullable(),
  orden: z.number().int().min(0).max(9999),
  visibleWeb: z.boolean(),
  activo: z.boolean(),
});

function leerFormulario(form: FormData) {
  const nombre = String(form.get("nombre") ?? "");
  const padre = Number(form.get("rubroPadreId"));
  return datosRubro.safeParse({
    nombre,
    slug: slugificar(String(form.get("slug") || nombre)),
    descripcion: textoOpcional(form.get("descripcion")),
    rubroPadreId: padre > 0 ? padre : null,
    orden: Number(form.get("orden") || 0),
    visibleWeb: form.get("visibleWeb") === "on",
    activo: form.get("activo") === "on",
  });
}

// Solo dos niveles: el padre tiene que ser un rubro principal y no él mismo.
async function validarPadre(padreId: number | null, id?: number): Promise<string | null> {
  if (padreId === null) return null;
  if (padreId === id) return "Un rubro no puede ser subrubro de sí mismo";
  const padre = await obtenerRubro(padreId);
  if (!padre) return "El rubro principal elegido no existe";
  if (padre.rubroPadreId !== null) return "Solo se pueden crear subrubros dentro de un rubro principal";
  if (id && (await usoDelRubro(id)).subrubros > 0) {
    return "Este rubro tiene subrubros, así que no puede pasar a ser subrubro";
  }
  return null;
}

// Guarda la foto nueva si se subió; la anterior se borra recién cuando la base apunta a la nueva.
async function resolverImagen(form: FormData, actual: string | null) {
  const subida = form.get("imagen");
  if (subida instanceof File && subida.size > 0) {
    try {
      return { ok: true as const, imagen: await guardarImagenRubro(subida) };
    } catch (error) {
      if (error instanceof ErrorImagen) return { ok: false as const, error: error.message };
      throw error;
    }
  }
  return { ok: true as const, imagen: form.get("quitarImagen") === "on" ? null : actual };
}

function mensajeDuplicado(error: unknown): string | null {
  return String(error).includes("Duplicate") ? "Ya existe un rubro con ese nombre en el mismo nivel" : null;
}

export async function crearRubro(_prev: EstadoFormulario, form: FormData): Promise<EstadoFormulario> {
  await requerirPermiso("rubros", "crear");
  const datos = leerFormulario(form);
  if (!datos.success) return { error: datos.error.issues[0]?.message ?? "Datos inválidos" };
  const errorPadre = await validarPadre(datos.data.rubroPadreId);
  if (errorPadre) return { error: errorPadre };
  if (await slugEnUso(datos.data.slug)) return { error: "Esa dirección web ya la usa otro rubro" };
  const foto = await resolverImagen(form, null);
  if (!foto.ok) return { error: foto.error };

  try {
    await db.insert(rubros).values({ ...datos.data, imagen: foto.imagen });
  } catch (error) {
    await borrarImagen(foto.imagen);
    const mensaje = mensajeDuplicado(error);
    if (mensaje) return { error: mensaje };
    throw error;
  }
  revalidatePath("/");
  revalidatePath("/admin/rubros");
  redirect("/admin/rubros");
}

export async function editarRubro(
  id: number,
  _prev: EstadoFormulario,
  form: FormData,
): Promise<EstadoFormulario> {
  await requerirPermiso("rubros", "editar");
  const actual = await obtenerRubro(id);
  if (!actual) return { error: "El rubro no existe" };
  const datos = leerFormulario(form);
  if (!datos.success) return { error: datos.error.issues[0]?.message ?? "Datos inválidos" };
  const errorPadre = await validarPadre(datos.data.rubroPadreId, id);
  if (errorPadre) return { error: errorPadre };
  if (await slugEnUso(datos.data.slug, id)) return { error: "Esa dirección web ya la usa otro rubro" };
  const foto = await resolverImagen(form, actual.imagen);
  if (!foto.ok) return { error: foto.error };

  try {
    await db.update(rubros).set({ ...datos.data, imagen: foto.imagen }).where(eq(rubros.id, id));
  } catch (error) {
    if (foto.imagen !== actual.imagen) await borrarImagen(foto.imagen);
    const mensaje = mensajeDuplicado(error);
    if (mensaje) return { error: mensaje };
    throw error;
  }
  if (actual.imagen && actual.imagen !== foto.imagen) await borrarImagen(actual.imagen);
  revalidatePath("/");
  if (datos.data.slug !== actual.slug) await moverFotosDelRubro(id, datos.data.slug);
  revalidatePath("/admin/rubros");
  redirect("/admin/rubros");
}

// Las fotos están en una carpeta con la dirección web del rubro: si cambia, se mueven.
async function moverFotosDelRubro(id: number, slug: string): Promise<void> {
  const conFoto = await db
    .select({ id: productos.id, imagen: productos.imagen })
    .from(productos)
    .where(and(eq(productos.rubroId, id), isNotNull(productos.imagen)));
  for (const p of conFoto) {
    const archivo = p.imagen!.split("/").pop()!;
    const nueva = await moverImagen(p.imagen!, rutaFotoProducto(slug, archivo.replace(/\.webp$/, "")));
    if (nueva !== p.imagen) await db.update(productos).set({ imagen: nueva }).where(eq(productos.id, p.id));
  }
  if (conFoto.length) revalidatePath("/admin/productos");
}

export async function eliminarRubro(id: number): Promise<void> {
  await requerirPermiso("rubros", "eliminar");
  const uso = await usoDelRubro(id);
  if (uso.subrubros > 0 || uso.productos > 0) redirect(`/admin/rubros/${id}?en-uso=1`);

  const actual = await obtenerRubro(id);
  await db.delete(rubros).where(eq(rubros.id, id));
  await borrarImagen(actual?.imagen);
  revalidatePath("/");
  revalidatePath("/admin/rubros");
  redirect("/admin/rubros");
}
