import "server-only";
import type { CategoriaWoo } from "@/lib/woo-categorias";

export class ErrorWoo extends Error {}

const POR_PAGINA = 100;
const MAXIMO_PAGINAS = 20;
const ESPERA_MS = 20_000;

async function pedir(url: URL): Promise<Response> {
  try {
    return await fetch(url, { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(ESPERA_MS), cache: "no-store" });
  } catch {
    throw new ErrorWoo("No pudimos conectarnos con la tienda. Revisá la dirección y que el sitio esté en línea.");
  }
}

// Trae todas las categorías de productos de la tienda con las claves de la API REST
// (solo hace falta permiso de lectura). Las claves no se guardan en ningún lado.
export async function leerCategoriasWoo(tienda: string, clave: string, secreto: string): Promise<CategoriaWoo[]> {
  const categorias: CategoriaWoo[] = [];
  for (let pagina = 1; pagina <= MAXIMO_PAGINAS; pagina++) {
    const url = new URL(`${tienda}/wp-json/wc/v3/products/categories`);
    url.searchParams.set("per_page", String(POR_PAGINA));
    url.searchParams.set("page", String(pagina));
    url.searchParams.set("consumer_key", clave);
    url.searchParams.set("consumer_secret", secreto);
    const respuesta = await pedir(url);

    if (respuesta.status === 401 || respuesta.status === 403) {
      throw new ErrorWoo("La tienda rechazó las claves. Revisá que estén bien copiadas y que tengan permiso de lectura.");
    }
    if (respuesta.status === 404) {
      throw new ErrorWoo("No encontramos la API de WooCommerce en esa dirección. Revisá que sea la de tu tienda.");
    }
    if (!respuesta.ok) throw new ErrorWoo(`La tienda respondió con un error (${respuesta.status}). Probá de nuevo en un rato.`);

    let lote: unknown;
    try {
      lote = await respuesta.json();
    } catch {
      throw new ErrorWoo("La tienda no respondió como una API de WooCommerce. Revisá la dirección.");
    }
    if (!Array.isArray(lote)) throw new ErrorWoo("La tienda no respondió como una API de WooCommerce. Revisá la dirección.");
    categorias.push(
      ...lote.filter(
        (c): c is CategoriaWoo =>
          typeof c === "object" && c !== null && typeof c.id === "number" && typeof c.name === "string" && typeof c.slug === "string",
      ),
    );

    const paginas = Number(respuesta.headers.get("x-wp-totalpages"));
    if (lote.length < POR_PAGINA || (paginas > 0 && pagina >= paginas)) break;
  }
  return categorias;
}

// Descarga la imagen de una categoría; si falla, el rubro se crea sin imagen.
export async function descargarImagenWoo(src: string, tamanoMaximo: number): Promise<File | null> {
  try {
    const respuesta = await fetch(src, { signal: AbortSignal.timeout(ESPERA_MS), cache: "no-store" });
    if (!respuesta.ok) return null;
    const largo = Number(respuesta.headers.get("content-length"));
    if (largo > tamanoMaximo) return null;
    const datos = await respuesta.arrayBuffer();
    if (datos.byteLength > tamanoMaximo) return null;
    return new File([datos], "categoria");
  } catch {
    return null;
  }
}
