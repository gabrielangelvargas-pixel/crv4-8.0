import Link from "next/link";
import { notFound } from "next/navigation";
import { InsigniaEstado } from "@/app/admin/pedidos/estado";
import { Aviso } from "@/components/ui";
import { requerirCliente } from "@/lib/auth/dal";
import { pedidoDelCliente } from "@/lib/mis-pedidos";
import { formatearCantidad, formatearFecha, formatearPrecio } from "@/lib/numeros";
import { VaciarCarrito } from "./vaciar-carrito";

export const metadata = { title: "Mi pedido · CRV4 Mayorista" };

export default async function MiPedidoPage({ params, searchParams }: PageProps<"/cuenta/pedidos/[numero]">) {
  const usuario = await requerirCliente();
  const numero = Number((await params).numero);
  const pedido = usuario.clienteId && Number.isInteger(numero) && numero > 0 ? await pedidoDelCliente(usuario.clienteId, numero) : null;
  if (!pedido) notFound();
  const nuevo = (await searchParams).nuevo === "1";

  return (
    <div className="flex flex-col gap-4">
      {nuevo && (
        <>
          <VaciarCarrito />
          <Aviso>¡Gracias! Recibimos tu pedido. Te vamos a contactar para confirmarlo.</Aviso>
        </>
      )}
      <nav className="text-sm text-texto-suave">
        <Link href="/cuenta" className="hover:text-marca">
          Mi cuenta
        </Link>{" "}
        › Pedido N.º {pedido.numero}
      </nav>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Pedido N.º {pedido.numero}</h1>
        <InsigniaEstado estado={pedido.estado} />
      </div>
      <p className="text-sm text-texto-suave">
        {formatearFecha(pedido.creadoEn)} · {pedido.tipoEntrega === "envio" ? `Envío a ${pedido.direccionTexto ?? "tu dirección"}` : "Retiro en el local"}
      </p>
      <ul className="flex flex-col divide-y divide-borde rounded-xl border border-borde bg-superficie">
        {pedido.items.map((i) => (
          <li key={i.id} className="flex items-start justify-between gap-3 p-4 text-sm">
            <span>
              <span className="block font-medium">{i.descripcion}</span>
              <span className="text-texto-suave">
                {formatearCantidad(i.cantidad)} × {formatearPrecio(i.precioUnitario)}
              </span>
            </span>
            <span className="font-medium tabular-nums">{formatearPrecio(i.subtotal)}</span>
          </li>
        ))}
        {Number(pedido.adicional) !== 0 && (
          <li className="flex justify-between gap-3 p-4 text-sm">
            <span>{pedido.adicionalDetalle ?? "Adicional"}</span>
            <span className="font-medium tabular-nums">{formatearPrecio(pedido.adicional)}</span>
          </li>
        )}
        <li className="flex items-baseline justify-between gap-3 p-4">
          <span className="text-sm text-texto-suave">Total</span>
          <span className="text-xl font-semibold tabular-nums">{formatearPrecio(pedido.total)}</span>
        </li>
      </ul>
      {pedido.notasCliente && (
        <p className="text-sm">
          <span className="font-medium">Tus notas:</span> {pedido.notasCliente}
        </p>
      )}
    </div>
  );
}
