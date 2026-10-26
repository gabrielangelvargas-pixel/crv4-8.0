import Link from "next/link";
import { InsigniaEstado } from "@/app/admin/pedidos/estado";
import { BotonSalir } from "@/components/boton-salir";
import { Tarjeta } from "@/components/ui";
import { requerirCliente } from "@/lib/auth/dal";
import { pedidosDelClienteWeb } from "@/lib/mis-pedidos";
import { formatearFecha, formatearPrecio } from "@/lib/numeros";

export const metadata = { title: "Mi cuenta · CRV4 Mayorista" };

export default async function CuentaPage() {
  const usuario = await requerirCliente();
  const pedidos = usuario.clienteId ? await pedidosDelClienteWeb(usuario.clienteId) : [];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Hola, {usuario.nombre}</h1>
        <BotonSalir className="inline-flex min-h-11 items-center rounded-lg border border-borde px-4 text-sm font-medium hover:bg-fondo" />
      </div>
      <h2 className="text-lg font-semibold">Mis pedidos</h2>
      {pedidos.length === 0 ? (
        <Tarjeta className="flex flex-col items-start gap-3 text-sm text-texto-suave">
          Todavía no hiciste pedidos.
          <Link href="/catalogo" className="font-medium text-marca underline underline-offset-4">
            Ver el catálogo
          </Link>
        </Tarjeta>
      ) : (
        <ul className="flex flex-col divide-y divide-borde rounded-xl border border-borde bg-superficie">
          {pedidos.map((p) => (
            <li key={p.numero}>
              <Link href={`/cuenta/pedidos/${p.numero}`} className="flex items-center justify-between gap-3 p-4 hover:bg-fondo">
                <span className="flex flex-col gap-1">
                  <span className="font-medium">Pedido N.º {p.numero}</span>
                  <span className="text-sm text-texto-suave">
                    {formatearFecha(p.creadoEn)} · {p.tipoEntrega === "envio" ? "Envío" : "Retiro"}
                  </span>
                </span>
                <span className="flex flex-col items-end gap-1">
                  <InsigniaEstado estado={p.estado} />
                  <span className="font-semibold tabular-nums">{formatearPrecio(p.total)}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
