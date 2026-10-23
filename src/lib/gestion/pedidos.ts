import "server-only";
import { and, asc, count, desc, eq, inArray, like, or, sql, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { clientes, CONSUMIDOR_FINAL, movimientosStock, pedidoItems, pedidos, productos, usuarios, variantes } from "@/db/schema";
import { ESTADOS_QUE_COMPROMETEN, type EstadoPedido } from "@/lib/pedidos";

export const PEDIDOS_POR_PAGINA = 50;

export type VistaPedidos = "activos" | "entregados" | "cancelados" | "todos";

const ESTADOS_POR_VISTA: Record<VistaPedidos, EstadoPedido[] | null> = {
  activos: ["pendiente", "confirmado", "preparado", "listo_o_enviado"],
  entregados: ["entregado"],
  cancelados: ["cancelado"],
  todos: null,
};

export async function listarPedidos({
  vista,
  canal,
  busqueda,
  pagina = 1,
}: {
  vista: VistaPedidos;
  canal?: "web" | "presencial";
  busqueda?: string;
  pagina?: number;
}) {
  const condiciones: SQL[] = [];
  const estados = ESTADOS_POR_VISTA[vista];
  if (estados) condiciones.push(inArray(pedidos.estado, estados));
  if (canal) condiciones.push(eq(pedidos.canal, canal));
  const texto = busqueda?.trim();
  if (texto) {
    const numero = Number(texto.replace(/^#/, ""));
    condiciones.push(
      or(
        Number.isInteger(numero) && numero > 0 ? eq(pedidos.numero, numero) : undefined,
        like(clientes.nombre, `%${texto}%`),
        like(clientes.telefono, `%${texto.replace(/[\s\-().]/g, "")}%`),
      )!,
    );
  }
  const where = condiciones.length ? and(...condiciones) : undefined;
  const actual = Math.max(1, pagina);

  const filas = await db
    .select({
      id: pedidos.id,
      numero: pedidos.numero,
      canal: pedidos.canal,
      estado: pedidos.estado,
      tipoEntrega: pedidos.tipoEntrega,
      total: pedidos.total,
      fecha: pedidos.creadoEn,
      cliente: clientes.nombre,
    })
    .from(pedidos)
    .innerJoin(clientes, eq(clientes.id, pedidos.clienteId))
    .where(where)
    .orderBy(desc(pedidos.numero))
    .limit(PEDIDOS_POR_PAGINA)
    .offset((actual - 1) * PEDIDOS_POR_PAGINA);
  const [total] = await db
    .select({ n: count() })
    .from(pedidos)
    .innerJoin(clientes, eq(clientes.id, pedidos.clienteId))
    .where(where);
  return { filas, total: total?.n ?? 0, pagina: actual };
}

export async function obtenerPedido(id: number) {
  const [pedido] = await db
    .select({
      pedido: pedidos,
      cliente: { id: clientes.id, nombre: clientes.nombre, telefono: clientes.telefono, email: clientes.email },
      atendidoPor: usuarios.nombre,
    })
    .from(pedidos)
    .innerJoin(clientes, eq(clientes.id, pedidos.clienteId))
    .leftJoin(usuarios, eq(usuarios.id, pedidos.atendidoPor))
    .where(eq(pedidos.id, id))
    .limit(1);
  if (!pedido) return null;
  const items = await db
    .select({
      id: pedidoItems.id,
      varianteId: pedidoItems.varianteId,
      codigo: variantes.codigo,
      descripcion: pedidoItems.descripcion,
      cantidad: pedidoItems.cantidad,
      precioUnitario: pedidoItems.precioUnitario,
      precioCosto: pedidoItems.precioCosto,
      subtotal: pedidoItems.subtotal,
      subtotalCosto: pedidoItems.subtotalCosto,
    })
    .from(pedidoItems)
    .innerJoin(variantes, eq(variantes.id, pedidoItems.varianteId))
    .where(eq(pedidoItems.pedidoId, id))
    .orderBy(asc(pedidoItems.id));
  return { ...pedido.pedido, cliente: pedido.cliente, atendidoPorNombre: pedido.atendidoPor, items };
}

// Lo comprometido en pedidos confirmados que todavía no se entregaron.
const comprometido = sql<string>`(select coalesce(sum(pi.cantidad), 0) from ${pedidoItems} pi
  inner join ${pedidos} p on p.id = pi.pedido_id
  where pi.variante_id = ${variantes.id} and p.estado in (${sql.join(
    ESTADOS_QUE_COMPROMETEN.map((e) => sql`${e}`),
    sql`, `,
  )}))`;

// Para cargar una venta: un código exacto primero, después coincidencias por nombre.
export async function buscarVariantesParaVenta(texto: string) {
  const limpio = texto.trim();
  if (limpio.length < 2) return [];
  return db
    .select({
      id: variantes.id,
      producto: productos.nombre,
      tipoVariante: productos.tipoVariante,
      valor: variantes.valor,
      codigo: variantes.codigo,
      precioVenta: variantes.precioVenta,
      precioOferta: variantes.precioOferta,
      stock: variantes.stockActual,
      comprometido,
    })
    .from(variantes)
    .innerJoin(productos, eq(productos.id, variantes.productoId))
    .where(
      and(
        eq(variantes.activo, true),
        eq(productos.activo, true),
        or(like(productos.nombre, `%${limpio}%`), like(variantes.codigo, `${limpio}%`), like(variantes.valor, `%${limpio}%`)),
      ),
    )
    .orderBy(sql`${variantes.codigo} = ${limpio.toUpperCase()} desc`, asc(productos.nombre), asc(variantes.orden))
    .limit(15);
}

export async function buscarClientesParaVenta(texto: string) {
  const limpio = texto.trim();
  if (limpio.length < 2) return [];
  return db
    .select({ id: clientes.id, nombre: clientes.nombre, telefono: clientes.telefono })
    .from(clientes)
    .where(
      and(
        eq(clientes.activo, true),
        or(like(clientes.nombre, `%${limpio}%`), like(clientes.telefono, `%${limpio.replace(/[\s\-().]/g, "")}%`)),
      ),
    )
    .orderBy(asc(clientes.nombre))
    .limit(10);
}

type Transaccion = Parameters<Parameters<typeof db.transaction>[0]>[0];

// Mueve el stock de todos los renglones de un pedido: `signo` -1 al entregar,
// +1 al anular una entrega. Bloquea cada variante y deja el movimiento en el historial.
export async function moverStockDePedido(
  tx: Transaccion,
  pedidoId: number,
  usuarioId: number,
  signo: 1 | -1,
): Promise<void> {
  const items = await tx
    .select({ varianteId: pedidoItems.varianteId, cantidad: pedidoItems.cantidad })
    .from(pedidoItems)
    .where(eq(pedidoItems.pedidoId, pedidoId))
    .orderBy(asc(pedidoItems.varianteId));
  for (const item of items) {
    const [variante] = await tx
      .select({ stock: variantes.stockActual })
      .from(variantes)
      .where(eq(variantes.id, item.varianteId))
      .for("update");
    if (!variante) continue;
    const delta = Math.round(Number(item.cantidad) * 1000) * signo;
    const nuevo = ((Math.round(Number(variante.stock) * 1000) + delta) / 1000).toFixed(3);
    await tx.update(variantes).set({ stockActual: nuevo }).where(eq(variantes.id, item.varianteId));
    await tx.insert(movimientosStock).values({
      varianteId: item.varianteId,
      tipo: signo < 0 ? "entrega_pedido" : "devolucion",
      cantidad: (delta / 1000).toFixed(3),
      stockAnterior: variante.stock,
      stockNuevo: nuevo,
      pedidoId,
      usuarioId,
      motivo: null,
    });
  }
}

export async function siguienteNumero(tx: Transaccion): Promise<number> {
  const [fila] = await tx
    .select({ n: sql<number>`coalesce(max(${pedidos.numero}), 0) + 1` })
    .from(pedidos)
    .for("update");
  return Number(fila?.n ?? 1);
}

export async function consumidorFinal() {
  const [fila] = await db
    .select({ id: clientes.id, nombre: clientes.nombre, telefono: clientes.telefono })
    .from(clientes)
    .where(eq(clientes.nombre, CONSUMIDOR_FINAL))
    .limit(1);
  return fila ?? null;
}
