import { leerDecimal } from "@/lib/numeros";

export type TipoCarga = "ingreso" | "ajuste";

export const NOMBRE_MOVIMIENTO = {
  ingreso: "Ingreso",
  ajuste: "Ajuste",
  entrega_pedido: "Entrega de pedido",
  devolucion: "Devolución",
} as const;

// Las cantidades tienen 3 decimales: se calcula en milésimas para no arrastrar errores de coma flotante.
const aMilesimas = (valor: string) => Math.round(Number(valor) * 1000);
const deMilesimas = (valor: number) => (valor / 1000).toFixed(3);

type Resultado = { ok: true; cantidad: string; stockNuevo: string } | { ok: false; error: string };

// Ingreso: `valor` es lo que entra. Ajuste: `valor` es el stock contado, y el
// movimiento registra la diferencia con el stock que figuraba.
export function calcularMovimiento(tipo: TipoCarga, stockAnterior: string, valor: string): Resultado {
  const numero = leerDecimal(valor, 3);
  if (numero === null) return { ok: false, error: "Escribe una cantidad válida" };
  const anterior = aMilesimas(stockAnterior);
  const ingresado = aMilesimas(numero);

  if (tipo === "ingreso") {
    if (ingresado <= 0) return { ok: false, error: "La cantidad que ingresa tiene que ser mayor que cero" };
    return { ok: true, cantidad: deMilesimas(ingresado), stockNuevo: deMilesimas(anterior + ingresado) };
  }
  if (ingresado === anterior) return { ok: false, error: "El stock contado es igual al actual: no hay nada que ajustar" };
  return { ok: true, cantidad: deMilesimas(ingresado - anterior), stockNuevo: deMilesimas(ingresado) };
}
