import "server-only";
import { and, asc, count, desc, eq, inArray, isNull, like, or, sql, type SQL } from "drizzle-orm";
import { alias } from "drizzle-orm/mysql-core";
import { ordenPorRubro as ordenRubros } from "@/lib/orden-rubros";
import { db } from "@/db";
import { pedidoItems, pedidos, productos, rubros, variantes } from "@/db/schema";
import { ESTADOS_QUE_COMPROMETEN } from "@/lib/pedidos";

// Catálogo público: solo lo activo y visible en la web, y del stock solo se dice
// si hay o no (disponible = stock − lo comprometido en pedidos sin entregar).

export const PRODUCTOS_POR_PAGINA_WEB = 24;

const padre = alias(rubros, "rubro_padre");
const ordenPorRubro = ordenRubros(padre);

const estados = sql.join(
  ESTADOS_QUE_COMPROMETEN.map((e) => sql`${e}`),
  sql`, `,
);

// Con alias explícitos: drizzle no califica las columnas dentro de un `sql`.
const comprometidoDe = (varianteId: SQL) => sql`(select coalesce(sum(pi.cantidad), 0) from ${pedidoItems} pi
  inner join ${pedidos} pe on pe.id = pi.pedido_id
  where pi.variante_id = ${varianteId} and pe.estado in (${estados}))`;

const hayDisponible = sql<number>`exists (select 1 from ${variantes} v
  where v.producto_id = ${productos.id} and v.activo = true
  and v.stock_actual - ${comprometidoDe(sql`v.id`)} > 0)`;

const principal = (columna: string) =>
  sql.raw(`(select v.${columna} from variantes v where v.producto_id = productos.id and v.activo = true
    order by v.es_principal desc, v.orden, v.id limit 1)`);

// Foto de la tarjeta: la de la variante principal (o la vieja del producto, que es la de la
// principal); si no tiene, la primera variante activa con foto.
const fotoPrincipal = sql<string | null>`coalesce(${principal("imagen")}, ${productos.imagen}, ${sql.raw(`(select v.imagen from variantes v
  where v.producto_id = productos.id and v.activo = true and v.imagen is not null order by v.orden, v.id limit 1)`)})`;

// Un rubro se ve si está activo y visible, y su rubro principal también.
const rubroVisible = and(
  eq(rubros.activo, true),
  eq(rubros.visibleWeb, true),
  or(isNull(rubros.rubroPadreId), and(eq(padre.activo, true), eq(padre.visibleWeb, true))),
)!;

const productoVisible = and(
  eq(productos.activo, true),
  eq(productos.visibleWeb, true),
  rubroVisible,
  sql`exists (select 1 from ${variantes} v where v.producto_id = ${productos.id} and v.activo = true)`,
)!;

export type RubroWeb = {
  id: number;
  nombre: string;
  slug: string;
  imagen: string | null;
  actualizadoEn: Date;
  // Sin productos a la vista (propios ni de sus subrubros): se muestra como "Muy pronto".
  vacio: boolean;
  subrubros: { id: number; nombre: string; slug: string; vacio: boolean }[];
};

// Rubros principales visibles con sus subrubros, marcando los que todavía no tienen productos a la vista.
export async function rubrosWeb(): Promise<RubroWeb[]> {
  const filas = await db
    .select({
      id: rubros.id,
      nombre: rubros.nombre,
      slug: rubros.slug,
      imagen: rubros.imagen,
      actualizadoEn: rubros.actualizadoEn,
      padreId: rubros.rubroPadreId,
    })
    .from(rubros)
    .leftJoin(padre, eq(padre.id, rubros.rubroPadreId))
    .where(rubroVisible)
    .orderBy(asc(rubros.orden), asc(rubros.nombre));
  const conProductos = new Set(
    (
      await db
        .selectDistinct({ id: productos.rubroId })
        .from(productos)
        .innerJoin(rubros, eq(rubros.id, productos.rubroId))
        .leftJoin(padre, eq(padre.id, rubros.rubroPadreId))
        .where(productoVisible)
    ).map((f) => f.id),
  );
  return filas
    .filter((r) => r.padreId === null)
    .map((r) => {
      const subrubros = filas
        .filter((s) => s.padreId === r.id)
        .map((s) => ({ id: s.id, nombre: s.nombre, slug: s.slug, vacio: !conProductos.has(s.id) }));
      return {
        id: r.id,
        nombre: r.nombre,
        slug: r.slug,
        imagen: r.imagen,
        actualizadoEn: r.actualizadoEn,
        vacio: !conProductos.has(r.id) && subrubros.every((s) => s.vacio),
        subrubros,
      };
    });
}

// Suma una visita al rubro cuando alguien abre el catálogo filtrado por él.
export async function registrarVisitaRubro(id: number): Promise<void> {
  // Sin tocar actualizado_en, que versiona la dirección de la foto.
  await db.update(rubros).set({ visitas: sql`${rubros.visitas} + 1`, actualizadoEn: sql`${rubros.actualizadoEn}` }).where(eq(rubros.id, id));
}

export type RubroDestacado = { id: number; nombre: string; slug: string; imagen: string | null; actualizadoEn: Date; visitas: number };

// Los rubros (principales o subrubros) con productos a la vista más visitados; a igual
// cantidad de visitas, en el orden del catálogo.
export async function rubrosMasVisitados(cantidad = 4): Promise<RubroDestacado[]> {
  const conProductos = new Set(
    (await rubrosWeb()).flatMap((r) => [r, ...r.subrubros]).filter((r) => !r.vacio).map((r) => r.id),
  );
  const filas = await db
    .select({
      id: rubros.id,
      nombre: rubros.nombre,
      slug: rubros.slug,
      imagen: rubros.imagen,
      actualizadoEn: rubros.actualizadoEn,
      visitas: rubros.visitas,
    })
    .from(rubros)
    .leftJoin(padre, eq(padre.id, rubros.rubroPadreId))
    .where(rubroVisible)
    .orderBy(desc(rubros.visitas), asc(rubros.orden), asc(rubros.nombre));
  return filas.filter((r) => conProductos.has(r.id)).slice(0, cantidad);
}

export type FiltroCatalogo = { busqueda?: string; rubro?: RubroWeb | RubroWeb["subrubros"][number]; pagina?: number; destacados?: boolean };

export async function listarCatalogo(filtro: FiltroCatalogo) {
  const pagina = Math.max(1, filtro.pagina ?? 1);
  const condiciones: SQL[] = [productoVisible];
  const texto = filtro.busqueda?.trim();
  if (texto) {
    condiciones.push(
      or(
        like(productos.nombre, `%${texto}%`),
        sql`exists (select 1 from ${variantes} v where v.producto_id = ${productos.id} and v.activo = true and v.codigo like ${`${texto}%`})`,
      )!,
    );
  }
  if (filtro.rubro) condiciones.push(or(eq(productos.rubroId, filtro.rubro.id), eq(rubros.rubroPadreId, filtro.rubro.id))!);
  if (filtro.destacados) condiciones.push(eq(productos.destacado, true));
  const where = and(...condiciones);

  const filas = await db
    .select({
      id: productos.id,
      nombre: productos.nombre,
      imagen: fotoPrincipal,
      actualizadoEn: productos.actualizadoEn,
      rubro: rubros.nombre,
      precioVenta: sql<string>`${principal("precio_venta")}`,
      precioOferta: sql<string | null>`${principal("precio_oferta")}`,
      variantes: sql<number>`(select count(*) from ${variantes} v where v.producto_id = ${productos.id} and v.activo = true)`,
      disponible: hayDisponible,
    })
    .from(productos)
    .innerJoin(rubros, eq(rubros.id, productos.rubroId))
    .leftJoin(padre, eq(padre.id, rubros.rubroPadreId))
    .where(where)
    .orderBy(...ordenPorRubro, asc(principal("codigo")), asc(productos.id))
    .limit(PRODUCTOS_POR_PAGINA_WEB)
    .offset((pagina - 1) * PRODUCTOS_POR_PAGINA_WEB);

  const [total] = await db
    .select({ n: count() })
    .from(productos)
    .innerJoin(rubros, eq(rubros.id, productos.rubroId))
    .leftJoin(padre, eq(padre.id, rubros.rubroPadreId))
    .where(where);

  return { filas: filas.map((f) => ({ ...f, disponible: Boolean(Number(f.disponible)) })), total: total?.n ?? 0, pagina };
}

export async function obtenerProductoWeb(id: number) {
  const [producto] = await db
    .select({
      id: productos.id,
      nombre: productos.nombre,
      descripcion: productos.descripcion,
      imagen: fotoPrincipal,
      actualizadoEn: productos.actualizadoEn,
      tipoVariante: productos.tipoVariante,
      rubro: { nombre: rubros.nombre, slug: rubros.slug },
      rubroPadre: { nombre: padre.nombre, slug: padre.slug },
    })
    .from(productos)
    .innerJoin(rubros, eq(rubros.id, productos.rubroId))
    .leftJoin(padre, eq(padre.id, rubros.rubroPadreId))
    .where(and(eq(productos.id, id), productoVisible))
    .limit(1);
  if (!producto) return null;

  const lista = await db
    .select({
      id: variantes.id,
      valor: variantes.valor,
      codigo: variantes.codigo,
      imagen: variantes.imagen,
      precioVenta: variantes.precioVenta,
      precioOferta: variantes.precioOferta,
      disponible: sql<string>`${variantes.stockActual} - ${comprometidoDe(sql`${variantes}.${sql.identifier("id")}`)}`,
    })
    .from(variantes)
    .where(and(eq(variantes.productoId, id), eq(variantes.activo, true)))
    .orderBy(sql`${variantes.esPrincipal} desc`, asc(variantes.orden), asc(variantes.id));

  return { ...producto, variantes: lista.map((v) => ({ ...v, disponible: Number(v.disponible) > 0 })) };
}

// Variantes del carrito que se pueden pedir (activas y de productos a la vista), con los
// precios de la base. El costo solo se usa al registrar el pedido, nunca va al navegador.
export async function variantesParaPedido(ids: number[]) {
  if (ids.length === 0) return [];
  const filas = await db
    .select({
      varianteId: variantes.id,
      productoId: productos.id,
      producto: productos.nombre,
      tipoVariante: productos.tipoVariante,
      valor: variantes.valor,
      codigo: variantes.codigo,
      imagen: sql<string | null>`coalesce(${variantes.imagen}, ${fotoPrincipal})`,
      actualizadoEn: productos.actualizadoEn,
      precioVenta: variantes.precioVenta,
      precioOferta: variantes.precioOferta,
      precioCosto: variantes.precioCosto,
      disponible: sql<string>`${variantes.stockActual} - ${comprometidoDe(sql`${variantes}.${sql.identifier("id")}`)}`,
    })
    .from(variantes)
    .innerJoin(productos, eq(productos.id, variantes.productoId))
    .innerJoin(rubros, eq(rubros.id, productos.rubroId))
    .leftJoin(padre, eq(padre.id, rubros.rubroPadreId))
    .where(and(inArray(variantes.id, ids), eq(variantes.activo, true), productoVisible));
  return filas.map((f) => ({
    ...f,
    variante: f.tipoVariante === "ninguna" ? null : f.valor,
    disponible: Number(f.disponible) > 0,
  }));
}

// Precio que paga el cliente: la oferta si existe y es menor.
export function precioFinal(venta: string, oferta: string | null): { precio: string; anterior: string | null } {
  return oferta !== null && Number(oferta) > 0 && Number(oferta) < Number(venta)
    ? { precio: oferta, anterior: venta }
    : { precio: venta, anterior: null };
}
