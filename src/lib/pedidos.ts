import type { ESTADOS_PEDIDO } from "@/db/schema";

export type EstadoPedido = (typeof ESTADOS_PEDIDO)[number];

export const NOMBRE_ESTADO: Record<EstadoPedido, string> = {
  pendiente: "Pendiente",
  confirmado: "Confirmado",
  preparado: "Preparado",
  listo_o_enviado: "Listo / enviado",
  entregado: "Entregado",
  cancelado: "Cancelado",
};

const ORDEN: EstadoPedido[] = ["pendiente", "confirmado", "preparado", "listo_o_enviado", "entregado"];

// Un pedido avanza (puede saltear pasos) o se cancela. Entregado y cancelado son
// finales, salvo anular una entrega, que devuelve el stock.
export function estadosSiguientes(estado: EstadoPedido): EstadoPedido[] {
  if (estado === "cancelado") return [];
  if (estado === "entregado") return ["cancelado"];
  const i = ORDEN.indexOf(estado);
  return [...ORDEN.slice(i + 1), "cancelado"];
}

// Comprometido = lo que ya se prometió en pedidos que todavía no descontaron stock.
export const ESTADOS_QUE_COMPROMETEN: EstadoPedido[] = ["confirmado", "preparado", "listo_o_enviado"];

export type ItemParaCalcular = { cantidad: string; precioUnitario: string; precioCosto: string };

// Importes en centavos y cantidades en milésimas para no arrastrar errores de coma flotante.
const centavos = (v: string) => Math.round(Number(v) * 100);
const milesimas = (v: string) => Math.round(Number(v) * 1000);
const deCentavos = (v: number) => (v / 100).toFixed(2);

export function subtotalDe(cantidad: string, precio: string): string {
  return deCentavos(Math.round((milesimas(cantidad) * centavos(precio)) / 1000));
}

export function calcularTotales<T extends ItemParaCalcular>(items: T[], adicional: string) {
  let subtotal = 0;
  let subtotalCosto = 0;
  const conSubtotales = items.map((item) => {
    const venta = Math.round((milesimas(item.cantidad) * centavos(item.precioUnitario)) / 1000);
    const costo = Math.round((milesimas(item.cantidad) * centavos(item.precioCosto)) / 1000);
    subtotal += venta;
    subtotalCosto += costo;
    return { ...item, subtotal: deCentavos(venta), subtotalCosto: deCentavos(costo) };
  });
  return {
    items: conSubtotales,
    subtotal: deCentavos(subtotal),
    subtotalCosto: deCentavos(subtotalCosto),
    total: deCentavos(subtotal + centavos(adicional)),
  };
}
