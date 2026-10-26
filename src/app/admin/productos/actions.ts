"use server";

import { eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { productos, TIPOS_VARIANTE, variantes } from "@/db/schema";
import { requerirPermiso } from "@/lib/auth/dal";
import { tienePermiso } from "@/lib/auth/permisos";
import type { UsuarioSesion } from "@/lib/auth/session";
import { codigosEnUso, obtenerProducto, variantesConHistorial, type ProductoConVariantes, type Variante } from "@/lib/gestion/productos";
import { obtenerRubro } from "@/lib/gestion/rubros";
import { borrarImagen, ErrorImagen, guardarImagenProducto, moverImagen } from "@/lib/imagenes";
import { rutaFotoProducto } from "@/lib/rutas-imagen";
import { textoOpcional } from "@/lib/texto";
import { validarVariantes, type VarianteValidada } from "./datos";

export type EstadoFormulario = { error?: string } | undefined;

const datosProducto = z.object({
  nombre: z.string().trim().min(2, "El nombre debe tener al menos 2 letras").max(150),
  descripcion: z.string().nullable(),
  rubroId: z.number({ error: "Elige un subrubro" }).int().positive("Elige un subrubro"),
  proveedorId: z.number().int().positive().nullable(),
  tipoVariante: z.enum(TIPOS_VARIANTE),
  visibleWeb: z.boolean(),
  destacado: z.boolean(),
  activo: z.boolean(),
});

type Lectura =
  | { ok: true; producto: z.infer<typeof datosProducto>; variantes: VarianteValidada[]; rubroSlug: string }
  | { ok: false; error: string };

// El costo solo lo ve quien tiene acceso total; el proveedor, quien puede ver proveedores.
// Lo que el usuario no ve, no se toca: se conserva el valor guardado.
async function leerFormulario(form: FormData, usuario: UsuarioSesion, actual?: ProductoConVariantes): Promise<Lectura> {
  const verProveedor = tienePermiso(usuario, "proveedores", "ver");
  const proveedor = Number(form.get("proveedorId"));
  const datos = datosProducto.safeParse({
    nombre: String(form.get("nombre") ?? ""),
    descripcion: textoOpcional(form.get("descripcion")),
    rubroId: Number(form.get("rubroId")) || undefined,
    proveedorId: verProveedor ? (proveedor > 0 ? proveedor : null) : (actual?.proveedorId ?? null),
    tipoVariante: form.get("tipoVariante"),
    visibleWeb: form.get("visibleWeb") === "on",
    destacado: form.get("destacado") === "on",
    activo: form.get("activo") === "on",
  });
  if (!datos.success) return { ok: false, error: datos.error.issues[0]?.message ?? "Datos inválidos" };

  const rubro = await obtenerRubro(datos.data.rubroId);
  if (!rubro || rubro.rubroPadreId === null) return { ok: false, error: "El producto tiene que estar en un subrubro" };

  const lista = validarVariantes(String(form.get("variantes") ?? "[]"), datos.data.tipoVariante);
  if (!lista.ok) return lista;

  const guardadas = new Map(actual?.variantes.map((v) => [v.id, v]));
  for (const v of lista.variantes) {
    if (v.id !== undefined && !guardadas.has(v.id)) return { ok: false, error: "Una de las variantes ya no existe" };
    const previa = v.id !== undefined ? guardadas.get(v.id) : undefined;
    if (!usuario.accesoTotal) v.precioCosto = previa?.precioCosto ?? "0.00";
    if (!verProveedor) v.codigoProveedor = previa?.codigoProveedor ?? null;
  }

  const enUso = await codigosEnUso(
    lista.variantes.map((v) => v.codigo),
    [...guardadas.keys()],
  );
  if (enUso.length) return { ok: false, error: `El código ${enUso[0]} ya lo usa otro producto` };

  return { ok: true, producto: datos.data, variantes: lista.variantes, rubroSlug: rubro.slug };
}

function filaVariante(v: VarianteValidada, imagen: string | null) {
  return {
    imagen,
    valor: v.valor,
    codigo: v.codigo,
    codigoProveedor: v.codigoProveedor,
    precioCosto: v.precioCosto ?? "0.00",
    precioVenta: v.precioVenta,
    precioOferta: v.precioOferta,
    activo: v.activo,
    esPrincipal: v.esPrincipal,
    orden: v.orden,
  };
}

// Cada variante tiene su foto, en la carpeta del subrubro y con su código:
// "productos/vasos/7790895000997.webp". Las fotos viejas guardadas en el producto
// son de la variante principal y pasan a ella al guardar.
async function resolverFotos(
  form: FormData,
  lista: VarianteValidada[],
  rubroSlug: string,
  actual?: ProductoConVariantes,
): Promise<{ ok: true; fotos: (string | null)[]; sobrantes: string[] } | { ok: false; error: string }> {
  const guardadas = new Map<number | undefined, Variante>(actual?.variantes.map((v) => [v.id, v]));
  const principalAnterior = actual?.variantes.find((v) => v.esPrincipal)?.id;
  let fotoDelProducto = actual?.imagen ?? null;
  const fotos: (string | null)[] = [];
  const descartadas: string[] = [];

  for (const v of lista) {
    const guardada = v.id !== undefined ? guardadas.get(v.id) : undefined;
    let anterior = guardada?.imagen ?? null;
    if (!anterior && fotoDelProducto && guardada && guardada.id === principalAnterior) {
      anterior = fotoDelProducto;
      fotoDelProducto = null;
    }
    const ruta = rutaFotoProducto(rubroSlug, v.codigo);
    const subida = v.foto ? form.get(v.foto) : null;
    const archivo = subida instanceof File && subida.size > 0 ? subida : null;
    try {
      if (archivo) {
        await guardarImagenProducto(archivo, ruta);
        if (anterior && anterior !== ruta) descartadas.push(anterior);
        fotos.push(ruta);
      } else if (v.quitarFoto) {
        if (anterior) descartadas.push(anterior);
        fotos.push(null);
      } else {
        fotos.push(anterior ? await moverImagen(anterior, ruta) : null);
      }
    } catch (error) {
      if (error instanceof ErrorImagen) {
        const nombre = lista.length > 1 ? ` de ${v.valor}` : "";
        return { ok: false, error: `Foto${nombre}: ${error.message}` };
      }
      throw error;
    }
  }

  // Fotos que ya no usa nadie: las reemplazadas, las de variantes quitadas y la vieja del producto.
  const conservadas = new Set(lista.map((v) => v.id));
  for (const v of actual?.variantes ?? []) if (!conservadas.has(v.id) && v.imagen) descartadas.push(v.imagen);
  if (fotoDelProducto) descartadas.push(fotoDelProducto);
  const enUso = new Set(fotos);
  return { ok: true, fotos, sobrantes: descartadas.filter((ruta) => !enUso.has(ruta)) };
}

export async function crearProducto(_prev: EstadoFormulario, form: FormData): Promise<EstadoFormulario> {
  const usuario = await requerirPermiso("productos", "crear");
  const datos = await leerFormulario(form, usuario);
  if (!datos.ok) return { error: datos.error };
  const fotos = await resolverFotos(form, datos.variantes, datos.rubroSlug);
  if (!fotos.ok) return { error: fotos.error };

  await db.transaction(async (tx) => {
    const [{ id }] = await tx.insert(productos).values({ ...datos.producto, imagen: null }).$returningId();
    await tx
      .insert(variantes)
      .values(datos.variantes.map((v, i) => ({ ...filaVariante(v, fotos.fotos[i]), productoId: id })));
  });
  revalidatePath("/admin/productos");
  redirect("/admin/productos");
}

export async function editarProducto(
  id: number,
  _prev: EstadoFormulario,
  form: FormData,
): Promise<EstadoFormulario> {
  const usuario = await requerirPermiso("productos", "editar");
  const actual = await obtenerProducto(id);
  if (!actual) return { error: "El producto no existe" };
  const datos = await leerFormulario(form, usuario, actual);
  if (!datos.ok) return { error: datos.error };

  const conservadas = new Set(datos.variantes.map((v) => v.id));
  const quitadas = actual.variantes.filter((v) => !conservadas.has(v.id));
  const conHistorial = await variantesConHistorial(quitadas.map((v) => v.id));
  if (conHistorial.length) {
    const nombre = quitadas.find((v) => v.id === conHistorial[0])?.valor;
    return { error: `La variante ${nombre} ya tiene ventas o movimientos de stock: desactívala en vez de quitarla` };
  }
  const fotos = await resolverFotos(form, datos.variantes, datos.rubroSlug, actual);
  if (!fotos.ok) return { error: fotos.error };

  await db.transaction(async (tx) => {
    await tx.update(productos).set({ ...datos.producto, imagen: null }).where(eq(productos.id, id));
    if (quitadas.length) await tx.delete(variantes).where(inArray(variantes.id, quitadas.map((v) => v.id)));
    // Primero se liberan los códigos de las variantes editadas para poder intercambiarlos.
    for (const v of datos.variantes) {
      if (v.id !== undefined) await tx.update(variantes).set({ codigo: `~${v.id}` }).where(eq(variantes.id, v.id));
    }
    for (const [i, v] of datos.variantes.entries()) {
      const fila = filaVariante(v, fotos.fotos[i]);
      if (v.id !== undefined) await tx.update(variantes).set(fila).where(eq(variantes.id, v.id));
      else await tx.insert(variantes).values({ ...fila, productoId: id });
    }
  });
  for (const ruta of fotos.sobrantes) await borrarImagen(ruta);
  revalidatePath("/admin/productos");
  redirect("/admin/productos");
}

export async function eliminarProducto(id: number): Promise<void> {
  await requerirPermiso("productos", "eliminar");
  const producto = await obtenerProducto(id);
  if (!producto) redirect("/admin/productos");
  if ((await variantesConHistorial(producto.variantes.map((v) => v.id))).length > 0) {
    redirect(`/admin/productos/${id}?en-uso=1`);
  }

  await db.delete(productos).where(eq(productos.id, id));
  await borrarImagen(producto.imagen);
  for (const v of producto.variantes) await borrarImagen(v.imagen);
  revalidatePath("/admin/productos");
  redirect("/admin/productos");
}
