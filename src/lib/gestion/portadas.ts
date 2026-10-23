import "server-only";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { portadaAviso, portadaBloques, portadaFranja, portadas } from "@/db/schema";

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

export type BloquePortada = typeof portadaBloques.$inferSelect;

export async function listarBloques(soloActivos = false): Promise<BloquePortada[]> {
  return db
    .select()
    .from(portadaBloques)
    .where(soloActivos ? eq(portadaBloques.activo, true) : undefined)
    .orderBy(asc(portadaBloques.orden), asc(portadaBloques.id));
}

// La franja y el aviso son una sola fila (id = 1); si todavía no se guardaron, valen los valores por defecto.
export type Franja = typeof portadaFranja.$inferSelect;
export type Aviso = typeof portadaAviso.$inferSelect;

export async function obtenerFranja(): Promise<Franja> {
  const [fila] = await db.select().from(portadaFranja).where(eq(portadaFranja.id, 1)).limit(1);
  const ahora = new Date();
  return (
    fila ?? { id: 1, frases: "", icono: "corazon", colorFondo: "#1e40af", colorTexto: "#ffffff", activo: false, creadoEn: ahora, actualizadoEn: ahora }
  );
}

export async function obtenerAviso(): Promise<Aviso> {
  const [fila] = await db.select().from(portadaAviso).where(eq(portadaAviso.id, 1)).limit(1);
  const ahora = new Date();
  return (
    fila ?? {
      id: 1,
      titulo: null,
      texto: null,
      imagen: null,
      botonTexto: null,
      enlace: null,
      desde: null,
      hasta: null,
      frecuencia: "dia",
      activo: false,
      creadoEn: ahora,
      actualizadoEn: ahora,
    }
  );
}
