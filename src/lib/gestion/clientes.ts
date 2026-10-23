import "server-only";
import { and, asc, count, eq, inArray, like, ne, or, sql, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { clientes, direcciones, pedidos, usuarios } from "@/db/schema";

export type Cliente = typeof clientes.$inferSelect;
export type Direccion = typeof direcciones.$inferSelect;

export const CLIENTES_POR_PAGINA = 50;

const clienteId = sql`${clientes}.${sql.identifier("id")}`;

export async function listarClientes({ busqueda, pagina = 1 }: { busqueda?: string; pagina?: number }) {
  const texto = busqueda?.trim();
  const telefono = texto?.replace(/[\s\-().]/g, "");
  const where: SQL | undefined = texto
    ? or(
        like(clientes.nombre, `%${texto}%`),
        like(clientes.email, `%${texto}%`),
        telefono ? like(clientes.telefono, `%${telefono}%`) : undefined,
      )
    : undefined;
  const actual = Math.max(1, pagina);

  const filas = await db
    .select({
      id: clientes.id,
      nombre: clientes.nombre,
      telefono: clientes.telefono,
      email: clientes.email,
      origen: clientes.origen,
      activo: clientes.activo,
      // Sin joins Drizzle no antepone la tabla a las columnas: se califican a mano
      // para que la subconsulta no compare direcciones.id con su propio cliente_id.
      localidad: sql<string | null>`(select d.localidad from ${direcciones} d where d.cliente_id = ${clienteId} order by d.es_principal desc, d.id limit 1)`,
      conCuenta: sql<number>`exists(select 1 from ${usuarios} u where u.cliente_id = ${clienteId})`,
    })
    .from(clientes)
    .where(where)
    .orderBy(asc(clientes.nombre))
    .limit(CLIENTES_POR_PAGINA)
    .offset((actual - 1) * CLIENTES_POR_PAGINA);
  const [total] = await db.select({ n: count() }).from(clientes).where(where);
  return { filas, total: total?.n ?? 0, pagina: actual };
}

export async function obtenerCliente(id: number) {
  const [cliente] = await db.select().from(clientes).where(eq(clientes.id, id)).limit(1);
  if (!cliente) return null;
  const [lista, [cuenta]] = await Promise.all([
    db
      .select()
      .from(direcciones)
      .where(eq(direcciones.clienteId, id))
      .orderBy(sql`${direcciones.esPrincipal} desc`, asc(direcciones.id)),
    db.select({ nombreUsuario: usuarios.nombreUsuario }).from(usuarios).where(eq(usuarios.clienteId, id)).limit(1),
  ]);
  return { ...cliente, direcciones: lista, cuenta: cuenta?.nombreUsuario ?? null };
}

export async function clienteConTelefono(telefono: string, excepto?: number) {
  const condicion = excepto
    ? and(eq(clientes.telefono, telefono), ne(clientes.id, excepto))
    : eq(clientes.telefono, telefono);
  const [fila] = await db.select({ id: clientes.id, nombre: clientes.nombre }).from(clientes).where(condicion).limit(1);
  return fila ?? null;
}

export async function pedidosDelCliente(id: number): Promise<number> {
  const [fila] = await db.select({ n: count() }).from(pedidos).where(eq(pedidos.clienteId, id));
  return fila?.n ?? 0;
}

// Direcciones que ya figuran en algún pedido: no se pueden borrar.
export async function direccionesUsadas(ids: number[]): Promise<number[]> {
  if (ids.length === 0) return [];
  const filas = await db
    .selectDistinct({ id: pedidos.direccionId })
    .from(pedidos)
    .where(inArray(pedidos.direccionId, ids));
  return filas.map((f) => f.id).filter((id): id is number => id !== null);
}
