"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { proveedores } from "@/db/schema";
import { requerirPermiso } from "@/lib/auth/dal";
import { obtenerProveedor, productosDelProveedor } from "@/lib/gestion/proveedores";
import { textoOpcional } from "@/lib/texto";

export type EstadoFormulario = { error?: string } | undefined;

const datosProveedor = z.object({
  nombre: z.string().trim().min(2, "El nombre debe tener al menos 2 letras").max(150),
  nombreFantasia: z.string().max(150).nullable(),
  contacto: z.string().max(120).nullable(),
  telefono: z.string().max(40).nullable(),
  email: z.email("El email no es válido").max(150).nullable(),
  direccion: z.string().max(200).nullable(),
  notas: z.string().nullable(),
  activo: z.boolean(),
});

function leerFormulario(form: FormData) {
  return datosProveedor.safeParse({
    nombre: String(form.get("nombre") ?? ""),
    nombreFantasia: textoOpcional(form.get("nombreFantasia")),
    contacto: textoOpcional(form.get("contacto")),
    telefono: textoOpcional(form.get("telefono")),
    email: textoOpcional(form.get("email")),
    direccion: textoOpcional(form.get("direccion")),
    notas: textoOpcional(form.get("notas")),
    activo: form.get("activo") === "on",
  });
}

export async function crearProveedor(_prev: EstadoFormulario, form: FormData): Promise<EstadoFormulario> {
  await requerirPermiso("proveedores", "crear");
  const datos = leerFormulario(form);
  if (!datos.success) return { error: datos.error.issues[0]?.message ?? "Datos inválidos" };

  await db.insert(proveedores).values(datos.data);
  revalidatePath("/admin/proveedores");
  redirect("/admin/proveedores");
}

export async function editarProveedor(
  id: number,
  _prev: EstadoFormulario,
  form: FormData,
): Promise<EstadoFormulario> {
  await requerirPermiso("proveedores", "editar");
  if (!(await obtenerProveedor(id))) return { error: "El proveedor no existe" };
  const datos = leerFormulario(form);
  if (!datos.success) return { error: datos.error.issues[0]?.message ?? "Datos inválidos" };

  await db.update(proveedores).set(datos.data).where(eq(proveedores.id, id));
  revalidatePath("/admin/proveedores");
  redirect("/admin/proveedores");
}

export async function eliminarProveedor(id: number): Promise<void> {
  await requerirPermiso("proveedores", "eliminar");
  if ((await productosDelProveedor(id)) > 0) redirect(`/admin/proveedores/${id}?en-uso=1`);

  await db.delete(proveedores).where(eq(proveedores.id, id));
  revalidatePath("/admin/proveedores");
  redirect("/admin/proveedores");
}
