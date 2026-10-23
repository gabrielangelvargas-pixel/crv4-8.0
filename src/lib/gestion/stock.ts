import "server-only";
import { and, asc, count, desc, eq, like, lte, or, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { movimientosStock, pedidos, productos, rubros, usuarios, variantes } from "@/db/schema";

export const VARIANTES_POR_PAGINA = 50;

export type FiltroStock = { busqueda?: string; rubroId?: number; sinStock?: boolean; pagina?: number };

function condicionFiltro({ busqueda, rubroId, sinStock }: FiltroStock): SQL | undefined {
  const condiciones: SQL[] = [];
  const texto = busqueda?.trim();
  if (texto) {
    condiciones.push(
      or(
        like(productos.nombre, `%${texto}%`),
        like(variantes.valor, `%${texto}%`),
        like(variantes.codigo, `${texto}%`),
        like(variantes.codigoProveedor, `${texto}%`),
      )!,
    );
  }
  if (rubroId) condiciones.push(or(eq(productos.rubroId, rubroId), eq(rubros.rubroPadreId, rubroId))!);
  if (sinStock) condiciones.push(lte(variantes.stockActual, "0"));
  return condiciones.length ? and(...condiciones) : undefined;
}

export async function listarStock(filtro: FiltroStock) {
  const pagina = Math.max(1, filtro.pagina ?? 1);
  const where = condicionFiltro(filtro);
  const filas = await db
    .select({
      id: variantes.id,
      producto: productos.nombre,
      productoId: productos.id,
      tipoVariante: productos.tipoVariante,
      valor: variantes.valor,
      codigo: variantes.codigo,
      stock: variantes.stockActual,
      activo: variantes.activo,
      productoActivo: productos.activo,
    })
    .from(variantes)
    .innerJoin(productos, eq(productos.id, variantes.productoId))
    .innerJoin(rubros, eq(rubros.id, productos.rubroId))
    .where(where)
    .orderBy(asc(productos.nombre), asc(variantes.orden), asc(variantes.id))
    .limit(VARIANTES_POR_PAGINA)
    .offset((pagina - 1) * VARIANTES_POR_PAGINA);

  const [total] = await db
    .select({ n: count() })
    .from(variantes)
    .innerJoin(productos, eq(productos.id, variantes.productoId))
    .innerJoin(rubros, eq(rubros.id, productos.rubroId))
    .where(where);

  return { filas, total: total?.n ?? 0, pagina };
}

// Para el lector de código de barras: un código exacto lleva directo a la variante.
export async function varianteConCodigo(codigo: string): Promise<number | null> {
  const [fila] = await db
    .select({ id: variantes.id })
    .from(variantes)
    .where(eq(variantes.codigo, codigo.trim().toUpperCase()))
    .limit(1);
  return fila?.id ?? null;
}

export async function obtenerVarianteStock(id: number) {
  const [fila] = await db
    .select({
      id: variantes.id,
      producto: productos.nombre,
      productoId: productos.id,
      tipoVariante: productos.tipoVariante,
      valor: variantes.valor,
      codigo: variantes.codigo,
      stock: variantes.stockActual,
      activo: variantes.activo,
    })
    .from(variantes)
    .innerJoin(productos, eq(productos.id, variantes.productoId))
    .where(eq(variantes.id, id))
    .limit(1);
  return fila ?? null;
}

export async function movimientosDeVariante(id: number, limite = 100) {
  return db
    .select({
      id: movimientosStock.id,
      tipo: movimientosStock.tipo,
      cantidad: movimientosStock.cantidad,
      stockAnterior: movimientosStock.stockAnterior,
      stockNuevo: movimientosStock.stockNuevo,
      pedidoId: movimientosStock.pedidoId,
      motivo: movimientosStock.motivo,
      fecha: movimientosStock.fecha,
      pedidoNumero: pedidos.numero,
      usuario: usuarios.nombre,
    })
    .from(movimientosStock)
    .innerJoin(usuarios, eq(usuarios.id, movimientosStock.usuarioId))
    .leftJoin(pedidos, eq(pedidos.id, movimientosStock.pedidoId))
    .where(eq(movimientosStock.varianteId, id))
    .orderBy(desc(movimientosStock.fecha), desc(movimientosStock.id))
    .limit(limite);
}
