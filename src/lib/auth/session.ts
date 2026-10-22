import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { and, eq, gt } from "drizzle-orm";
import { cookies } from "next/headers";
import { db } from "@/db";
import { sesiones, usuarios, type Rol } from "@/db/schema";
import { COOKIE_SESION, duracionSesionMs } from "./roles";

// En la cookie va un token aleatorio; en la base solo su hash, así un
// volcado de la tabla no permite suplantar sesiones.
function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function crearSesion(usuarioId: number, rol: Rol): Promise<void> {
  const token = randomBytes(32).toString("base64url");
  const expiraEn = new Date(Date.now() + duracionSesionMs(rol));

  await db.insert(sesiones).values({ id: hashToken(token), usuarioId, expiraEn });
  await db.update(usuarios).set({ ultimoAcceso: new Date() }).where(eq(usuarios.id, usuarioId));

  (await cookies()).set(COOKIE_SESION, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiraEn,
  });
}

export type UsuarioSesion = {
  id: number;
  nombreUsuario: string;
  nombre: string;
  rol: Rol;
  clienteId: number | null;
};

export async function leerSesion(): Promise<UsuarioSesion | null> {
  const token = (await cookies()).get(COOKIE_SESION)?.value;
  if (!token) return null;

  const [fila] = await db
    .select({
      id: usuarios.id,
      nombreUsuario: usuarios.nombreUsuario,
      nombre: usuarios.nombre,
      rol: usuarios.rol,
      clienteId: usuarios.clienteId,
    })
    .from(sesiones)
    .innerJoin(usuarios, eq(sesiones.usuarioId, usuarios.id))
    .where(
      and(
        eq(sesiones.id, hashToken(token)),
        gt(sesiones.expiraEn, new Date()),
        eq(usuarios.activo, true),
      ),
    )
    .limit(1);

  return fila ?? null;
}

export async function cerrarSesion(): Promise<void> {
  const store = await cookies();
  const token = store.get(COOKIE_SESION)?.value;
  if (token) await db.delete(sesiones).where(eq(sesiones.id, hashToken(token)));
  store.delete(COOKIE_SESION);
}
