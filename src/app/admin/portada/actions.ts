"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { portadaAviso, portadaBloques, portadaFranja, portadas } from "@/db/schema";
import { requerirPermiso } from "@/lib/auth/dal";
import { obtenerAviso, obtenerPortada, type Portada } from "@/lib/gestion/portadas";
import { borrarImagen, ErrorImagen, guardarImagenAviso, guardarImagenPortada } from "@/lib/imagenes";
import type { FormatoPortada } from "@/lib/rutas-imagen";
import { textoOpcional } from "@/lib/texto";
import { validarBloques } from "./bloques-datos";
import { datosAviso, datosFranja, enlaceWeb } from "./promociones-datos";

export type EstadoFormulario = { error?: string } | undefined;
export type EstadoBloques = { error?: string; ok?: boolean } | undefined;

const datosPortada = z.object({
  titulo: z.string().max(120, "El título es muy largo").nullable(),
  enlace: enlaceWeb.nullable(),
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

// Los bloques se guardan todos juntos: la lista del formulario reemplaza a la anterior.
export async function guardarBloques(_prev: EstadoBloques, form: FormData): Promise<EstadoBloques> {
  await requerirPermiso("portada", "editar");
  const lista = validarBloques(String(form.get("bloques") ?? "[]"));
  if (!lista.ok) return { error: lista.error };

  await db.transaction(async (tx) => {
    await tx.delete(portadaBloques);
    if (lista.bloques.length) {
      await tx.insert(portadaBloques).values(lista.bloques.map((b, orden) => ({ ...b, texto: b.texto || null, orden })));
    }
  });
  refrescar();
  return { ok: true };
}

export async function guardarFranja(_prev: EstadoBloques, form: FormData): Promise<EstadoBloques> {
  await requerirPermiso("portada", "editar");
  const datos = datosFranja.safeParse({
    frases: String(form.get("frases") ?? ""),
    icono: form.get("icono"),
    colorFondo: form.get("colorFondo"),
    colorTexto: form.get("colorTexto"),
    activo: form.get("activo") === "on",
  });
  if (!datos.success) return { error: datos.error.issues[0]?.message ?? "Datos inválidos" };

  await db.insert(portadaFranja).values({ id: 1, ...datos.data }).onDuplicateKeyUpdate({ set: { ...datos.data, actualizadoEn: new Date() } });
  refrescar();
  return { ok: true };
}

export async function guardarAviso(_prev: EstadoBloques, form: FormData): Promise<EstadoBloques> {
  await requerirPermiso("portada", "editar");
  const datos = datosAviso.safeParse({
    titulo: textoOpcional(form.get("titulo")),
    texto: textoOpcional(form.get("texto")),
    botonTexto: textoOpcional(form.get("botonTexto")),
    enlace: textoOpcional(form.get("enlace")),
    desde: textoOpcional(form.get("desde")),
    hasta: textoOpcional(form.get("hasta")),
    frecuencia: form.get("frecuencia"),
    activo: form.get("activo") === "on",
  });
  if (!datos.success) return { error: datos.error.issues[0]?.message ?? "Datos inválidos" };

  const actual = await obtenerAviso();
  let imagen = form.get("quitarImagen") === "on" ? null : actual.imagen;
  const subida = archivo(form, "imagen");
  if (subida) {
    try {
      imagen = await guardarImagenAviso(subida);
    } catch (error) {
      if (error instanceof ErrorImagen) return { error: error.message };
      throw error;
    }
  }
  if (datos.data.activo && !imagen && !datos.data.titulo && !datos.data.texto) {
    if (imagen !== actual.imagen) await borrarImagen(imagen);
    return { error: "El aviso necesita una imagen, un título o un texto" };
  }

  const valores = { ...datos.data, imagen };
  await db.insert(portadaAviso).values({ id: 1, ...valores }).onDuplicateKeyUpdate({ set: { ...valores, actualizadoEn: new Date() } });
  if (actual.imagen && actual.imagen !== imagen) await borrarImagen(actual.imagen);
  refrescar();
  return { ok: true };
}
