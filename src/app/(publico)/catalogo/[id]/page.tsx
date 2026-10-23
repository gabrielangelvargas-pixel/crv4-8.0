import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Aviso } from "@/components/ui";
import { obtenerProductoWeb } from "@/lib/catalogo";
import { NOMBRE_TIPO_VARIANTE } from "@/app/admin/productos/datos";
import { Disponibilidad, Foto, Precio } from "../tarjeta-producto";

async function cargar(id: string) {
  const n = Number(id);
  return Number.isInteger(n) && n > 0 ? obtenerProductoWeb(n) : null;
}

export async function generateMetadata({ params }: PageProps<"/catalogo/[id]">): Promise<Metadata> {
  const producto = await cargar((await params).id);
  return { title: `${producto?.nombre ?? "Producto"} · CRV4 Mayorista` };
}

export default async function ProductoWebPage({ params }: PageProps<"/catalogo/[id]">) {
  const producto = await cargar((await params).id);
  if (!producto) notFound();
  const [principal] = producto.variantes;
  const conOpciones = producto.tipoVariante !== "ninguna" && producto.variantes.length > 1;

  return (
    <div className="flex flex-col gap-4">
      <nav aria-label="Ubicación" className="flex flex-wrap gap-1 text-sm text-texto-suave">
        <Link href="/catalogo" className="hover:text-marca">Catálogo</Link>
        {producto.rubroPadre?.slug && (
          <>
            <span>›</span>
            <Link href={`/catalogo?rubro=${producto.rubroPadre.slug}`} className="hover:text-marca">{producto.rubroPadre.nombre}</Link>
          </>
        )}
        <span>›</span>
        <Link href={`/catalogo?rubro=${producto.rubro.slug}`} className="hover:text-marca">{producto.rubro.nombre}</Link>
      </nav>

      <div className="grid gap-6 md:grid-cols-2 md:gap-10">
        <Foto imagen={producto.imagen} version={producto.actualizadoEn} className="rounded-xl border border-borde" />
        <div className="flex flex-col gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{producto.nombre}</h1>
            <p className="mt-1 text-sm text-texto-suave">Código {principal.codigo}</p>
          </div>
          {!conOpciones && (
            <div className="flex flex-col gap-1">
              <Precio venta={principal.precioVenta} oferta={principal.precioOferta} grande />
              <Disponibilidad disponible={principal.disponible} />
            </div>
          )}
          {conOpciones && (
            <section className="flex flex-col gap-2">
              <h2 className="text-sm font-medium">{NOMBRE_TIPO_VARIANTE[producto.tipoVariante]}</h2>
              <ul className="divide-y divide-borde rounded-xl border border-borde bg-superficie">
                {producto.variantes.map((v) => (
                  <li key={v.id} className="flex items-center justify-between gap-3 px-4 py-3">
                    <div>
                      <p className="font-medium">{v.valor}</p>
                      <Disponibilidad disponible={v.disponible} />
                    </div>
                    <Precio venta={v.precioVenta} oferta={v.precioOferta} />
                  </li>
                ))}
              </ul>
            </section>
          )}
          {producto.descripcion && <p className="text-sm whitespace-pre-line">{producto.descripcion}</p>}
          <Aviso>Muy pronto vas a poder agregarlo al carrito y hacer el pedido desde acá.</Aviso>
        </div>
      </div>
    </div>
  );
}
