"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { rubros } from "@/db/schema";
import { requerirPermiso } from "@/lib/auth/dal";
import { descargarImagenWoo, ErrorWoo, leerCategoriasWoo } from "@/lib/gestion/woocommerce";
import { borrarImagen, guardarImagenRubro, TAMANO_MAXIMO } from "@/lib/imagenes";
import { normalizarTienda, prepararCategorias, type CategoriaImportable } from "@/lib/woo-categorias";

export type CategoriaVista = CategoriaImportable & { existe: boolean };

export type EstadoConsulta =
  | { error: string }
  | { tienda: string; categorias: CategoriaVista[] }
  | undefined;

export type EstadoImportacion =
  | { error: string }
  | { creados: string[]; existentes: string[]; fallidos: string[]; sinImagen: string[] }
  | undefined;

type Acceso = { tienda: string; clave: string; secreto: string };

function leerAcceso(form: FormData): Acceso | { error: string } {
  const tienda = normalizarTienda(String(form.get("tienda") ?? ""));
  const clave = String(form.get("clave") ?? "").trim();
  const secreto = String(form.get("secreto") ?? "").trim();
  if (!tienda) return { error: "Escribí la dirección de tu tienda con https, por ejemplo https://mitienda.com" };
  if (!/^ck_\w+$/.test(clave)) return { error: "La clave del cliente empieza con ck_" };
  if (!/^cs_\w+$/.test(secreto)) return { error: "La clave secreta empieza con cs_" };
  return { tienda, clave, secreto };
}

async function categoriasDeLaTienda(form: FormData): Promise<{ tienda: string; categorias: CategoriaImportable[] } | { error: string }> {
  const acceso = leerAcceso(form);
  if ("error" in acceso) return acceso;
  try {
    return { tienda: acceso.tienda, categorias: prepararCategorias(await leerCategoriasWoo(acceso.tienda, acceso.clave, acceso.secreto)) };
  } catch (error) {
    if (error instanceof ErrorWoo) return { error: error.message };
    throw error;
  }
}

async function rubrosPorSlug() {
  const filas = await db.select({ id: rubros.id, slug: rubros.slug, padreId: rubros.rubroPadreId }).from(rubros);
  return new Map(filas.map((r) => [r.slug, r]));
}

export async function consultarWoo(_prev: EstadoConsulta, form: FormData): Promise<EstadoConsulta> {
  await requerirPermiso("rubros", "crear");
  const resultado = await categoriasDeLaTienda(form);
  if ("error" in resultado) return resultado;
  if (resultado.categorias.length === 0) return { error: "La tienda no tiene categorías de productos." };
  const existentes = await rubrosPorSlug();
  return { tienda: resultado.tienda, categorias: resultado.categorias.map((c) => ({ ...c, existe: existentes.has(c.slug) })) };
}

// Vuelve a leer la tienda (no confía en lo que manda el navegador) y crea los rubros elegidos.
// Una subcategoría elegida trae a su principal aunque no se haya marcado.
export async function importarWoo(_prev: EstadoImportacion, form: FormData): Promise<EstadoImportacion> {
  await requerirPermiso("rubros", "crear");
  const elegidas = new Set(form.getAll("elegida").map(Number));
  if (elegidas.size === 0) return { error: "Elegí al menos una categoría." };
  const resultado = await categoriasDeLaTienda(form);
  if ("error" in resultado) return resultado;

  const lista = resultado.categorias;
  const principales = new Set(lista.filter((c) => elegidas.has(c.wooId) && c.principalWooId).map((c) => c.principalWooId!));
  const aImportar = lista.filter((c) => elegidas.has(c.wooId) || principales.has(c.wooId));

  const existentes = await rubrosPorSlug();
  const idDePrincipal = new Map<number, number>();
  const informe = { creados: [] as string[], existentes: [] as string[], fallidos: [] as string[], sinImagen: [] as string[] };

  // La lista viene con cada principal antes que sus subcategorías.
  for (const c of aImportar) {
    const yaEsta = existentes.get(c.slug);
    if (yaEsta) {
      if (c.principalWooId === null && yaEsta.padreId === null) idDePrincipal.set(c.wooId, yaEsta.id);
      informe.existentes.push(c.nombre);
      continue;
    }
    const padreId = c.principalWooId === null ? null : idDePrincipal.get(c.principalWooId);
    if (padreId === undefined) {
      informe.fallidos.push(`${c.nombre} (su categoría principal no se pudo importar)`);
      continue;
    }
    if (c.nombre.length < 2) {
      informe.fallidos.push(`${c.nombre || c.slug} (nombre demasiado corto)`);
      continue;
    }

    let imagen: string | null = null;
    if (c.imagen) {
      const archivo = await descargarImagenWoo(c.imagen, TAMANO_MAXIMO);
      imagen = archivo ? await guardarImagenRubro(archivo).catch(() => null) : null;
      if (!imagen) informe.sinImagen.push(c.nombre);
    }

    try {
      const [nuevo] = await db
        .insert(rubros)
        .values({ nombre: c.nombre, slug: c.slug, descripcion: c.descripcion, rubroPadreId: padreId, orden: c.orden, imagen })
        .$returningId();
      if (padreId === null) idDePrincipal.set(c.wooId, nuevo.id);
      existentes.set(c.slug, { id: nuevo.id, slug: c.slug, padreId });
      informe.creados.push(c.nombre);
    } catch (error) {
      await borrarImagen(imagen);
      if (!String(error).includes("Duplicate")) throw error;
      informe.fallidos.push(`${c.nombre} (ya hay un rubro con ese nombre en el mismo nivel)`);
    }
  }

  revalidatePath("/");
  revalidatePath("/admin/rubros");
  return informe;
}
