// Íconos disponibles para los bloques de información de la portada (la clave se guarda en la base).
export const ICONOS_BLOQUE = [
  "cajas",
  "etiqueta",
  "billetera",
  "camion",
  "tarjeta",
  "tienda",
  "reloj",
  "escudo",
  "telefono",
  "ubicacion",
  "regalo",
  "estrella",
] as const;
export type ClaveIcono = (typeof ICONOS_BLOQUE)[number];

export const NOMBRE_ICONO: Record<ClaveIcono, string> = {
  cajas: "Cajas",
  etiqueta: "Etiqueta / descuento",
  billetera: "Billetera / pagos",
  camion: "Camión / envíos",
  tarjeta: "Tarjeta",
  tienda: "Local",
  reloj: "Reloj / horarios",
  escudo: "Escudo / compra segura",
  telefono: "Teléfono",
  ubicacion: "Ubicación",
  regalo: "Regalo",
  estrella: "Estrella",
};
