"use server";

import { and, eq, or } from "drizzle-orm";
import { redirect } from "next/navigation";
import { z } from "zod";
import { direccionRecibida, textoDireccion, type DireccionValidada } from "@/app/admin/clientes/datos";
import { db } from "@/db";
import { clientes, direcciones, pedidoItems, pedidos, roles, usuarios } from "@/db/schema";
import { usuarioActual } from "@/lib/auth/dal";
import { hashPassword } from "@/lib/auth/password";
import { crearSesion } from "@/lib/auth/session";
import { errorPassword } from "@/lib/auth/validacion";
import { precioFinal, variantesParaPedido } from "@/lib/catalogo";
import { leerRenglones, MAXIMO_RENGLONES } from "@/lib/checkout";
import { siguienteNumero } from "@/lib/gestion/pedidos";
import { urlImagen } from "@/lib/imagenes";
import { calcularTotales } from "@/lib/pedidos";
import { normalizarTelefono, textoOpcional } from "@/lib/texto";

export type RenglonVista = {
  varianteId: number;
  productoId: number;
  nombre: string;
  variante: string | null;
  codigo: string;
  imagen: string | null;
  precio: string;
  anterior: string | null;
  disponible: boolean;
};

// Lo que muestra el carrito: datos y precios actuales de la base. Las variantes que ya
// no se pueden pedir no vienen (el carrito las marca como no disponibles).
export async function consultarCarrito(ids: number[]): Promise<RenglonVista[]> {
  const validos = z.array(z.number().int().positive()).max(MAXIMO_RENGLONES).safeParse(ids);
  if (!validos.success) return [];
  const filas = await variantesParaPedido(validos.data);
  return filas.map((f) => ({
    varianteId: f.varianteId,
    productoId: f.productoId,
    nombre: f.producto,
    variante: f.variante,
    codigo: f.codigo,
    imagen: urlImagen(f.imagen, f.actualizadoEn),
    ...precioFinal(f.precioVenta, f.precioOferta),
    disponible: f.disponible,
  }));
}

export type EstadoCheckout = { error?: string; cuentaExistente?: boolean } | undefined;

function leerDireccion(form: FormData): { ok: true; direccion: DireccionValidada } | { ok: false; error: string } {
  const leida = direccionRecibida.safeParse({
    alias: "",
    calleNumero: String(form.get("calleNumero") ?? ""),
    barrio: String(form.get("barrio") ?? ""),
    localidad: String(form.get("localidad") ?? ""),
    provincia: String(form.get("provincia") ?? ""),
    referencias: String(form.get("referencias") ?? ""),
    esPrincipal: true,
  });
  return leida.success
    ? { ok: true, direccion: leida.data }
    : { ok: false, error: leida.error.issues[0]?.message ?? "Revisá la dirección" };
}

// Confirma el pedido web. Sin sesión, crea la cuenta del cliente (el teléfono es el usuario)
// y lo deja logueado. Los precios se toman de la base, nunca del navegador.
export async function confirmarPedido(_prev: EstadoCheckout, form: FormData): Promise<EstadoCheckout> {
  const usuario = await usuarioActual();
  if (usuario?.accesoGestion) {
    return { error: "Estás con un usuario de gestión. Para pedir desde la web, salí e ingresá como cliente." };
  }

  const renglones = leerRenglones(String(form.get("renglones") ?? ""));
  if (!renglones) return { error: "El carrito está vacío" };
  const filas = await variantesParaPedido(renglones.map((r) => r.varianteId));
  if (filas.length !== renglones.length) {
    return { error: "Algunos productos ya no están en la web. Volvé al carrito para revisarlo." };
  }
  const sinStock = filas.find((f) => !f.disponible);
  if (sinStock) return { error: `${sinStock.producto} está sin stock. Quitalo del carrito para seguir.` };

  const tipoEntrega = form.get("tipoEntrega") === "envio" ? "envio" : "retiro";
  const notasCliente = textoOpcional(form.get("notas"));
  if (notasCliente && notasCliente.length > 1000) return { error: "Las notas son muy largas" };

  // Cuenta nueva (sin sesión).
  let cuentaNueva: { nombre: string; telefono: string; email: string | null; passwordHash: string } | null = null;
  let clienteExistente: number | null = null;
  if (!usuario) {
    const nombre = String(form.get("nombre") ?? "").trim();
    const telefono = normalizarTelefono(String(form.get("telefono") ?? ""));
    const email = textoOpcional(form.get("email"));
    const password = String(form.get("password") ?? "");
    if (nombre.length < 2 || nombre.length > 120) return { error: "Escribí tu nombre y apellido" };
    if (!telefono) return { error: "El teléfono no es válido: escribilo con característica, solo números" };
    if (email && (email.length > 150 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) return { error: "El email no es válido" };
    const errorClave = errorPassword(password, String(form.get("confirmacion") ?? ""));
    if (errorClave) return { error: errorClave };

    const [cliente] = await db.select({ id: clientes.id }).from(clientes).where(eq(clientes.telefono, telefono)).limit(1);
    const [cuenta] = await db
      .select({ id: usuarios.id })
      .from(usuarios)
      .where(cliente ? or(eq(usuarios.nombreUsuario, telefono), eq(usuarios.clienteId, cliente.id)) : eq(usuarios.nombreUsuario, telefono))
      .limit(1);
    if (cuenta) {
      return { error: "Ya hay una cuenta con ese teléfono. Ingresá con tu contraseña para terminar el pedido.", cuentaExistente: true };
    }
    // Un cliente del local que todavía no tenía cuenta web: la cuenta se suma a su ficha.
    clienteExistente = cliente?.id ?? null;
    cuentaNueva = { nombre, telefono, email, passwordHash: await hashPassword(password) };
  }
  const clienteSesion = usuario?.clienteId ?? null;
  if (usuario && !clienteSesion) return { error: "Tu cuenta no tiene datos de cliente. Escribinos para revisarla." };

  // Dirección: una guardada del cliente o una nueva.
  let direccionId: number | null = null;
  let direccionNueva: DireccionValidada | null = null;
  let direccionTexto: string | null = null;
  if (tipoEntrega === "envio") {
    const elegida = Number(form.get("direccionId"));
    if (clienteSesion && elegida > 0) {
      const [guardada] = await db
        .select()
        .from(direcciones)
        .where(and(eq(direcciones.id, elegida), eq(direcciones.clienteId, clienteSesion)))
        .limit(1);
      if (!guardada) return { error: "Elegí una dirección de envío" };
      direccionId = guardada.id;
      direccionTexto = textoDireccion(guardada);
    } else {
      const leida = leerDireccion(form);
      if (!leida.ok) return { error: leida.error };
      direccionNueva = leida.direccion;
      direccionTexto = textoDireccion(leida.direccion);
    }
  }

  const cantidades = new Map(renglones.map((r) => [r.varianteId, r.cantidad]));
  const totales = calcularTotales(
    filas.map((f) => ({
      varianteId: f.varianteId,
      descripcion: (f.variante ? `${f.producto} · ${f.variante}` : f.producto).slice(0, 250),
      cantidad: String(cantidades.get(f.varianteId)),
      precioUnitario: precioFinal(f.precioVenta, f.precioOferta).precio,
      precioCosto: f.precioCosto,
    })),
    "0.00",
  );

  const [rolCliente] = cuentaNueva
    ? await db.select({ id: roles.id }).from(roles).where(eq(roles.codigo, "cliente")).limit(1)
    : [];
  if (cuentaNueva && !rolCliente) return { error: "No se pudo crear la cuenta. Escribinos para hacer el pedido." };

  const resultado = await db.transaction(async (tx) => {
    let clienteId = clienteSesion ?? clienteExistente;
    let usuarioId = usuario?.id ?? null;
    if (cuentaNueva) {
      if (!clienteId) {
        const [creado] = await tx
          .insert(clientes)
          .values({ nombre: cuentaNueva.nombre, telefono: cuentaNueva.telefono, email: cuentaNueva.email, origen: "web" })
          .$returningId();
        clienteId = creado.id;
      }
      const [creado] = await tx
        .insert(usuarios)
        .values({
          nombreUsuario: cuentaNueva.telefono,
          passwordHash: cuentaNueva.passwordHash,
          nombre: cuentaNueva.nombre,
          rolId: rolCliente!.id,
          clienteId,
        })
        .$returningId();
      usuarioId = creado.id;
    }
    if (direccionNueva) {
      const previas = await tx.select({ id: direcciones.id }).from(direcciones).where(eq(direcciones.clienteId, clienteId!)).limit(1);
      const [creada] = await tx
        .insert(direcciones)
        .values({ ...direccionNueva, alias: null, clienteId: clienteId!, esPrincipal: previas.length === 0 })
        .$returningId();
      direccionId = creada.id;
    }
    const numero = await siguienteNumero(tx);
    const [pedido] = await tx
      .insert(pedidos)
      .values({
        numero,
        canal: "web",
        clienteId: clienteId!,
        tipoEntrega,
        direccionId,
        direccionTexto,
        estado: "pendiente",
        subtotal: totales.subtotal,
        subtotalCosto: totales.subtotalCosto,
        adicional: "0.00",
        total: totales.total,
        notasCliente,
      })
      .$returningId();
    await tx.insert(pedidoItems).values(totales.items.map((item) => ({ ...item, pedidoId: pedido.id })));
    return { numero, usuarioId: usuarioId! };
  });

  if (cuentaNueva) await crearSesion(resultado.usuarioId, false);
  redirect(`/cuenta/pedidos/${resultado.numero}?nuevo=1`);
}
