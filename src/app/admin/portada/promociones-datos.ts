import { z } from "zod";
import { ICONOS_BLOQUE } from "@/lib/iconos-bloque";
import { COLOR, FRECUENCIAS_AVISO, frasesDeTexto } from "@/lib/promociones";

// Una página de la web ("/catalogo?rubro=vasos") o una dirección completa.
export const enlaceWeb = z
  .string()
  .max(255)
  .refine((v) => v.startsWith("/") || /^https?:\/\//.test(v), "El enlace tiene que empezar con / o con https://");

export const datosFranja = z
  .object({
    frases: z.string().max(600, "Las frases son muy largas (máximo 600 letras en total)"),
    icono: z.enum(ICONOS_BLOQUE, { error: "Elige un ícono" }),
    colorFondo: z.string().regex(COLOR, "Elige el color de fondo"),
    colorTexto: z.string().regex(COLOR, "Elige el color del texto"),
    activo: z.boolean(),
  })
  .transform((f) => ({ ...f, frases: frasesDeTexto(f.frases).join("\n") }))
  .refine((f) => !f.activo || f.frases !== "", "Escribe al menos una frase para mostrar la franja");

const fecha = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida").nullable();

export const datosAviso = z
  .object({
    titulo: z.string().max(80, "El título es muy largo (máximo 80 letras)").nullable(),
    texto: z.string().max(300, "El texto es muy largo (máximo 300 letras)").nullable(),
    botonTexto: z.string().max(30, "El texto del botón es muy largo (máximo 30 letras)").nullable(),
    enlace: enlaceWeb.nullable(),
    desde: fecha,
    hasta: fecha,
    frecuencia: z.enum(FRECUENCIAS_AVISO, { error: "Elige cada cuánto se muestra" }),
    activo: z.boolean(),
  })
  .refine((a) => !a.desde || !a.hasta || a.desde <= a.hasta, "La fecha “hasta” no puede ser anterior a “desde”")
  .refine((a) => !a.botonTexto || a.enlace, "El botón necesita un enlace");
