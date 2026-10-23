import Link from "next/link";
import { notFound } from "next/navigation";
import { Aviso, EncabezadoPagina, TablaResponsiva, Tarjeta } from "@/components/ui";
import { requerirPermiso } from "@/lib/auth/dal";
import { tienePermiso } from "@/lib/auth/permisos";
import { movimientosDeVariante, obtenerVarianteStock } from "@/lib/gestion/stock";
import { formatearCantidad, formatearCantidadConSigno, formatearFecha } from "@/lib/numeros";
import { registrarMovimiento } from "../actions";
import { CargaForm } from "../carga-form";
import { NOMBRE_MOVIMIENTO } from "../datos";

export const metadata = { title: "Stock · CRV4" };

export default async function StockVariantePage({ params, searchParams }: PageProps<"/admin/stock/[id]">) {
  const usuario = await requerirPermiso("stock", "ver");
  const id = Number((await params).id);
  const variante = Number.isInteger(id) ? await obtenerVarianteStock(id) : null;
  if (!variante) notFound();

  const { registrado } = await searchParams;
  const movimientos = await movimientosDeVariante(id);
  const titulo = variante.tipoVariante === "ninguna" ? variante.producto : `${variante.producto} · ${variante.valor}`;

  return (
    <>
      <EncabezadoPagina
        titulo={titulo}
        descripcion={
          <>
            Código {variante.codigo}
            {tienePermiso(usuario, "productos", "ver") && (
              <>
                {" · "}
                <Link href={`/admin/productos/${variante.productoId}`} className="text-marca hover:underline">
                  Ver ficha del producto
                </Link>
              </>
            )}
          </>
        }
      />
      {registrado && (
        <Aviso>{registrado === "ajuste" ? "Ajuste registrado." : "Ingreso registrado."}</Aviso>
      )}
      <div className="grid gap-5 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:items-start">
        <div className="flex flex-col gap-4">
          <Tarjeta>
            <p className="text-sm text-texto-suave">Stock actual</p>
            <p className={`text-4xl font-semibold ${Number(variante.stock) <= 0 ? "text-peligro" : ""}`}>
              {formatearCantidad(variante.stock)}
            </p>
          </Tarjeta>
          {tienePermiso(usuario, "stock", "crear") && (
            <CargaForm accion={registrarMovimiento.bind(null, variante.id)} stockActual={formatearCantidad(variante.stock)} />
          )}
          <Link href="/admin/stock" className="text-sm text-texto-suave hover:text-marca">
            Volver a Stock
          </Link>
        </div>
        <section className="flex flex-col gap-3">
          <h2 className="font-semibold">Historial</h2>
          <TablaResponsiva
            filas={movimientos}
            clave={(m) => m.id}
            vacio="Todavía no hay movimientos."
            columnas={[
              {
                titulo: "Movimiento",
                principal: true,
                celda: (m) => (
                  <>
                    <span>{NOMBRE_MOVIMIENTO[m.tipo]}</span>{" "}
                    <span className={Number(m.cantidad) < 0 ? "text-peligro" : "text-exito"}>
                      {formatearCantidadConSigno(m.cantidad)}
                    </span>
                  </>
                ),
              },
              { titulo: "Fecha", celda: (m) => formatearFecha(m.fecha) },
              {
                titulo: "Stock",
                celda: (m) => `${formatearCantidad(m.stockAnterior)} → ${formatearCantidad(m.stockNuevo)}`,
              },
              { titulo: "Motivo", celda: (m) => m.motivo ?? (m.pedidoId ? `Pedido ${m.pedidoId}` : "—") },
              { titulo: "Usuario", celda: (m) => m.usuario },
            ]}
          />
        </section>
      </div>
    </>
  );
}
