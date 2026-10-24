import { slugificar } from "@/lib/texto";

// Categoría tal como la devuelve la API REST de WooCommerce (/wp-json/wc/v3/products/categories).
export type CategoriaWoo = {
  id: number;
  name: string;
  slug: string;
  parent: number;
  description?: string;
  menu_order?: number;
  count?: number;
  image?: { src?: string } | null;
};

// Categoría lista para importar como rubro. CRV4 tiene solo dos niveles: lo que en la
// tienda está más abajo queda como subrubro de su categoría principal.
export type CategoriaImportable = {
  wooId: number;
  nombre: string;
  slug: string;
  descripcion: string | null;
  orden: number;
  imagen: string | null;
  productos: number;
  // Categoría principal de la tienda a la que pertenece (null si es principal).
  principalWooId: number | null;
  // Nombre del padre directo cuando no es la principal (estaba en un tercer nivel o más).
  dentroDe: string | null;
};

const ENTIDADES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };

// WordPress devuelve los nombres con entidades HTML ("Plata &amp; Acero").
export function decodificarHtml(texto: string): string {
  return texto.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (entera, codigo: string) => {
    if (codigo[0] === "#") {
      const n = codigo[1]?.toLowerCase() === "x" ? parseInt(codigo.slice(2), 16) : parseInt(codigo.slice(1), 10);
      return Number.isFinite(n) && n > 0 && n < 0x110000 ? String.fromCodePoint(n) : entera;
    }
    return ENTIDADES[codigo.toLowerCase()] ?? entera;
  });
}

function textoPlano(html: string | undefined): string | null {
  const limpio = decodificarHtml((html ?? "").replace(/<[^>]*>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
  return limpio === "" ? null : limpio;
}

// "tienda.com/", "https://tienda.com/shop" -> "https://tienda.com/shop". Solo https.
export function normalizarTienda(texto: string): string | null {
  const conProtocolo = /^[a-z]+:\/\//i.test(texto.trim()) ? texto.trim() : `https://${texto.trim()}`;
  let url: URL;
  try {
    url = new URL(conProtocolo);
  } catch {
    return null;
  }
  if (url.protocol !== "https:" || !url.hostname.includes(".") || url.username || url.password) return null;
  return `${url.origin}${url.pathname.replace(/\/+$/, "")}`;
}

// Arma la lista en el orden del catálogo: cada principal seguida de sus subcategorías.
export function prepararCategorias(categorias: CategoriaWoo[]): CategoriaImportable[] {
  const porId = new Map(categorias.map((c) => [c.id, c]));
  const orden = (a: CategoriaWoo, b: CategoriaWoo) =>
    (a.menu_order ?? 0) - (b.menu_order ?? 0) || a.name.localeCompare(b.name, "es");

  // Sube por los padres hasta la principal; un padre que falta o un ciclo la vuelven principal.
  const principalDe = (c: CategoriaWoo): CategoriaWoo => {
    let actual = c;
    const vistos = new Set([c.id]);
    while (actual.parent) {
      const padre = porId.get(actual.parent);
      if (!padre || vistos.has(padre.id)) break;
      vistos.add(padre.id);
      actual = padre;
    }
    return actual;
  };

  const convertir = (c: CategoriaWoo, principal: CategoriaWoo | null): CategoriaImportable => ({
    wooId: c.id,
    nombre: decodificarHtml(c.name).trim().slice(0, 100),
    slug: slugificar(decodificarSlug(c.slug) || decodificarHtml(c.name)),
    descripcion: textoPlano(c.description),
    orden: Math.max(0, Math.min(9999, Math.trunc(c.menu_order ?? 0))),
    imagen: c.image?.src && /^https?:\/\//i.test(c.image.src) ? c.image.src : null,
    productos: c.count ?? 0,
    principalWooId: principal?.id ?? null,
    dentroDe: principal && c.parent !== principal.id ? decodificarHtml(porId.get(c.parent)?.name ?? "") || null : null,
  });

  const grupos = new Map<number, CategoriaWoo[]>();
  for (const c of categorias) {
    const principal = principalDe(c);
    if (principal.id === c.id) continue;
    grupos.set(principal.id, [...(grupos.get(principal.id) ?? []), c]);
  }

  return categorias
    .filter((c) => principalDe(c).id === c.id)
    .sort(orden)
    .flatMap((p) => [convertir(p, null), ...(grupos.get(p.id) ?? []).sort(orden).map((s) => convertir(s, p))]);
}

function decodificarSlug(slug: string): string {
  try {
    return decodeURIComponent(slug);
  } catch {
    return slug;
  }
}
