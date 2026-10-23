// Íconos disponibles para los bloques de información de la portada (la clave se guarda en la base).
export const ICONOS_BLOQUE = [
  "cajas",
  "etiqueta",
  "billetera",
  "camion",
  "tarjeta",
  "atencion",
  "consultas",
  "acuerdo",
  "tienda",
  "reloj",
  "escudo",
  "telefono",
  "ubicacion",
  "regalo",
  "estrella",
  "corazon",
  "porcentaje",
  "fuego",
] as const;
export type ClaveIcono = (typeof ICONOS_BLOQUE)[number];

export const NOMBRE_ICONO: Record<ClaveIcono, string> = {
  cajas: "Cajas",
  etiqueta: "Etiqueta / descuento",
  billetera: "Billetera / pagos",
  camion: "Camión / envíos",
  tarjeta: "Tarjeta",
  atencion: "Atención al público",
  consultas: "Consultas / chat",
  acuerdo: "Apretón de manos",
  tienda: "Local",
  reloj: "Reloj / horarios",
  escudo: "Escudo / compra segura",
  telefono: "Teléfono",
  ubicacion: "Ubicación",
  regalo: "Regalo",
  estrella: "Estrella",
  corazon: "Corazón",
  porcentaje: "Porcentaje / oferta",
  fuego: "Fuego / lo más vendido",
};

// Un texto se corta en líneas con Enter o escribiendo <br>.
export function lineasDeTexto(texto: string): string[] {
  return texto.split(/<br\s*\/?>|\r?\n/i).map((l) => l.trim()).filter(Boolean);
}
