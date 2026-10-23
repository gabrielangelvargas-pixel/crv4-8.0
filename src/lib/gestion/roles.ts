import "server-only";
import { asc, count, eq } from "drizzle-orm";
import { db } from "@/db";
import { rolPermisos, roles, usuarios } from "@/db/schema";
import { permiso, type Permiso } from "@/lib/auth/permisos-catalogo";

export async function listarRoles() {
  const filas = await db
    .select({
      id: roles.id,
      codigo: roles.codigo,
      nombre: roles.nombre,
      descripcion: roles.descripcion,
      accesoTotal: roles.accesoTotal,
      accesoGestion: roles.accesoGestion,
      activo: roles.activo,
      usuarios: count(usuarios.id),
    })
    .from(roles)
    .leftJoin(usuarios, eq(usuarios.rolId, roles.id))
    .groupBy(roles.id)
    .orderBy(asc(roles.id));
  return filas;
}

export type RolDetalle = NonNullable<Awaited<ReturnType<typeof obtenerRol>>>;

export async function obtenerRol(id: number) {
  const [rol] = await db.select().from(roles).where(eq(roles.id, id)).limit(1);
  if (!rol) return null;
  const filas = await db.select().from(rolPermisos).where(eq(rolPermisos.rolId, id));
  const permisos: Permiso[] = filas.map((p) => permiso(p.modulo, p.accion));
  return { ...rol, permisos };
}

export async function contarUsuariosDelRol(id: number): Promise<number> {
  const [fila] = await db.select({ n: count() }).from(usuarios).where(eq(usuarios.rolId, id));
  return fila?.n ?? 0;
}
