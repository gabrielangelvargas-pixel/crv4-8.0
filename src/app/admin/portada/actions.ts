"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { portadas } from "@/db/schema";
import { requerirPermiso } from "@/lib/auth/dal";
import { obtenerPortada, type Portada } from "@/lib/gestion/portadas";
import { borrarImagen, ErrorImagen, guardarImagenPortada } from "@/lib/imagenes";
import type { FormatoPortada } from "@/lib/rutas-imagen";
import { textoOpcional } from "@/lib/texto";

export type EstadoFormulario = { error?: string } | undefined;

// El enlace puede ser una página de la web ("/catalogo?rubro=vasos") o una dirección completa.
const datosPortada = z.object({
  titulo: z.string().max(120, "El título es muy largo").nullable(),
  enlace: z
    .string()
    .max(255)
    .refine((v) => v.startsWith("/") || /^https?:\/\//.test(v), "El enlace tiene que empezar con / o con https://")
    .nullable(),
  orden: z.number().int().min(0).max(9999),
  activo: z.boolean(),
});

function leerFormulario(form: FormData) {
  return datosPortada.safeParse({
    titulo: textoOpcional(form.get("titulo")),
    enlace: textoOpcional(form.get("enlace")),
    orden: Number(form.get("orden") || 0),
    activo: form.get("activo") === "on",
  });
}

function archivo(form: FormData, campo: string): File | null {
  const valor = form.get(campo);
  return valor instanceof File && valor.size > 0 ? valor : null;
}

// Guarda las imágenes nuevas; las viejas se borran recién cuando la base ya apunta a las nuevas.
async function resolverImagenes(form: FormData, actual: Portada | null) {
  const nuevas: Partial<Record<FormatoPortada, string>> = {};
  try {
    for (const formato of ["escritorio", "movil"] as const) {
      const subida = archivo(form, formato === "escritorio" ? "imagenEscritorio" : "imagenMovil");
      if (subida) nuevas[formato] = await guardarImagenPortada(subida, formato);
    }
  } catch (error) {
    await Promise.all(Object.values(nuevas).map((r) => borrarImagen(r)));
    if (error instanceof ErrorImagen) return { ok: false as const, error: error.message };
    throw error;
  }
  const escritorio = nuevas.escritorio ?? actual?.imagenEscritorio ?? null;
  if (!escritorio) return { ok: false as const, error: "Elige la imagen para compu y tablet" };
  const quitarMovil = form.get("quitarMovil") === "on";
  const movil = nuevas.movil ?? (quitarMovil ? null : (actual?.imagenMovil ?? null));
  const viejas = [actual?.imagenEscritorio, actual?.imagenMovil].filter((r) => r && r !== escritorio && r !== movil);
  return { ok: true as const, escritorio, movil, viejas: viejas as string[] };
}

function refrescar() {
  revalidatePath("/admin/portada");
  revalidatePath("/");
}

export async function crearPortada(_prev: EstadoFormulario, form: FormData): Promise<EstadoFormulario> {
  await requerirPermiso("portada", "crear");
  const datos = leerFormulario(form);
  if (!datos.success) return { error: datos.error.issues[0]?.message ?? "Datos inválidos" };
  const imagenes = await resolverImagenes(form, null);
  if (!imagenes.ok) return { error: imagenes.error };

  await db.insert(portadas).values({ ...datos.data, imagenEscritorio: imagenes.escritorio, imagenMovil: imagenes.movil });
  refrescar();
  redirect("/admin/portada");
}

export async function editarPortada(id: number, _prev: EstadoFormulario, form: FormData): Promise<EstadoFormulario> {
  await requerirPermiso("portada", "editar");
  const actual = await obtenerPortada(id);
  if (!actual) return { error: "La imagen ya no existe" };
  const datos = leerFormulario(form);
  if (!datos.success) return { error: datos.error.issues[0]?.message ?? "Datos inválidos" };
  const imagenes = await resolverImagenes(form, actual);
  if (!imagenes.ok) return { error: imagenes.error };

  await db
    .update(portadas)
    .set({ ...datos.data, imagenEscritorio: imagenes.escritorio, imagenMovil: imagenes.movil })
    .where(eq(portadas.id, id));
  await Promise.all(imagenes.viejas.map((r) => borrarImagen(r)));
  refrescar();
  redirect("/admin/portada");
}

export async function eliminarPortada(id: number): Promise<void> {
  await requerirPermiso("portada", "eliminar");
  const actual = await obtenerPortada(id);
  if (actual) {
    await db.delete(portadas).where(eq(portadas.id, id));
    await Promise.all([borrarImagen(actual.imagenEscritorio), borrarImagen(actual.imagenMovil)]);
  }
  refrescar();
  redirect("/admin/portada");
}
