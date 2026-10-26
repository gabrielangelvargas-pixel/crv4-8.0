import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { obtenerProductoWeb } from "@/lib/catalogo";
import { NOMBRE_TIPO_VARIANTE } from "@/app/admin/productos/datos";
import { Disponibilidad, Foto, Precio } from "../tarjeta-producto";
import { AgregarAlCarrito } from "../../carrito/agregar-al-carrito";
import { FichaVariantes } from "./ficha-variantes";

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
  const descripcion = producto.descripcion && <p className="text-sm whitespace-pre-line">{producto.descripcion}</p>;

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

      {conOpciones ? (
        <FichaVariantes
          nombre={producto.nombre}
          titulo={NOMBRE_TIPO_VARIANTE[producto.tipoVariante]}
          ids={producto.variantes.map((v) => v.id)}
          disponibles={producto.variantes.map((v) => v.disponible)}
          codigos={producto.variantes.map((v) => v.codigo)}
          fotos={producto.variantes.map((v) => (
            <Foto
              key={v.id}
              imagen={v.imagen ?? producto.imagen}
              version={producto.actualizadoEn}
              className="rounded-xl border border-borde"
            />
          ))}
          opciones={producto.variantes.map((v) => (
            <span key={v.id} className="flex flex-1 items-center justify-between gap-3">
              <span>
                <span className="block font-medium">{v.valor}</span>
                <Disponibilidad disponible={v.disponible} />
              </span>
              <Precio venta={v.precioVenta} oferta={v.precioOferta} />
            </span>
          ))}
        >
          {descripcion}
        </FichaVariantes>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 md:gap-10">
          <Foto imagen={principal.imagen ?? producto.imagen} version={producto.actualizadoEn} className="rounded-xl border border-borde" />
          <div className="flex flex-col gap-4">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">{producto.nombre}</h1>
              <p className="mt-1 text-sm text-texto-suave">Código {principal.codigo}</p>
            </div>
            <div className="flex flex-col gap-1">
              <Precio venta={principal.precioVenta} oferta={principal.precioOferta} grande />
              <Disponibilidad disponible={principal.disponible} />
            </div>
            <AgregarAlCarrito varianteId={principal.id} disponible={principal.disponible} />
            {descripcion}
          </div>
        </div>
      )}
    </div>
  );
}
