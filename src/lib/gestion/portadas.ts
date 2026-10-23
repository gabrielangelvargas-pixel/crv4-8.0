import "server-only";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { portadas } from "@/db/schema";

export type Portada = typeof portadas.$inferSelect;

export async function listarPortadas(): Promise<Portada[]> {
  return db.select().from(portadas).orderBy(asc(portadas.orden), asc(portadas.id));
}

export async function obtenerPortada(id: number): Promise<Portada | null> {
  const [fila] = await db.select().from(portadas).where(eq(portadas.id, id)).limit(1);
  return fila ?? null;
}

// Las que ve el público, en orden.
export async function portadasActivas(): Promise<Portada[]> {
  return db.select().from(portadas).where(eq(portadas.activo, true)).orderBy(asc(portadas.orden), asc(portadas.id));
}
