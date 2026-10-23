// Franja de texto y aviso emergente del inicio (datos que comparten la base, Gestión y la web).
export const FRECUENCIAS_AVISO = ["siempre", "dia", "una_vez"] as const;
export type FrecuenciaAviso = (typeof FRECUENCIAS_AVISO)[number];

export const NOMBRE_FRECUENCIA: Record<FrecuenciaAviso, string> = {
  siempre: "Cada vez que entra a la web",
  dia: "Una vez por día",
  una_vez: "Una sola vez",
};

export const COLOR = /^#[0-9a-f]{6}$/i;
export const MAXIMO_FRASES = 10;

// Las frases de la franja se escriben una por renglón.
export function frasesDeTexto(texto: string): string[] {
  return texto
    .split(/\r?\n/)
    .map((f) => f.trim())
    .filter(Boolean)
    .slice(0, MAXIMO_FRASES);
}

// El aviso se muestra solo dentro de las fechas elegidas (ambas incluidas, "AAAA-MM-DD").
export function avisoVigente(desde: string | null, hasta: string | null, hoy: string): boolean {
  return (!desde || desde <= hoy) && (!hasta || hoy <= hasta);
}

// Fecha de hoy ("AAAA-MM-DD") en la hora de Argentina, sea cual sea la del servidor.
export function hoyEnArgentina(ahora = new Date()): string {
  return ahora.toLocaleDateString("sv-SE", { timeZone: "America/Argentina/Buenos_Aires" });
}
