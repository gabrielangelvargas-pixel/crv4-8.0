import "server-only";
import { and, asc, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { pedidoItems, pedidos } from "@/db/schema";

// Lo que el cliente ve de sus pedidos (sin costos ni notas internas).
export async function pedidosDelClienteWeb(clienteId: number) {
  return db
    .select({
      numero: pedidos.numero,
      creadoEn: pedidos.creadoEn,
      estado: pedidos.estado,
      total: pedidos.total,
      tipoEntrega: pedidos.tipoEntrega,
    })
    .from(pedidos)
    .where(eq(pedidos.clienteId, clienteId))
    .orderBy(desc(pedidos.numero))
    .limit(100);
}

export async function pedidoDelCliente(clienteId: number, numero: number) {
  const [pedido] = await db
    .select({
      id: pedidos.id,
      numero: pedidos.numero,
      creadoEn: pedidos.creadoEn,
      estado: pedidos.estado,
      tipoEntrega: pedidos.tipoEntrega,
      direccionTexto: pedidos.direccionTexto,
      subtotal: pedidos.subtotal,
      adicional: pedidos.adicional,
      adicionalDetalle: pedidos.adicionalDetalle,
      total: pedidos.total,
      notasCliente: pedidos.notasCliente,
    })
    .from(pedidos)
    .where(and(eq(pedidos.clienteId, clienteId), eq(pedidos.numero, numero)))
    .limit(1);
  if (!pedido) return null;
  const items = await db
    .select({
      id: pedidoItems.id,
      descripcion: pedidoItems.descripcion,
      cantidad: pedidoItems.cantidad,
      precioUnitario: pedidoItems.precioUnitario,
      subtotal: pedidoItems.subtotal,
    })
    .from(pedidoItems)
    .where(eq(pedidoItems.pedidoId, pedido.id))
    .orderBy(asc(pedidoItems.id));
  return { ...pedido, items };
}
