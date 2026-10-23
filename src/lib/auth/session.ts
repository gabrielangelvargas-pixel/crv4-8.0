import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { and, eq, gt, ne } from "drizzle-orm";
import { cookies } from "next/headers";
import { db } from "@/db";
import { rolPermisos, roles, sesiones, usuarios, type CodigoRol } from "@/db/schema";
import { permiso, type Permiso } from "./permisos-catalogo";
import type { PerfilAcceso } from "./permisos";
import { COOKIE_SESION, duracionSesionMs } from "./roles";

// En la cookie va un token aleatorio; en la base solo su hash, así un
// volcado de la tabla no permite suplantar sesiones.
function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function crearSesion(usuarioId: number, accesoGestion: boolean): Promise<void> {
  const token = randomBytes(32).toString("base64url");
  const expiraEn = new Date(Date.now() + duracionSesionMs(accesoGestion));

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

export type UsuarioSesion = PerfilAcceso & {
  id: number;
  nombreUsuario: string;
  nombre: string;
  clienteId: number | null;
  rol: { id: number; nombre: string; codigo: CodigoRol | null };
};

export async function leerSesion(): Promise<UsuarioSesion | null> {
  const token = (await cookies()).get(COOKIE_SESION)?.value;
  if (!token) return null;

  const [fila] = await db
    .select({
      id: usuarios.id,
      nombreUsuario: usuarios.nombreUsuario,
      nombre: usuarios.nombre,
      clienteId: usuarios.clienteId,
      rolId: roles.id,
      rolNombre: roles.nombre,
      rolCodigo: roles.codigo,
      accesoTotal: roles.accesoTotal,
      accesoGestion: roles.accesoGestion,
    })
    .from(sesiones)
    .innerJoin(usuarios, eq(sesiones.usuarioId, usuarios.id))
    .innerJoin(roles, eq(usuarios.rolId, roles.id))
    .where(
      and(
        eq(sesiones.id, hashToken(token)),
        gt(sesiones.expiraEn, new Date()),
        eq(usuarios.activo, true),
        eq(roles.activo, true),
      ),
    )
    .limit(1);
  if (!fila) return null;

  const filasPermisos = await db
    .select({ modulo: rolPermisos.modulo, accion: rolPermisos.accion })
    .from(rolPermisos)
    .where(eq(rolPermisos.rolId, fila.rolId));
  const permisos: Permiso[] = filasPermisos.map((p) => permiso(p.modulo, p.accion));

  return {
    id: fila.id,
    nombreUsuario: fila.nombreUsuario,
    nombre: fila.nombre,
    clienteId: fila.clienteId,
    rol: { id: fila.rolId, nombre: fila.rolNombre, codigo: fila.rolCodigo },
    accesoTotal: fila.accesoTotal,
    accesoGestion: fila.accesoGestion,
    permisos,
  };
}

export async function cerrarSesion(): Promise<void> {
  const store = await cookies();
  const token = store.get(COOKIE_SESION)?.value;
  if (token) await db.delete(sesiones).where(eq(sesiones.id, hashToken(token)));
  store.delete(COOKIE_SESION);
}

// Al cambiar la contraseña se cierran las sesiones abiertas en otros dispositivos.
// Con `conservarActual` sigue abierta la del navegador que hizo el cambio.
export async function cerrarSesionesDe(usuarioId: number, conservarActual = false): Promise<void> {
  const token = conservarActual ? (await cookies()).get(COOKIE_SESION)?.value : undefined;
  await db
    .delete(sesiones)
    .where(and(eq(sesiones.usuarioId, usuarioId), token ? ne(sesiones.id, hashToken(token)) : undefined));
}
