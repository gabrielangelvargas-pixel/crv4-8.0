import "server-only";
import { decodificarHtml } from "@/lib/woo-texto";

// Prueba: catálogo leído directamente de una tienda WooCommerce (API REST, solo lectura).
// La dirección y las claves se cargan como variables de entorno en Hostinger.
// Las respuestas se guardan 15 minutos para que la página no dependa de la velocidad de la tienda.

const REFRESCO_SEGUNDOS = 15 * 60;
const ESPERA_MS = 15_000;
export const PRODUCTOS_POR_PAGINA_WOO = 24;

export class ErrorWoo extends Error {}

type ConfigWoo = { url: string; clave: string; secreto: string };

export function configWoo(): ConfigWoo | null {
  const url = process.env.WOO_URL?.trim().replace(/\/+$/, "");
  const clave = process.env.WOO_CLAVE?.trim();
  const secreto = process.env.WOO_SECRETO?.trim();
  if (!url || !clave || !secreto || !url.startsWith("https://")) return null;
  return { url, clave, secreto };
}

async function pedirWoo(config: ConfigWoo, ruta: string, parametros: Record<string, string>) {
  const url = new URL(`${config.url}/wp-json/wc/v3/${ruta}`);
  for (const [clave, valor] of Object.entries(parametros)) url.searchParams.set(clave, valor);
  url.searchParams.set("consumer_key", config.clave);
  url.searchParams.set("consumer_secret", config.secreto);

  let respuesta: Response;
  try {
    respuesta = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(ESPERA_MS),
      next: { revalidate: REFRESCO_SEGUNDOS },
    });
  } catch {
    throw new ErrorWoo("No pudimos conectarnos con la tienda WooCommerce.");
  }
  if (respuesta.status === 401 || respuesta.status === 403) throw new ErrorWoo("La tienda rechazó las claves (WOO_CLAVE / WOO_SECRETO).");
  if (respuesta.status === 404) throw new ErrorWoo("No encontramos la API de WooCommerce en WOO_URL.");
  if (!respuesta.ok) throw new ErrorWoo(`La tienda respondió con un error (${respuesta.status}).`);
  const datos: unknown = await respuesta.json().catch(() => null);
  if (!Array.isArray(datos)) throw new ErrorWoo("La tienda no respondió como una API de WooCommerce.");
  return { datos: datos as Record<string, unknown>[], total: Number(respuesta.headers.get("x-wp-total")) || 0, paginas: Number(respuesta.headers.get("x-wp-totalpages")) || 1 };
}

export type CategoriaWoo = { id: number; nombre: string; slug: string; imagen: string | null; productos: number; padre: number };
export type CategoriaPrincipalWoo = CategoriaWoo & { subcategorias: CategoriaWoo[] };

function texto(valor: unknown): string {
  return typeof valor === "string" ? decodificarHtml(valor).trim() : "";
}

function numero(valor: unknown): number {
  return typeof valor === "number" ? valor : Number(valor) || 0;
}

function imagenDe(valor: unknown): string | null {
  const src = (valor as { src?: unknown } | null)?.src;
  return typeof src === "string" && src.startsWith("https://") ? src : null;
}

// Categorías principales con sus subcategorías (las de tercer nivel o más se suman a la principal).
export async function categoriasWoo(config: ConfigWoo): Promise<CategoriaPrincipalWoo[]> {
  const todas: (CategoriaWoo & { orden: number })[] = [];
  for (let pagina = 1; pagina <= 20; pagina++) {
    const { datos, paginas } = await pedirWoo(config, "products/categories", {
      per_page: "100",
      page: String(pagina),
      _fields: "id,name,slug,parent,count,image,menu_order",
    });
    todas.push(
      ...datos.map((c) => ({
        id: numero(c.id),
        nombre: texto(c.name),
        slug: texto(c.slug),
        imagen: imagenDe(c.image),
        productos: numero(c.count),
        padre: numero(c.parent),
        orden: numero(c.menu_order),
      })),
    );
    if (pagina >= paginas) break;
  }
  todas.sort((a, b) => a.orden - b.orden || a.nombre.localeCompare(b.nombre, "es"));
  const porId = new Map(todas.map((c) => [c.id, c]));
  const principalDe = (c: CategoriaWoo) => {
    let actual = c;
    const vistos = new Set([c.id]);
    while (actual.padre && porId.has(actual.padre) && !vistos.has(actual.padre)) {
      vistos.add(actual.padre);
      actual = porId.get(actual.padre)!;
    }
    return actual;
  };
  // "Sin categorizar" es la categoría por defecto de WooCommerce: no se muestra si está vacía.
  const visibles = todas.filter((c) => !(c.slug === "uncategorized" && c.productos === 0));
  return visibles
    .filter((c) => principalDe(c).id === c.id)
    .map((p) => ({ ...p, subcategorias: visibles.filter((s) => s.id !== p.id && principalDe(s).id === p.id) }));
}

export type ProductoWoo = {
  id: number;
  nombre: string;
  enlace: string | null;
  imagen: string | null;
  categoria: string;
  precioVenta: string;
  precioOferta: string | null;
  disponible: boolean;
};

export async function productosWoo(
  config: ConfigWoo,
  filtro: { categoria?: number; busqueda?: string; pagina: number },
): Promise<{ productos: ProductoWoo[]; total: number; paginas: number }> {
  const parametros: Record<string, string> = {
    per_page: String(PRODUCTOS_POR_PAGINA_WOO),
    page: String(filtro.pagina),
    status: "publish",
    orderby: "menu_order",
    order: "asc",
    _fields: "id,name,permalink,images,categories,price,regular_price,sale_price,on_sale,stock_status",
  };
  if (filtro.categoria) parametros.category = String(filtro.categoria);
  if (filtro.busqueda) parametros.search = filtro.busqueda;
  const { datos, total, paginas } = await pedirWoo(config, "products", parametros);
  return {
    total,
    paginas,
    productos: datos.map((p) => {
      const regular = texto(p.regular_price);
      const oferta = p.on_sale && texto(p.sale_price) ? texto(p.sale_price) : null;
      const enlace = texto(p.permalink);
      return {
        id: numero(p.id),
        nombre: texto(p.name),
        enlace: enlace.startsWith("https://") ? enlace : null,
        imagen: imagenDe(Array.isArray(p.images) ? p.images[0] : null),
        categoria: texto(Array.isArray(p.categories) ? (p.categories[0] as { name?: unknown } | undefined)?.name : ""),
        precioVenta: regular || texto(p.price) || "0",
        precioOferta: oferta,
        disponible: p.stock_status !== "outofstock",
      };
    }),
  };
}
