import { z } from "zod";
import type { TIPOS_VARIANTE } from "@/db/schema";
import { leerDecimal } from "@/lib/numeros";

// Lo que el formulario de producto envía para cada variante (campo oculto en JSON).
export type VarianteFormulario = {
  id?: number;
  valor: string;
  codigo: string;
  codigoProveedor: string;
  precioCosto: string;
  precioVenta: string;
  precioOferta: string;
  activo: boolean;
  esPrincipal: boolean;
  // Nombre del archivo nuevo dentro del formulario ("foto-3") y si se pidió quitar la actual.
  foto?: string;
  quitarFoto?: boolean;
};

export const NOMBRE_TIPO_VARIANTE: Record<(typeof TIPOS_VARIANTE)[number], string> = {
  ninguna: "Sin variantes",
  color: "Color",
  tamano: "Tamaño",
  presentacion: "Presentación",
};

const varianteRecibida = z.object({
  id: z.number().int().positive().optional(),
  valor: z.string(),
  codigo: z.string(),
  codigoProveedor: z.string(),
  precioCosto: z.string(),
  precioVenta: z.string(),
  precioOferta: z.string(),
  activo: z.boolean(),
  esPrincipal: z.boolean(),
  foto: z.string().regex(/^foto-\d+$/).optional(),
  quitarFoto: z.boolean().optional(),
});

export type VarianteValidada = {
  id?: number;
  valor: string;
  codigo: string;
  codigoProveedor: string | null;
  precioCosto: string | null;
  precioVenta: string;
  precioOferta: string | null;
  activo: boolean;
  esPrincipal: boolean;
  orden: number;
  foto: string | null;
  quitarFoto: boolean;
};

type Resultado = { ok: true; variantes: VarianteValidada[] } | { ok: false; error: string };

// Valida las variantes del formulario. Sin variantes reales queda una sola, "Única".
export function validarVariantes(json: string, tipo: (typeof TIPOS_VARIANTE)[number]): Resultado {
  let crudo: unknown;
  try {
    crudo = JSON.parse(json);
  } catch {
    return { ok: false, error: "No se pudieron leer las variantes" };
  }
  const lista = z.array(varianteRecibida).safeParse(crudo);
  if (!lista.success || lista.data.length === 0) return { ok: false, error: "Agrega al menos una variante" };
  if (tipo === "ninguna" && lista.data.length > 1) {
    return { ok: false, error: "Un producto sin variantes tiene un solo código y precio" };
  }

  const resultado: VarianteValidada[] = [];
  for (const [i, v] of lista.data.entries()) {
    const valor = tipo === "ninguna" ? "Única" : v.valor.trim();
    const nombre = tipo === "ninguna" ? "" : ` (${valor || `variante ${i + 1}`})`;
    if (!valor) return { ok: false, error: `Falta el nombre de la variante ${i + 1}` };
    if (valor.length > 80) return { ok: false, error: `El nombre de la variante ${valor} es muy largo` };

    const codigo = v.codigo.trim().toUpperCase();
    if (!codigo) return { ok: false, error: `Falta el código${nombre}` };
    if (!/^[A-Z0-9-]{1,13}$/.test(codigo)) {
      return { ok: false, error: `El código${nombre} admite hasta 13 letras, números o guiones` };
    }

    const precioVenta = leerDecimal(v.precioVenta);
    if (precioVenta === null) return { ok: false, error: `El precio de venta${nombre} no es válido` };
    const precioOferta = v.precioOferta.trim() ? leerDecimal(v.precioOferta) : null;
    if (v.precioOferta.trim() && precioOferta === null) {
      return { ok: false, error: `El precio de oferta${nombre} no es válido` };
    }
    if (precioOferta !== null && Number(precioOferta) >= Number(precioVenta)) {
      return { ok: false, error: `La oferta${nombre} tiene que ser menor que el precio de venta` };
    }
    const precioCosto = v.precioCosto.trim() ? leerDecimal(v.precioCosto) : "0.00";
    if (precioCosto === null) return { ok: false, error: `El precio de costo${nombre} no es válido` };

    const codigoProveedor = v.codigoProveedor.trim() || null;
    if (codigoProveedor && codigoProveedor.length > 40) {
      return { ok: false, error: `El código del proveedor${nombre} es muy largo` };
    }

    resultado.push({
      id: v.id,
      valor,
      codigo,
      codigoProveedor,
      precioCosto,
      precioVenta,
      precioOferta,
      activo: v.activo,
      esPrincipal: v.esPrincipal,
      orden: i,
      foto: v.foto ?? null,
      quitarFoto: v.quitarFoto ?? false,
    });
  }

  const codigos = resultado.map((v) => v.codigo);
  const repetido = codigos.find((c, i) => codigos.indexOf(c) !== i);
  if (repetido) return { ok: false, error: `El código ${repetido} está repetido` };
  const valores = resultado.map((v) => v.valor.toLowerCase());
  const valorRepetido = resultado.find((v, i) => valores.indexOf(v.valor.toLowerCase()) !== i);
  if (valorRepetido) return { ok: false, error: `La variante ${valorRepetido.valor} está repetida` };

  // Siempre exactamente una principal: la marcada o, si no hay, la primera.
  const principal = Math.max(0, resultado.findIndex((v) => v.esPrincipal));
  resultado.forEach((v, i) => (v.esPrincipal = i === principal));

  return { ok: true, variantes: resultado };
}
