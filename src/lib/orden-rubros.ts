import { asc, sql, type Column } from "drizzle-orm";
import { rubros } from "@/db/schema";

type AliasRubro = { id: Column; nombre: Column; orden: Column };

// Ordena productos como se listan las categorías (orden y nombre): primero el rubro
// principal y, dentro de él, sus productos directos y luego cada subrubro. El código va
// después, en cada consulta.
export function ordenPorRubro(padre: AliasRubro) {
  return [
    sql`coalesce(${padre.orden}, ${rubros.orden})`,
    sql`coalesce(${padre.nombre}, ${rubros.nombre})`,
    sql`coalesce(${padre.id}, ${rubros.id})`,
    sql`${padre.id} is not null`,
    asc(rubros.orden),
    asc(rubros.nombre),
    asc(rubros.id),
  ];
}
