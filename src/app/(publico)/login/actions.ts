"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { roles, usuarios } from "@/db/schema";
import { verificarPassword } from "@/lib/auth/password";
import { destinoSeguro, inicioSegun } from "@/lib/auth/roles";
import { cerrarSesion, crearSesion } from "@/lib/auth/session";

// Se devuelve el usuario tipeado para no borrarlo si el login falla.
export type EstadoLogin = { error?: string; nombreUsuario?: string } | undefined;

const credenciales = z.object({
  nombreUsuario: z.string().trim().min(1).max(60),
  password: z.string().min(1).max(200),
});

const ERROR_GENERICO = "Usuario o contraseña incorrectos";

export async function iniciarSesion(_prev: EstadoLogin, form: FormData): Promise<EstadoLogin> {
  const datos = credenciales.safeParse({
    nombreUsuario: form.get("nombreUsuario"),
    password: form.get("password"),
  });
  const nombreUsuario = String(form.get("nombreUsuario") ?? "");
  if (!datos.success) return { error: "Completa usuario y contraseña", nombreUsuario };

  const [usuario] = await db
    .select({
      id: usuarios.id,
      activo: usuarios.activo,
      passwordHash: usuarios.passwordHash,
      rolActivo: roles.activo,
      accesoGestion: roles.accesoGestion,
    })
    .from(usuarios)
    .innerJoin(roles, eq(usuarios.rolId, roles.id))
    .where(eq(usuarios.nombreUsuario, datos.data.nombreUsuario))
    .limit(1);

  const valido =
    usuario?.activo &&
    usuario.rolActivo &&
    usuario.passwordHash &&
    (await verificarPassword(datos.data.password, usuario.passwordHash));
  if (!usuario || !valido) return { error: ERROR_GENERICO, nombreUsuario };

  await crearSesion(usuario.id, usuario.accesoGestion);
  redirect(destinoSeguro(form.get("next")) ?? inicioSegun(usuario.accesoGestion));
}

export async function salir(): Promise<void> {
  await cerrarSesion();
  redirect("/");
}
