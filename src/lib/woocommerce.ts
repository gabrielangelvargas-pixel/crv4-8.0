import "server-only";
import { decodificarHtml, textoDeHtml } from "@/lib/woo-texto";

// Prueba: catálogo leído directamente de una tienda WooCommerce (API REST, solo lectura).
// La dirección y las claves se cargan como variables de entorno en Hostinger.
// Las respuestas se guardan 5 minutos para que la página no dependa de la velocidad de la tienda.

const REFRESCO_SEGUNDOS = 5 * 60;
const ESPERA_MS = 15_000;
export const PRODUCTOS_POR_PAGINA_WOO = 24;

export class ErrorWoo extends Error {
  constructor(
    mensaje: string,
    readonly estado?: number,
  ) {
    super(mensaje);
  }
}

type ConfigWoo = { url: string; clave: string; secreto: string };

export function configWoo(): ConfigWoo | null {
  const url = process.env.WOO_URL?.trim().replace(/\/+$/, "");
  const clave = process.env.WOO_CLAVE?.trim();
  const secreto = process.env.WOO_SECRETO?.trim();
  if (!url || !clave || !secreto || !url.startsWith("https://")) return null;
  return { url, clave, secreto };
}

async function pedirLista(config: ConfigWoo, ruta: string, parametros: Record<string, string>) {
  const { datos, total, paginas } = await pedirWoo(config, ruta, parametros);
  if (!Array.isArray(datos)) throw new ErrorWoo("La tienda no respondió como una API de WooCommerce.");
  return { datos: datos as Record<string, unknown>[], total, paginas };
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
  if (respuesta.status === 404) throw new ErrorWoo("No encontramos la API de WooCommerce en WOO_URL.", 404);
  if (!respuesta.ok) throw new ErrorWoo(`La tienda respondió con un error (${respuesta.status}).`);
  const datos: unknown = await respuesta.json().catch(() => null);
  return { datos, total: Number(respuesta.headers.get("x-wp-total")) || 0, paginas: Number(respuesta.headers.get("x-wp-totalpages")) || 1 };
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
    const { datos, paginas } = await pedirLista(config, "products/categories", {
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
  imagen: string | null;
  categoria: string;
  precioVenta: string;
  precioOferta: string | null;
  disponible: boolean;
};

// WooCommerce no permite ordenar por dos campos a la vez: primero se piden solo los id con su orden
// y su fecha de publicación (liviano), se ordenan acá (orden del producto y, si empatan, el más
// reciente primero) y después se piden completos solo los productos de la página elegida.
export async function productosWoo(
  config: ConfigWoo,
  filtro: { categoria?: number; busqueda?: string; pagina: number },
): Promise<{ productos: ProductoWoo[]; total: number; paginas: number }> {
  const base: Record<string, string> = { status: "publish" };
  if (filtro.categoria) base.category = String(filtro.categoria);
  if (filtro.busqueda) base.search = filtro.busqueda;

  const indice: { id: number; orden: number; fecha: string }[] = [];
  for (let pagina = 1; pagina <= 50; pagina++) {
    const { datos, paginas } = await pedirLista(config, "products", {
      ...base,
      per_page: "100",
      page: String(pagina),
      orderby: "id",
      order: "asc",
      _fields: "id,menu_order,date_created_gmt",
    });
    indice.push(...datos.map((p) => ({ id: numero(p.id), orden: numero(p.menu_order), fecha: texto(p.date_created_gmt) })));
    if (pagina >= paginas) break;
  }
  indice.sort((a, b) => a.orden - b.orden || b.fecha.localeCompare(a.fecha) || b.id - a.id);

  const total = indice.length;
  const paginas = Math.max(1, Math.ceil(total / PRODUCTOS_POR_PAGINA_WOO));
  const desde = (filtro.pagina - 1) * PRODUCTOS_POR_PAGINA_WOO;
  const ids = indice.slice(desde, desde + PRODUCTOS_POR_PAGINA_WOO).map((p) => p.id);
  if (ids.length === 0) return { productos: [], total, paginas };

  const { datos } = await pedirLista(config, "products", {
    include: ids.join(","),
    per_page: String(ids.length),
    orderby: "include",
    _fields: "id,name,images,categories,price,regular_price,sale_price,on_sale,stock_status",
  });
  const porId = new Map(datos.map((p) => [numero(p.id), p]));
  return {
    total,
    paginas,
    productos: ids.flatMap((id) => {
      const p = porId.get(id);
      return p ? [aProducto(p)] : [];
    }),
  };
}

function precios(p: Record<string, unknown>) {
  const oferta = p.on_sale && texto(p.sale_price) ? texto(p.sale_price) : null;
  return { precioVenta: texto(p.regular_price) || texto(p.price) || "0", precioOferta: oferta, disponible: p.stock_status !== "outofstock" };
}

function aProducto(p: Record<string, unknown>): ProductoWoo {
  return {
    id: numero(p.id),
    nombre: texto(p.name),
    imagen: imagenDe(Array.isArray(p.images) ? p.images[0] : null),
    categoria: texto(Array.isArray(p.categories) ? (p.categories[0] as { name?: unknown } | undefined)?.name : ""),
    ...precios(p),
  };
}

export type VariacionWoo = { id: number; nombre: string; precioVenta: string; precioOferta: string | null; disponible: boolean };
export type FichaWoo = ProductoWoo & {
  codigo: string;
  imagenes: string[];
  categorias: { nombre: string; slug: string }[];
  resumen: string;
  descripcion: string;
  variaciones: VariacionWoo[];
};

// Ficha de un producto. Devuelve null si no existe o no está publicado (borrador, privado, etc.).
export async function productoWoo(config: ConfigWoo, id: number): Promise<FichaWoo | null> {
  let datos: unknown;
  try {
    ({ datos } = await pedirWoo(config, `products/${id}`, {}));
  } catch (error) {
    if (error instanceof ErrorWoo && error.estado === 404) return null;
    throw error;
  }
  if (!datos || typeof datos !== "object" || Array.isArray(datos)) throw new ErrorWoo("La tienda no respondió como una API de WooCommerce.");
  const p = datos as Record<string, unknown>;
  if (p.status !== "publish") return null;

  let variaciones: VariacionWoo[] = [];
  if (p.type === "variable") {
    const { datos: lista } = await pedirLista(config, `products/${id}/variations`, {
      per_page: "100",
      status: "publish",
      _fields: "id,attributes,price,regular_price,sale_price,on_sale,stock_status,menu_order",
    });
    variaciones = lista
      .sort((a, b) => numero(a.menu_order) - numero(b.menu_order))
      .map((v) => ({
        id: numero(v.id),
        nombre: (Array.isArray(v.attributes) ? v.attributes : [])
          .map((a) => texto((a as { option?: unknown }).option))
          .filter(Boolean)
          .join(" · "),
        ...precios(v),
      }));
  }

  return {
    ...aProducto(p),
    codigo: texto(p.sku),
    imagenes: (Array.isArray(p.images) ? p.images : []).map(imagenDe).filter((src): src is string => src !== null),
    categorias: (Array.isArray(p.categories) ? p.categories : []).map((c) => ({
      nombre: texto((c as { name?: unknown }).name),
      slug: texto((c as { slug?: unknown }).slug),
    })),
    resumen: typeof p.short_description === "string" ? textoDeHtml(p.short_description) : "",
    descripcion: typeof p.description === "string" ? textoDeHtml(p.description) : "",
    variaciones,
  };
}
