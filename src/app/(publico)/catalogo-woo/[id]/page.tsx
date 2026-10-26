import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { Aviso } from "@/components/ui";
import { configWoo, ErrorWoo, productoWoo } from "@/lib/woocommerce";
import { Disponibilidad, Precio } from "../../catalogo/tarjeta-producto";

// Ficha de prueba de un producto leído de la tienda WooCommerce (se navega sin salir de CRV4).
const cargar = cache(async (id: string) => {
  const config = configWoo();
  const n = Number(id);
  if (!config || !Number.isInteger(n) || n <= 0) return null;
  try {
    return await productoWoo(config, n);
  } catch (error) {
    if (error instanceof ErrorWoo) return error;
    throw error;
  }
});

export async function generateMetadata({ params }: PageProps<"/catalogo-woo/[id]">): Promise<Metadata> {
  const producto = await cargar((await params).id);
  const nombre = producto && !(producto instanceof ErrorWoo) ? producto.nombre : "Producto";
  return { title: `${nombre} · CRV4 Mayorista`, robots: { index: false } };
}

export default async function ProductoWooPage({ params }: PageProps<"/catalogo-woo/[id]">) {
  const producto = await cargar((await params).id);
  if (producto instanceof ErrorWoo) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">Producto</h1>
        <Aviso tipo="error">{producto.message}</Aviso>
      </div>
    );
  }
  if (!producto) notFound();
  const conOpciones = producto.variaciones.length > 0;

  return (
    <div className="flex flex-col gap-4">
      <nav aria-label="Ubicación" className="flex flex-wrap gap-1 text-sm text-texto-suave">
        <Link href="/catalogo-woo" className="hover:text-marca">Catálogo</Link>
        {producto.categorias.map((c) => (
          <span key={c.slug} className="flex gap-1">
            <span>›</span>
            <Link href={`/catalogo-woo?categoria=${c.slug}`} className="hover:text-marca">{c.nombre}</Link>
          </span>
        ))}
      </nav>

      <div className="grid gap-6 md:grid-cols-2 md:gap-10">
        {producto.imagenes.length > 0 ? (
          <div className="flex snap-x snap-mandatory overflow-x-auto rounded-xl border border-borde bg-white [scrollbar-width:thin]">
            {producto.imagenes.map((src, i) => (
              // eslint-disable-next-line @next/next/no-img-element -- la imagen viene de la tienda WooCommerce
              <img
                key={src}
                src={src}
                alt={i === 0 ? producto.nombre : ""}
                loading={i === 0 ? "eager" : "lazy"}
                className="aspect-square w-full shrink-0 snap-center object-contain"
              />
            ))}
          </div>
        ) : (
          <div className="flex aspect-square items-center justify-center rounded-xl border border-borde bg-white text-xs text-texto-suave">
            Sin foto
          </div>
        )}
        <div className="flex flex-col gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{producto.nombre}</h1>
            {producto.codigo && <p className="mt-1 text-sm text-texto-suave">Código {producto.codigo}</p>}
            {producto.imagenes.length > 1 && <p className="mt-1 text-xs text-texto-suave">Deslizá la foto para ver {producto.imagenes.length - 1} más.</p>}
          </div>
          {!conOpciones && (
            <div className="flex flex-col gap-1">
              <Precio venta={producto.precioVenta} oferta={producto.precioOferta} grande />
              <Disponibilidad disponible={producto.disponible} />
            </div>
          )}
          {conOpciones && (
            <section className="flex flex-col gap-2">
              <h2 className="text-sm font-medium">Opciones</h2>
              <ul className="divide-y divide-borde rounded-xl border border-borde bg-superficie">
                {producto.variaciones.map((v) => (
                  <li key={v.id} className="flex items-center justify-between gap-3 px-4 py-3">
                    <div>
                      <p className="font-medium">{v.nombre || "Opción"}</p>
                      <Disponibilidad disponible={v.disponible} />
                    </div>
                    <Precio venta={v.precioVenta} oferta={v.precioOferta} />
                  </li>
                ))}
              </ul>
            </section>
          )}
          {producto.resumen && <p className="text-sm whitespace-pre-line">{producto.resumen}</p>}
          {producto.descripcion && <p className="text-sm whitespace-pre-line">{producto.descripcion}</p>}
          <Aviso>Muy pronto vas a poder agregarlo al carrito y hacer el pedido desde acá.</Aviso>
        </div>
      </div>
    </div>
  );
}
