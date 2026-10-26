import { z } from "zod";

// Renglones que manda el carrito del navegador: solo variante y cantidad (enteras).
const renglon = z.object({
  varianteId: z.number().int().positive(),
  cantidad: z.number().int().min(1).max(9999),
});

export const MAXIMO_RENGLONES = 100;

export type RenglonPedido = z.infer<typeof renglon>;

// Lee y une los renglones repetidos. Null si no se puede leer o está vacío.
export function leerRenglones(json: string): RenglonPedido[] | null {
  let crudo: unknown;
  try {
    crudo = JSON.parse(json);
  } catch {
    return null;
  }
  const lista = z.array(renglon).max(MAXIMO_RENGLONES).safeParse(crudo);
  if (!lista.success || lista.data.length === 0) return null;
  const unidos = new Map<number, number>();
  for (const r of lista.data) unidos.set(r.varianteId, Math.min(9999, (unidos.get(r.varianteId) ?? 0) + r.cantidad));
  return [...unidos].map(([varianteId, cantidad]) => ({ varianteId, cantidad }));
}
