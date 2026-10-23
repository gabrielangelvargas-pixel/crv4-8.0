import { Insignia } from "@/components/ui";
import { NOMBRE_ESTADO, type EstadoPedido } from "@/lib/pedidos";

const TONO: Record<EstadoPedido, "neutro" | "exito" | "alerta"> = {
  pendiente: "alerta",
  confirmado: "neutro",
  preparado: "neutro",
  listo_o_enviado: "neutro",
  entregado: "exito",
  cancelado: "neutro",
};

export function InsigniaEstado({ estado }: { estado: EstadoPedido }) {
  return <Insignia tono={TONO[estado]}>{NOMBRE_ESTADO[estado]}</Insignia>;
}
