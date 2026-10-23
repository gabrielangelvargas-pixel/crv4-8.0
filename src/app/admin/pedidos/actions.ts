"use server";

import { and, count, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { clientes, movimientosStock, pedidoItems, pedidos, productos, variantes } from "@/db/schema";
import { requerirPermiso } from "@/lib/auth/dal";
import { tienePermiso } from "@/lib/auth/permisos";
import { clienteConTelefono } from "@/lib/gestion/clientes";
import {
  buscarClientesParaVenta,
  buscarVariantesParaVenta,
  moverStockDePedido,
  siguienteNumero,
} from "@/lib/gestion/pedidos";
import { leerDecimal } from "@/lib/numeros";
import { calcularTotales, estadosSiguientes, type EstadoPedido } from "@/lib/pedidos";
import { normalizarTelefono, textoOpcional } from "@/lib/texto";

export type EstadoFormulario = { error?: string } | undefined;

export type ResultadoVariante = {
  id: number;
  descripcion: string;
  codigo: string;
  precio: string;
  precioLista: string;
  stock: string;
  disponible: string;
};

export async function buscarVariantes(texto: string): Promise<ResultadoVariante[]> {
  await requerirPermiso("pedidos", "crear");
  const filas = await buscarVariantesParaVenta(texto);
  return filas.map((v) => ({
    id: v.id,
    descripcion: v.tipoVariante === "ninguna" ? v.producto : `${v.producto} · ${v.valor}`,
    codigo: v.codigo,
    precio: v.precioOferta ?? v.precioVenta,
    precioLista: v.precioVenta,
    stock: v.stock,
    disponible: (Number(v.stock) - Number(v.comprometido)).toFixed(3),
  }));
}

export async function buscarClientes(texto: string) {
  await requerirPermiso("pedidos", "crear");
  return buscarClientesParaVenta(texto);
}

const itemRecibido = z.object({ varianteId: z.number().int().positive(), cantidad: z.string() });

// Venta en el local: queda entregada al instante y descuenta el stock. Los precios
// se toman de la base, nunca del navegador.
export async function crearVentaPresencial(_prev: EstadoFormulario, form: FormData): Promise<EstadoFormulario> {
  const usuario = await requerirPermiso("pedidos", "crear");

  let crudo: unknown;
  try {
    crudo = JSON.parse(String(form.get("items") ?? "[]"));
  } catch {
    return { error: "No se pudieron leer los productos" };
  }
  const lista = z.array(itemRecibido).safeParse(crudo);
  if (!lista.success || lista.data.length === 0) return { error: "Agrega al menos un producto" };

  const cantidades = new Map<number, string>();
  for (const item of lista.data) {
    const cantidad = leerDecimal(item.cantidad, 3);
    if (cantidad === null || Number(cantidad) <= 0) return { error: "Revisa las cantidades: tienen que ser mayores que cero" };
    const previa = cantidades.get(item.varianteId);
    cantidades.set(item.varianteId, previa ? (Number(previa) + Number(cantidad)).toFixed(3) : cantidad);
  }

  const adicional = textoOpcional(form.get("adicional")) ? leerDecimal(String(form.get("adicional"))) : "0.00";
  if (adicional === null) return { error: "El importe adicional no es válido" };
  const adicionalDetalle = textoOpcional(form.get("adicionalDetalle"));
  if (adicionalDetalle && adicionalDetalle.length > 100) return { error: "El detalle del adicional es muy largo" };
  const notasInternas = textoOpcional(form.get("notasInternas"));

  // Cliente: uno existente o uno nuevo con nombre y teléfono.
  let clienteId = Number(form.get("clienteId"));
  let nuevoCliente: { nombre: string; telefono: string } | null = null;
  if (form.get("clienteNuevo") === "1") {
    if (!tienePermiso(usuario, "clientes", "crear")) return { error: "Tu rol no puede dar de alta clientes" };
    const nombre = String(form.get("nuevoNombre") ?? "").trim();
    const telefono = normalizarTelefono(String(form.get("nuevoTelefono") ?? ""));
    if (nombre.length < 2 || nombre.length > 150) return { error: "Escribe el nombre del cliente nuevo" };
    if (!telefono) return { error: "El teléfono del cliente nuevo no es válido" };
    const otro = await clienteConTelefono(telefono);
    if (otro) return { error: `Ya existe un cliente con ese teléfono: ${otro.nombre}. Búscalo en vez de crearlo.` };
    nuevoCliente = { nombre, telefono };
  } else {
    const [cliente] = Number.isInteger(clienteId)
      ? await db.select({ id: clientes.id }).from(clientes).where(and(eq(clientes.id, clienteId), eq(clientes.activo, true)))
      : [];
    if (!cliente) return { error: "Elige un cliente" };
  }

  const filas = await db
    .select({
      id: variantes.id,
      producto: productos.nombre,
      tipoVariante: productos.tipoVariante,
      valor: variantes.valor,
      precioVenta: variantes.precioVenta,
      precioOferta: variantes.precioOferta,
      precioCosto: variantes.precioCosto,
      activo: variantes.activo,
      productoActivo: productos.activo,
    })
    .from(variantes)
    .innerJoin(productos, eq(productos.id, variantes.productoId))
    .where(inArray(variantes.id, [...cantidades.keys()]));
  if (filas.length !== cantidades.size || filas.some((f) => !f.activo || !f.productoActivo)) {
    return { error: "Uno de los productos ya no está activo. Quítalo y vuelve a buscarlo." };
  }

  const items = filas.map((f) => ({
    varianteId: f.id,
    descripcion: (f.tipoVariante === "ninguna" ? f.producto : `${f.producto} · ${f.valor}`).slice(0, 250),
    cantidad: cantidades.get(f.id)!,
    precioUnitario: f.precioOferta ?? f.precioVenta,
    precioCosto: f.precioCosto,
  }));
  const totales = calcularTotales(items, adicional);

  const id = await db.transaction(async (tx) => {
    if (nuevoCliente) {
      const [creado] = await tx.insert(clientes).values({ ...nuevoCliente, origen: "presencial" }).$returningId();
      clienteId = creado.id;
    }
    const numero = await siguienteNumero(tx);
    const [pedido] = await tx
      .insert(pedidos)
      .values({
        numero,
        canal: "presencial",
        clienteId,
        tipoEntrega: "retiro",
        estado: "entregado",
        subtotal: totales.subtotal,
        subtotalCosto: totales.subtotalCosto,
        adicional,
        adicionalDetalle,
        total: totales.total,
        notasInternas,
        atendidoPor: usuario.id,
      })
      .$returningId();
    await tx.insert(pedidoItems).values(totales.items.map((item) => ({ ...item, pedidoId: pedido.id })));
    await moverStockDePedido(tx, pedido.id, usuario.id, -1);
    return pedido.id;
  });

  revalidatePath("/admin/pedidos");
  revalidatePath("/admin/stock");
  redirect(`/admin/pedidos/${id}?nueva=1`);
}

export async function cambiarEstado(id: number, nuevo: EstadoPedido): Promise<void> {
  const usuario = await requerirPermiso("pedidos", "editar");

  const resultado = await db.transaction(async (tx) => {
    const [pedido] = await tx
      .select({ estado: pedidos.estado, atendidoPor: pedidos.atendidoPor })
      .from(pedidos)
      .where(eq(pedidos.id, id))
      .for("update");
    if (!pedido || !estadosSiguientes(pedido.estado).includes(nuevo)) return "invalido";
    // Anular una entrega devuelve el stock: es como borrar una venta.
    const anulaEntrega = pedido.estado === "entregado";
    if (anulaEntrega && !tienePermiso(usuario, "pedidos", "eliminar")) return "sin-permiso";

    if (nuevo === "entregado") await moverStockDePedido(tx, id, usuario.id, -1);
    if (anulaEntrega) await moverStockDePedido(tx, id, usuario.id, 1);
    await tx
      .update(pedidos)
      .set({ estado: nuevo, atendidoPor: pedido.atendidoPor ?? usuario.id })
      .where(eq(pedidos.id, id));
    return "ok";
  });

  revalidatePath("/admin/pedidos");
  revalidatePath("/admin/stock");
  redirect(resultado === "ok" ? `/admin/pedidos/${id}` : `/admin/pedidos/${id}?error=${resultado}`);
}

export async function guardarDatosPedido(id: number, _prev: EstadoFormulario, form: FormData): Promise<EstadoFormulario> {
  await requerirPermiso("pedidos", "editar");
  const [pedido] = await db.select().from(pedidos).where(eq(pedidos.id, id)).limit(1);
  if (!pedido) return { error: "El pedido no existe" };

  const notasInternas = textoOpcional(form.get("notasInternas"));
  const cambios: Partial<typeof pedidos.$inferInsert> = { notasInternas };
  // El adicional solo se cambia mientras el pedido sigue abierto.
  if (pedido.estado !== "entregado" && pedido.estado !== "cancelado") {
    const adicional = textoOpcional(form.get("adicional")) ? leerDecimal(String(form.get("adicional"))) : "0.00";
    if (adicional === null) return { error: "El importe adicional no es válido" };
    const adicionalDetalle = textoOpcional(form.get("adicionalDetalle"));
    if (adicionalDetalle && adicionalDetalle.length > 100) return { error: "El detalle del adicional es muy largo" };
    cambios.adicional = adicional;
    cambios.adicionalDetalle = adicionalDetalle;
    cambios.total = ((Math.round(Number(pedido.subtotal) * 100) + Math.round(Number(adicional) * 100)) / 100).toFixed(2);
  }
  await db.update(pedidos).set(cambios).where(eq(pedidos.id, id));
  revalidatePath(`/admin/pedidos/${id}`);
  redirect(`/admin/pedidos/${id}?guardado=1`);
}

// Solo se borra un pedido que nunca movió stock; si no, se cancela o se anula.
export async function eliminarPedido(id: number): Promise<void> {
  await requerirPermiso("pedidos", "eliminar");
  const [movimientos] = await db.select({ n: count() }).from(movimientosStock).where(eq(movimientosStock.pedidoId, id));
  if ((movimientos?.n ?? 0) > 0) redirect(`/admin/pedidos/${id}?error=con-stock`);
  await db.delete(pedidos).where(eq(pedidos.id, id));
  revalidatePath("/admin/pedidos");
  redirect("/admin/pedidos");
}
