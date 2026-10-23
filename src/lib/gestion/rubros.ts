import "server-only";
import { and, asc, count, eq, isNull, ne } from "drizzle-orm";
import { db } from "@/db";
import { productos, rubros } from "@/db/schema";

export type Rubro = typeof rubros.$inferSelect;
export type RubroConSubrubros = Rubro & { subrubros: Rubro[] };

// Rubros principales con sus subrubros, en el orden del catálogo.
export async function arbolDeRubros(): Promise<RubroConSubrubros[]> {
  const todos = await db.select().from(rubros).orderBy(asc(rubros.orden), asc(rubros.nombre));
  return todos
    .filter((r) => r.rubroPadreId === null)
    .map((r) => ({ ...r, subrubros: todos.filter((s) => s.rubroPadreId === r.id) }));
}

export async function rubrosPrincipales(): Promise<Rubro[]> {
  return db
    .select()
    .from(rubros)
    .where(isNull(rubros.rubroPadreId))
    .orderBy(asc(rubros.orden), asc(rubros.nombre));
}

export async function obtenerRubro(id: number): Promise<Rubro | null> {
  const [rubro] = await db.select().from(rubros).where(eq(rubros.id, id)).limit(1);
  return rubro ?? null;
}

export async function slugEnUso(slug: string, excepto?: number): Promise<boolean> {
  const condicion = excepto ? and(eq(rubros.slug, slug), ne(rubros.id, excepto)) : eq(rubros.slug, slug);
  const [fila] = await db.select({ id: rubros.id }).from(rubros).where(condicion).limit(1);
  return Boolean(fila);
}

export async function usoDelRubro(id: number) {
  const [sub] = await db.select({ n: count() }).from(rubros).where(eq(rubros.rubroPadreId, id));
  const [prod] = await db.select({ n: count() }).from(productos).where(eq(productos.rubroId, id));
  return { subrubros: sub?.n ?? 0, productos: prod?.n ?? 0 };
}
