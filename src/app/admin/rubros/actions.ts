"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { rubros } from "@/db/schema";
import { requerirPermiso } from "@/lib/auth/dal";
import { obtenerRubro, slugEnUso, usoDelRubro } from "@/lib/gestion/rubros";
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

  try {
    await db.insert(rubros).values(datos.data);
  } catch (error) {
    const mensaje = mensajeDuplicado(error);
    if (mensaje) return { error: mensaje };
    throw error;
  }
  revalidatePath("/admin/rubros");
  redirect("/admin/rubros");
}

export async function editarRubro(
  id: number,
  _prev: EstadoFormulario,
  form: FormData,
): Promise<EstadoFormulario> {
  await requerirPermiso("rubros", "editar");
  if (!(await obtenerRubro(id))) return { error: "El rubro no existe" };
  const datos = leerFormulario(form);
  if (!datos.success) return { error: datos.error.issues[0]?.message ?? "Datos inválidos" };
  const errorPadre = await validarPadre(datos.data.rubroPadreId, id);
  if (errorPadre) return { error: errorPadre };
  if (await slugEnUso(datos.data.slug, id)) return { error: "Esa dirección web ya la usa otro rubro" };

  try {
    await db.update(rubros).set(datos.data).where(eq(rubros.id, id));
  } catch (error) {
    const mensaje = mensajeDuplicado(error);
    if (mensaje) return { error: mensaje };
    throw error;
  }
  revalidatePath("/admin/rubros");
  redirect("/admin/rubros");
}

export async function eliminarRubro(id: number): Promise<void> {
  await requerirPermiso("rubros", "eliminar");
  const uso = await usoDelRubro(id);
  if (uso.subrubros > 0 || uso.productos > 0) redirect(`/admin/rubros/${id}?en-uso=1`);

  await db.delete(rubros).where(eq(rubros.id, id));
  revalidatePath("/admin/rubros");
  redirect("/admin/rubros");
}
