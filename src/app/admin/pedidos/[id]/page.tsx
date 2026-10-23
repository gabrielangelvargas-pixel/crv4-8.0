import Link from "next/link";
import { notFound } from "next/navigation";
import { Aviso, Boton, BotonEnlace, EncabezadoPagina, TablaResponsiva, Tarjeta } from "@/components/ui";
import { requerirPermiso } from "@/lib/auth/dal";
import { tienePermiso } from "@/lib/auth/permisos";
import { obtenerPedido } from "@/lib/gestion/pedidos";
import { formatearCantidad, formatearFecha, formatearPrecio } from "@/lib/numeros";
import { estadosSiguientes, NOMBRE_ESTADO, type EstadoPedido } from "@/lib/pedidos";
import { cambiarEstado, eliminarPedido, guardarDatosPedido } from "../actions";
import { InsigniaEstado } from "../estado";
import { DatosPedidoForm } from "./datos-form";

export const metadata = { title: "Pedido · CRV4" };

const ERRORES: Record<string, string> = {
  invalido: "Ese cambio de estado ya no es posible. Revisa el estado actual del pedido.",
  "sin-permiso": "Tu rol no puede anular una venta entregada.",
  "con-stock": "No se puede eliminar porque ya movió stock. Puedes cancelarlo o anularlo.",
};

function etiquetaBoton(actual: EstadoPedido, nuevo: EstadoPedido): string {
  if (nuevo === "cancelado") return actual === "entregado" ? "Anular venta y devolver stock" : "Cancelar pedido";
  if (nuevo === "entregado") return "Marcar entregado (descuenta stock)";
  return `Pasar a ${NOMBRE_ESTADO[nuevo].toLowerCase()}`;
}

export default async function PedidoPage({ params, searchParams }: PageProps<"/admin/pedidos/[id]">) {
  const usuario = await requerirPermiso("pedidos", "ver");
  const id = Number((await params).id);
  const pedido = Number.isInteger(id) ? await obtenerPedido(id) : null;
  if (!pedido) notFound();

  const { nueva, error, guardado } = await searchParams;
  const verCosto = usuario.accesoTotal;
  const puedeEditar = tienePermiso(usuario, "pedidos", "editar");
  const puedeEliminar = tienePermiso(usuario, "pedidos", "eliminar");
  const siguientes = puedeEditar
    ? estadosSiguientes(pedido.estado).filter((e) => !(pedido.estado === "entregado" && !puedeEliminar && e === "cancelado"))
    : [];
  const avanzar = siguientes.filter((e) => e !== "cancelado");
  const cancelar = siguientes.includes("cancelado");
  const margen = Number(pedido.subtotal) - Number(pedido.subtotalCosto);

  return (
    <>
      <EncabezadoPagina
        titulo={`${pedido.canal === "presencial" ? "Venta" : "Pedido"} N.º ${pedido.numero}`}
        descripcion={
          <span className="inline-flex flex-wrap items-center gap-2">
            <InsigniaEstado estado={pedido.estado} />
            {pedido.canal === "web" ? "Pedido web" : "Venta en el local"} · {formatearFecha(pedido.creadoEn)}
            {pedido.atendidoPorNombre && ` · atendió ${pedido.atendidoPorNombre}`}
          </span>
        }
        acciones={
          nueva &&
          tienePermiso(usuario, "pedidos", "crear") && (
            <BotonEnlace href="/admin/pedidos/nueva-venta">Otra venta</BotonEnlace>
          )
        }
      />
      {nueva && <Aviso>Venta registrada y stock descontado.</Aviso>}
      {guardado && <Aviso>Cambios guardados.</Aviso>}
      {typeof error === "string" && ERRORES[error] && <Aviso tipo="error">{ERRORES[error]}</Aviso>}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
        <div className="flex flex-col gap-4">
          <TablaResponsiva
            filas={pedido.items}
            clave={(i) => i.id}
            columnas={[
              {
                titulo: "Producto",
                principal: true,
                celda: (i) => (
                  <>
                    {i.descripcion}
                    <p className="font-normal text-texto-suave">{i.codigo}</p>
                  </>
                ),
              },
              { titulo: "Cantidad", celda: (i) => formatearCantidad(i.cantidad) },
              { titulo: "Precio", celda: (i) => formatearPrecio(i.precioUnitario) },
              ...(verCosto ? [{ titulo: "Costo", celda: (i: (typeof pedido.items)[number]) => formatearPrecio(i.precioCosto) }] : []),
              { titulo: "Subtotal", celda: (i) => <span className="font-semibold">{formatearPrecio(i.subtotal)}</span> },
            ]}
          />
          <Tarjeta>
            <dl className="flex flex-col gap-1 text-sm sm:ml-auto sm:max-w-xs">
              <div className="flex justify-between gap-6">
                <dt className="text-texto-suave">Subtotal</dt>
                <dd>{formatearPrecio(pedido.subtotal)}</dd>
              </div>
              {Number(pedido.adicional) !== 0 && (
                <div className="flex justify-between gap-6">
                  <dt className="text-texto-suave">{pedido.adicionalDetalle ?? "Adicional"}</dt>
                  <dd>{formatearPrecio(pedido.adicional)}</dd>
                </div>
              )}
              <div className="flex justify-between gap-6 text-lg font-semibold">
                <dt>Total</dt>
                <dd>{formatearPrecio(pedido.total)}</dd>
              </div>
              {verCosto && (
                <div className="mt-2 flex justify-between gap-6 border-t border-borde pt-2 text-texto-suave">
                  <dt>Costo · margen</dt>
                  <dd>
                    {formatearPrecio(pedido.subtotalCosto)} · {formatearPrecio(margen)}
                  </dd>
                </div>
              )}
            </dl>
          </Tarjeta>
          {pedido.notasCliente && (
            <Tarjeta>
              <h2 className="text-sm font-semibold">Nota del cliente</h2>
              <p className="mt-1 text-sm whitespace-pre-line">{pedido.notasCliente}</p>
            </Tarjeta>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <Tarjeta className="flex flex-col gap-1 text-sm">
            <h2 className="font-semibold">Cliente</h2>
            {tienePermiso(usuario, "clientes", "ver") ? (
              <Link href={`/admin/clientes/${pedido.cliente.id}`} className="text-marca hover:underline">
                {pedido.cliente.nombre}
              </Link>
            ) : (
              <p>{pedido.cliente.nombre}</p>
            )}
            {/\d/.test(pedido.cliente.telefono) && (
              <a href={`tel:${pedido.cliente.telefono}`} className="hover:underline">
                {pedido.cliente.telefono}
              </a>
            )}
            <p className="mt-2 text-texto-suave">
              {pedido.tipoEntrega === "envio" ? `Envío a: ${pedido.direccionTexto ?? "sin dirección"}` : "Retira en el local"}
            </p>
          </Tarjeta>

          {(avanzar.length > 0 || cancelar) && (
            <Tarjeta className="flex flex-col gap-2">
              <h2 className="font-semibold">Estado</h2>
              {avanzar.map((e) => (
                <form key={e} action={cambiarEstado.bind(null, pedido.id, e)}>
                  <Boton variante={e === avanzar[0] ? "primario" : "secundario"} className="w-full">
                    {etiquetaBoton(pedido.estado, e)}
                  </Boton>
                </form>
              ))}
              {cancelar && (
                <form action={cambiarEstado.bind(null, pedido.id, "cancelado")}>
                  <Boton variante="peligro" className="w-full">
                    {etiquetaBoton(pedido.estado, "cancelado")}
                  </Boton>
                </form>
              )}
            </Tarjeta>
          )}

          {puedeEditar ? (
            <DatosPedidoForm
              accion={guardarDatosPedido.bind(null, pedido.id)}
              notasInternas={pedido.notasInternas}
              adicional={pedido.adicional}
              adicionalDetalle={pedido.adicionalDetalle}
              adicionalEditable={pedido.estado !== "entregado" && pedido.estado !== "cancelado"}
            />
          ) : (
            pedido.notasInternas && (
              <Tarjeta>
                <h2 className="text-sm font-semibold">Notas internas</h2>
                <p className="mt-1 text-sm whitespace-pre-line">{pedido.notasInternas}</p>
              </Tarjeta>
            )
          )}

          {puedeEliminar && (pedido.estado === "pendiente" || pedido.estado === "cancelado") && (
            <form action={eliminarPedido.bind(null, pedido.id)}>
              <button className="text-sm text-peligro hover:underline">Eliminar definitivamente</button>
            </form>
          )}
          <Link href="/admin/pedidos" className="text-sm text-texto-suave hover:text-marca">
            Volver a Pedidos y ventas
          </Link>
        </div>
      </div>
    </>
  );
}
