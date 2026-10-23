import "server-only";
import { asc, count, eq, like, or } from "drizzle-orm";
import { db } from "@/db";
import { productos, proveedores } from "@/db/schema";

export type Proveedor = typeof proveedores.$inferSelect;

export async function listarProveedores(busqueda?: string): Promise<Proveedor[]> {
  const texto = busqueda?.trim();
  const filtro = texto
    ? or(
        like(proveedores.nombre, `%${texto}%`),
        like(proveedores.nombreFantasia, `%${texto}%`),
        like(proveedores.contacto, `%${texto}%`),
      )
    : undefined;
  return db.select().from(proveedores).where(filtro).orderBy(asc(proveedores.nombre));
}

export async function obtenerProveedor(id: number): Promise<Proveedor | null> {
  const [proveedor] = await db.select().from(proveedores).where(eq(proveedores.id, id)).limit(1);
  return proveedor ?? null;
}

export async function productosDelProveedor(id: number): Promise<number> {
  const [fila] = await db.select({ n: count() }).from(productos).where(eq(productos.proveedorId, id));
  return fila?.n ?? 0;
}
