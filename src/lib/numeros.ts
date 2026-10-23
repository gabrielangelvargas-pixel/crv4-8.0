// Importes y cantidades se guardan como DECIMAL y viajan como string ("1234.50").

const formatoPrecio = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" });
const formatoCantidad = new Intl.NumberFormat("es-AR", { maximumFractionDigits: 3 });

// Lee un número escrito a mano: "1.234,50", "1234,5", "1234.50" o "$ 1.234".
// Devuelve el string para DECIMAL con `decimales` dígitos, o null si no es válido.
export function leerDecimal(texto: string, decimales = 2): string | null {
  let limpio = texto.replace(/[\s$]/g, "");
  if (limpio === "") return null;
  if (limpio.includes(",")) {
    // Con coma decimal, los puntos son separadores de miles.
    limpio = limpio.replace(/\./g, "").replace(",", ".");
  } else if (/^\d{1,3}(\.\d{3})+$/.test(limpio)) {
    // "1.234" o "12.345.678": puntos de miles sin parte decimal.
    limpio = limpio.replace(/\./g, "");
  }
  if (!/^\d+(\.\d+)?$/.test(limpio)) return null;
  const valor = Number(limpio);
  if (!Number.isFinite(valor) || valor >= 1e10) return null;
  return valor.toFixed(decimales);
}

export function formatearPrecio(valor: string | number): string {
  return formatoPrecio.format(Number(valor));
}

export function formatearCantidad(valor: string | number): string {
  return formatoCantidad.format(Number(valor));
}

// Para mostrar un importe en un campo editable: "1234.50" -> "1234,50".
export function importeParaCampo(valor: string | null | undefined): string {
  if (valor === null || valor === undefined) return "";
  return Number(valor).toFixed(2).replace(".", ",");
}

// Cantidad con signo para un historial: "+2,5" o "−3".
export function formatearCantidadConSigno(valor: string | number): string {
  const n = Number(valor);
  return `${n > 0 ? "+" : n < 0 ? "−" : ""}${formatoCantidad.format(Math.abs(n))}`;
}

const formatoFecha = new Intl.DateTimeFormat("es-AR", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "America/Argentina/Buenos_Aires",
});

export function formatearFecha(fecha: Date): string {
  return formatoFecha.format(fecha);
}
