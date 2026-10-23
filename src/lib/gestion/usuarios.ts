import "server-only";
import { and, asc, count, eq, like, ne, or, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { movimientosStock, pedidos, roles, usuarios } from "@/db/schema";

export type Grupo = "equipo" | "web";

export async function listarUsuarios({ busqueda, grupo }: { busqueda?: string; grupo: Grupo }) {
  const texto = busqueda?.trim();
  const condiciones: SQL[] = [eq(roles.accesoGestion, grupo === "equipo")];
  if (texto) condiciones.push(or(like(usuarios.nombre, `%${texto}%`), like(usuarios.nombreUsuario, `%${texto}%`))!);
  return db
    .select({
      id: usuarios.id,
      nombre: usuarios.nombre,
      nombreUsuario: usuarios.nombreUsuario,
      activo: usuarios.activo,
      ultimoAcceso: usuarios.ultimoAcceso,
      rol: roles.nombre,
    })
    .from(usuarios)
    .innerJoin(roles, eq(roles.id, usuarios.rolId))
    .where(and(...condiciones))
    .orderBy(asc(usuarios.nombre))
    .limit(200);
}

export async function obtenerUsuario(id: number) {
  const [fila] = await db
    .select({
      id: usuarios.id,
      nombre: usuarios.nombre,
      nombreUsuario: usuarios.nombreUsuario,
      activo: usuarios.activo,
      ultimoAcceso: usuarios.ultimoAcceso,
      clienteId: usuarios.clienteId,
      rolId: usuarios.rolId,
      accesoTotal: roles.accesoTotal,
      accesoGestion: roles.accesoGestion,
    })
    .from(usuarios)
    .innerJoin(roles, eq(roles.id, usuarios.rolId))
    .where(eq(usuarios.id, id))
    .limit(1);
  return fila ?? null;
}

export type UsuarioDetalle = NonNullable<Awaited<ReturnType<typeof obtenerUsuario>>>;

export async function nombreUsuarioEnUso(nombre: string, excepto?: number): Promise<boolean> {
  const condicion = excepto
    ? and(eq(usuarios.nombreUsuario, nombre), ne(usuarios.id, excepto))
    : eq(usuarios.nombreUsuario, nombre);
  const [fila] = await db.select({ id: usuarios.id }).from(usuarios).where(condicion).limit(1);
  return Boolean(fila);
}

// Usuarios activos con acceso total, sin contar `excepto`: nunca puede quedar ninguno.
export async function otrosAdministradoresActivos(excepto: number): Promise<number> {
  const [fila] = await db
    .select({ n: count() })
    .from(usuarios)
    .innerJoin(roles, eq(roles.id, usuarios.rolId))
    .where(and(eq(roles.accesoTotal, true), eq(usuarios.activo, true), ne(usuarios.id, excepto)));
  return fila?.n ?? 0;
}

// Un usuario que ya figura en pedidos o en el stock no se borra: se desactiva.
export async function usuarioConHistorial(id: number): Promise<boolean> {
  const [[movs], [peds]] = await Promise.all([
    db.select({ n: count() }).from(movimientosStock).where(eq(movimientosStock.usuarioId, id)),
    db.select({ n: count() }).from(pedidos).where(eq(pedidos.atendidoPor, id)),
  ]);
  return (movs?.n ?? 0) + (peds?.n ?? 0) > 0;
}
