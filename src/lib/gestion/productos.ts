import "server-only";
import { and, asc, count, eq, exists, inArray, like, or, sql, type SQL } from "drizzle-orm";
import { alias } from "drizzle-orm/mysql-core";
import { db } from "@/db";
import { movimientosStock, pedidoItems, productos, proveedores, rubros, variantes } from "@/db/schema";

export type Producto = typeof productos.$inferSelect;
export type Variante = typeof variantes.$inferSelect;
export type ProductoConVariantes = Producto & { variantes: Variante[] };

export const PRODUCTOS_POR_PAGINA = 50;

export type FiltroProductos = { busqueda?: string; rubroId?: number; pagina?: number };

const padre = alias(rubros, "rubro_padre");

function condicionFiltro({ busqueda, rubroId }: FiltroProductos): SQL | undefined {
  const condiciones: SQL[] = [];
  const texto = busqueda?.trim();
  if (texto) {
    const coincideVariante = db
      .select({ id: variantes.id })
      .from(variantes)
      .where(
        and(
          eq(variantes.productoId, productos.id),
          or(like(variantes.codigo, `${texto}%`), like(variantes.codigoProveedor, `${texto}%`)),
        ),
      );
    condiciones.push(or(like(productos.nombre, `%${texto}%`), exists(coincideVariante))!);
  }
  // Un rubro principal incluye todos sus subrubros.
  if (rubroId) condiciones.push(or(eq(productos.rubroId, rubroId), eq(rubros.rubroPadreId, rubroId))!);
  return condiciones.length ? and(...condiciones) : undefined;
}

export async function listarProductos(filtro: FiltroProductos) {
  const pagina = Math.max(1, filtro.pagina ?? 1);
  const where = condicionFiltro(filtro);

  const filas = await db
    .select({
      id: productos.id,
      nombre: productos.nombre,
      activo: productos.activo,
      visibleWeb: productos.visibleWeb,
      destacado: productos.destacado,
      rubro: rubros.nombre,
      rubroPadre: padre.nombre,
      variantes: sql<number>`(select count(*) from ${variantes} where ${variantes.productoId} = ${productos.id})`,
      stock: sql<string>`(select coalesce(sum(${variantes.stockActual}), 0) from ${variantes} where ${variantes.productoId} = ${productos.id})`,
      codigo: sql<string | null>`(select ${variantes.codigo} from ${variantes} where ${variantes.productoId} = ${productos.id} order by ${variantes.esPrincipal} desc, ${variantes.orden}, ${variantes.id} limit 1)`,
      precioVenta: sql<string | null>`(select ${variantes.precioVenta} from ${variantes} where ${variantes.productoId} = ${productos.id} order by ${variantes.esPrincipal} desc, ${variantes.orden}, ${variantes.id} limit 1)`,
    })
    .from(productos)
    .innerJoin(rubros, eq(rubros.id, productos.rubroId))
    .leftJoin(padre, eq(padre.id, rubros.rubroPadreId))
    .where(where)
    .orderBy(asc(productos.nombre))
    .limit(PRODUCTOS_POR_PAGINA)
    .offset((pagina - 1) * PRODUCTOS_POR_PAGINA);

  const [total] = await db
    .select({ n: count() })
    .from(productos)
    .innerJoin(rubros, eq(rubros.id, productos.rubroId))
    .where(where);

  return { filas, total: total?.n ?? 0, pagina };
}

export async function obtenerProducto(id: number): Promise<ProductoConVariantes | null> {
  const [producto] = await db.select().from(productos).where(eq(productos.id, id)).limit(1);
  if (!producto) return null;
  const lista = await db
    .select()
    .from(variantes)
    .where(eq(variantes.productoId, id))
    .orderBy(asc(variantes.orden), asc(variantes.id));
  return { ...producto, variantes: lista };
}

// Códigos que ya usa otra variante (de este u otro producto), para avisar antes de guardar.
export async function codigosEnUso(codigos: string[], exceptoVariantes: number[] = []): Promise<string[]> {
  if (codigos.length === 0) return [];
  const filas = await db
    .select({ id: variantes.id, codigo: variantes.codigo })
    .from(variantes)
    .where(inArray(variantes.codigo, codigos));
  return filas.filter((f) => !exceptoVariantes.includes(f.id)).map((f) => f.codigo);
}

// Variantes que ya aparecen en pedidos o en el historial de stock: no se pueden borrar.
export async function variantesConHistorial(ids: number[]): Promise<number[]> {
  if (ids.length === 0) return [];
  const [enPedidos, enMovimientos] = await Promise.all([
    db.selectDistinct({ id: pedidoItems.varianteId }).from(pedidoItems).where(inArray(pedidoItems.varianteId, ids)),
    db
      .selectDistinct({ id: movimientosStock.varianteId })
      .from(movimientosStock)
      .where(inArray(movimientosStock.varianteId, ids)),
  ]);
  return [...new Set([...enPedidos, ...enMovimientos].map((f) => f.id))];
}

export async function opcionesProveedor() {
  return db
    .select({ id: proveedores.id, nombre: proveedores.nombre, activo: proveedores.activo })
    .from(proveedores)
    .orderBy(asc(proveedores.nombre));
}
