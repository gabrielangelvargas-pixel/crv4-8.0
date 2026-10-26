import { z } from "zod";

// Lo que el formulario de cliente envía para cada dirección (campo oculto en JSON).
export type DireccionFormulario = {
  id?: number;
  alias: string;
  calleNumero: string;
  barrio: string;
  localidad: string;
  provincia: string;
  referencias: string;
  esPrincipal: boolean;
};

export const PROVINCIAS = [
  "Buenos Aires",
  "Ciudad Autónoma de Buenos Aires",
  "Catamarca",
  "Chaco",
  "Chubut",
  "Córdoba",
  "Corrientes",
  "Entre Ríos",
  "Formosa",
  "Jujuy",
  "La Pampa",
  "La Rioja",
  "Mendoza",
  "Misiones",
  "Neuquén",
  "Río Negro",
  "Salta",
  "San Juan",
  "San Luis",
  "Santa Cruz",
  "Santa Fe",
  "Santiago del Estero",
  "Tierra del Fuego",
  "Tucumán",
];

const texto = (max: number, nombre: string) =>
  z
    .string()
    .trim()
    .max(max, `${nombre} es muy largo`)
    .transform((v) => v || null);

const requerido = (max: number, nombre: string) =>
  z.string().trim().min(1, `Falta ${nombre.toLowerCase()}`).max(max, `${nombre} es muy largo`);

export const direccionRecibida = z.object({
  id: z.number().int().positive().optional(),
  alias: texto(60, "El alias"),
  calleNumero: requerido(150, "La calle y número"),
  barrio: texto(100, "El barrio"),
  localidad: requerido(100, "La localidad"),
  provincia: requerido(100, "La provincia"),
  referencias: texto(255, "Las referencias"),
  esPrincipal: z.boolean(),
});

export type DireccionValidada = z.infer<typeof direccionRecibida>;

type Resultado = { ok: true; direcciones: DireccionValidada[] } | { ok: false; error: string };

// Valida las direcciones del formulario y deja exactamente una principal (si hay alguna).
export function validarDirecciones(json: string): Resultado {
  let crudo: unknown;
  try {
    crudo = JSON.parse(json);
  } catch {
    return { ok: false, error: "No se pudieron leer las direcciones" };
  }
  if (!Array.isArray(crudo)) return { ok: false, error: "No se pudieron leer las direcciones" };

  const resultado: DireccionValidada[] = [];
  for (const [i, d] of crudo.entries()) {
    const leida = direccionRecibida.safeParse(d);
    if (!leida.success) {
      return { ok: false, error: `Dirección ${i + 1}: ${leida.error.issues[0]?.message ?? "datos inválidos"}` };
    }
    resultado.push(leida.data);
  }
  const principal = Math.max(0, resultado.findIndex((d) => d.esPrincipal));
  resultado.forEach((d, i) => (d.esPrincipal = i === principal));
  return { ok: true, direcciones: resultado };
}

// Una línea para guardar en el pedido: "Av. Siempre Viva 742, Centro, Rosario, Santa Fe (timbre 2)".
export function textoDireccion(d: Omit<DireccionValidada, "esPrincipal" | "id" | "alias">): string {
  const partes = [d.calleNumero, d.barrio, d.localidad, d.provincia].filter(Boolean).join(", ");
  return (d.referencias ? `${partes} (${d.referencias})` : partes).slice(0, 400);
}
