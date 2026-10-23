import { z } from "zod";
import { ICONOS_BLOQUE, type ClaveIcono } from "@/lib/iconos-bloque";

export const MAXIMO_BLOQUES = 8;

export type BloqueFormulario = { icono: ClaveIcono; titulo: string; texto: string; activo: boolean };

const bloque = z.object({
  icono: z.enum(ICONOS_BLOQUE, { error: "Elige un ícono" }),
  titulo: z.string().trim().min(1, "Cada bloque necesita un título").max(60, "El título es muy largo (máximo 60 letras)"),
  texto: z.string().trim().max(160, "El texto es muy largo (máximo 160 letras)"),
  activo: z.boolean(),
});

// La lista viaja como JSON desde el formulario; el orden es el de la lista.
export function validarBloques(json: string): { ok: true; bloques: BloqueFormulario[] } | { ok: false; error: string } {
  let datos: unknown;
  try {
    datos = JSON.parse(json);
  } catch {
    return { ok: false, error: "Datos inválidos" };
  }
  const lista = z.array(bloque).max(MAXIMO_BLOQUES, `Puedes cargar hasta ${MAXIMO_BLOQUES} bloques`).safeParse(datos);
  if (!lista.success) return { ok: false, error: lista.error.issues[0]?.message ?? "Datos inválidos" };
  return { ok: true, bloques: lista.data };
}
