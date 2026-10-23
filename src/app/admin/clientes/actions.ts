"use server";

import { eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { clientes, CONSUMIDOR_FINAL, direcciones } from "@/db/schema";
import { requerirPermiso } from "@/lib/auth/dal";
import { type Cliente, clienteConTelefono, direccionesUsadas, obtenerCliente, pedidosDelCliente } from "@/lib/gestion/clientes";
import { normalizarTelefono, textoOpcional } from "@/lib/texto";
import { validarDirecciones, type DireccionValidada } from "./datos";

export type EstadoFormulario = { error?: string } | undefined;

const datosCliente = z.object({
  nombre: z.string().trim().min(2, "El nombre debe tener al menos 2 letras").max(150),
  telefono: z.string({ error: "El teléfono no es válido" }).max(40),
  email: z.email("El email no es válido").max(150).nullable(),
  notas: z.string().nullable(),
  activo: z.boolean(),
});

type Lectura =
  | { ok: true; cliente: z.infer<typeof datosCliente>; direcciones: DireccionValidada[] }
  | { ok: false; error: string };

// El consumidor final conserva su nombre y teléfono y siempre queda activo.
async function leerFormulario(form: FormData, actual?: Cliente): Promise<Lectura> {
  const fijo = actual?.nombre === CONSUMIDOR_FINAL ? actual : undefined;
  const datos = datosCliente.safeParse({
    nombre: fijo?.nombre ?? String(form.get("nombre") ?? ""),
    telefono: fijo?.telefono ?? normalizarTelefono(String(form.get("telefono") ?? "")) ?? undefined,
    email: textoOpcional(form.get("email")),
    notas: textoOpcional(form.get("notas")),
    activo: fijo ? true : form.get("activo") === "on",
  });
  if (!datos.success) return { ok: false, error: datos.error.issues[0]?.message ?? "Datos inválidos" };

  const otro = fijo ? null : await clienteConTelefono(datos.data.telefono, actual?.id);
  if (otro) return { ok: false, error: `Ya existe un cliente con ese teléfono: ${otro.nombre}` };

  const lista = validarDirecciones(String(form.get("direcciones") ?? "[]"));
  if (!lista.ok) return lista;
  return { ok: true, cliente: datos.data, direcciones: lista.direcciones };
}

function filaDireccion(d: DireccionValidada) {
  return {
    alias: d.alias,
    calleNumero: d.calleNumero,
    barrio: d.barrio,
    localidad: d.localidad,
    provincia: d.provincia,
    referencias: d.referencias,
    esPrincipal: d.esPrincipal,
  };
}

export async function crearCliente(_prev: EstadoFormulario, form: FormData): Promise<EstadoFormulario> {
  await requerirPermiso("clientes", "crear");
  const datos = await leerFormulario(form);
  if (!datos.ok) return { error: datos.error };

  // Los clientes que se cargan desde la gestión son de origen presencial.
  await db.transaction(async (tx) => {
    const [{ id }] = await tx.insert(clientes).values({ ...datos.cliente, origen: "presencial" }).$returningId();
    if (datos.direcciones.length) {
      await tx.insert(direcciones).values(datos.direcciones.map((d) => ({ ...filaDireccion(d), clienteId: id })));
    }
  });
  revalidatePath("/admin/clientes");
  redirect("/admin/clientes");
}

export async function editarCliente(
  id: number,
  _prev: EstadoFormulario,
  form: FormData,
): Promise<EstadoFormulario> {
  await requerirPermiso("clientes", "editar");
  const actual = await obtenerCliente(id);
  if (!actual) return { error: "El cliente no existe" };

  const datos = await leerFormulario(form, actual);
  if (!datos.ok) return { error: datos.error };

  const guardadas = new Set(actual.direcciones.map((d) => d.id));
  if (datos.direcciones.some((d) => d.id !== undefined && !guardadas.has(d.id))) {
    return { error: "Una de las direcciones ya no existe" };
  }
  const conservadas = new Set(datos.direcciones.map((d) => d.id));
  const quitadas = actual.direcciones.filter((d) => !conservadas.has(d.id));
  const usadas = await direccionesUsadas(quitadas.map((d) => d.id));
  if (usadas.length) {
    const d = quitadas.find((q) => q.id === usadas[0]);
    return { error: `La dirección ${d?.alias ?? d?.calleNumero} ya figura en pedidos y no se puede quitar` };
  }

  await db.transaction(async (tx) => {
    await tx.update(clientes).set(datos.cliente).where(eq(clientes.id, id));
    if (quitadas.length) await tx.delete(direcciones).where(inArray(direcciones.id, quitadas.map((d) => d.id)));
    for (const d of datos.direcciones) {
      if (d.id !== undefined) await tx.update(direcciones).set(filaDireccion(d)).where(eq(direcciones.id, d.id));
      else await tx.insert(direcciones).values({ ...filaDireccion(d), clienteId: id });
    }
  });
  revalidatePath("/admin/clientes");
  redirect("/admin/clientes");
}

export async function eliminarCliente(id: number): Promise<void> {
  await requerirPermiso("clientes", "eliminar");
  const cliente = await obtenerCliente(id);
  if (!cliente) redirect("/admin/clientes");
  if (cliente.nombre === CONSUMIDOR_FINAL || cliente.cuenta || (await pedidosDelCliente(id)) > 0) {
    redirect(`/admin/clientes/${id}?en-uso=1`);
  }

  await db.delete(clientes).where(eq(clientes.id, id));
  revalidatePath("/admin/clientes");
  redirect("/admin/clientes");
}
