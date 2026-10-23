"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { movimientosStock, variantes } from "@/db/schema";
import { requerirPermiso } from "@/lib/auth/dal";
import { textoOpcional } from "@/lib/texto";
import { calcularMovimiento, type TipoCarga } from "./datos";

export type EstadoFormulario = { error?: string } | undefined;

export async function registrarMovimiento(
  varianteId: number,
  _prev: EstadoFormulario,
  form: FormData,
): Promise<EstadoFormulario> {
  const usuario = await requerirPermiso("stock", "crear");
  const tipo: TipoCarga = form.get("tipo") === "ajuste" ? "ajuste" : "ingreso";
  const motivo = textoOpcional(form.get("motivo"));
  if (tipo === "ajuste" && !motivo) return { error: "Indica el motivo del ajuste" };
  if (motivo && motivo.length > 255) return { error: "El motivo es muy largo" };

  // Se bloquea la fila de la variante para que dos cargas simultáneas no se pisen.
  const error = await db.transaction(async (tx) => {
    const [variante] = await tx
      .select({ stock: variantes.stockActual })
      .from(variantes)
      .where(eq(variantes.id, varianteId))
      .for("update");
    if (!variante) return "La variante no existe";

    const calculo = calcularMovimiento(tipo, variante.stock, String(form.get("cantidad") ?? ""));
    if (!calculo.ok) return calculo.error;

    await tx.update(variantes).set({ stockActual: calculo.stockNuevo }).where(eq(variantes.id, varianteId));
    await tx.insert(movimientosStock).values({
      varianteId,
      tipo,
      cantidad: calculo.cantidad,
      stockAnterior: variante.stock,
      stockNuevo: calculo.stockNuevo,
      usuarioId: usuario.id,
      motivo,
    });
    return null;
  });
  if (error) return { error };

  revalidatePath("/admin/stock");
  revalidatePath("/admin/productos");
  redirect(`/admin/stock/${varianteId}?registrado=${tipo}`);
}
