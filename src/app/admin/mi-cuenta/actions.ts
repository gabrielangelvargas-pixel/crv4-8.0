"use server";

import { eq } from "drizzle-orm";
import { db } from "@/db";
import { usuarios } from "@/db/schema";
import { requerirGestion } from "@/lib/auth/dal";
import { hashPassword, verificarPassword } from "@/lib/auth/password";
import { cerrarSesionesDe } from "@/lib/auth/session";
import { errorPassword } from "@/lib/auth/validacion";

export type EstadoPassword = { error?: string; ok?: string } | undefined;

export async function cambiarMiPassword(_prev: EstadoPassword, form: FormData): Promise<EstadoPassword> {
  const usuario = await requerirGestion();
  const [fila] = await db
    .select({ hash: usuarios.passwordHash })
    .from(usuarios)
    .where(eq(usuarios.id, usuario.id))
    .limit(1);
  const actual = String(form.get("actual") ?? "");
  if (!fila?.hash || !(await verificarPassword(actual, fila.hash))) return { error: "La contraseña actual no es correcta" };

  const password = String(form.get("password") ?? "");
  const errorClave = errorPassword(password, String(form.get("confirmacion") ?? ""));
  if (errorClave) return { error: errorClave };
  if (password === actual) return { error: "La nueva contraseña tiene que ser distinta de la actual" };

  await db.update(usuarios).set({ passwordHash: await hashPassword(password) }).where(eq(usuarios.id, usuario.id));
  await cerrarSesionesDe(usuario.id, true);
  return { ok: "Listo, tu contraseña cambió. Se cerraron tus sesiones en otros dispositivos." };
}
