import Link from "next/link";
import { BotonEnlace, Tarjeta } from "@/components/ui";
import { listarCatalogo } from "@/lib/catalogo";
import { TarjetaProducto } from "./catalogo/tarjeta-producto";

// Lee los destacados de la base en cada visita (no se arma en el build).
export const dynamic = "force-dynamic";

const DESTACADOS = [
  { titulo: "Catálogo por rubros", texto: "Encuentra los productos filtrando por rubro y subrubro." },
  { titulo: "Pedidos online", texto: "Arma tu carrito y confirma el pedido desde el celular." },
  { titulo: "Retiro o envío", texto: "Retira en el local o recíbelo en la dirección que elijas." },
];

export default async function Inicio() {
  const destacados = (await listarCatalogo({ destacados: true })).filas.slice(0, 8);
  return (
    <div className="flex flex-col gap-8 md:gap-12">
      <section className="rounded-2xl bg-marca px-5 py-10 text-white md:px-12 md:py-16">
        <h1 className="max-w-xl text-3xl font-bold tracking-tight md:text-5xl">Todo para tu negocio, al por mayor</h1>
        <p className="mt-3 max-w-lg text-base text-blue-100 md:text-lg">
          Consulta el catálogo, arma tu pedido y nosotros lo preparamos.
        </p>
        <BotonEnlace href="/catalogo" variante="secundario" className="mt-6 w-full sm:w-auto">
          Ver catálogo
        </BotonEnlace>
      </section>
      {destacados.length > 0 && (
        <section className="flex flex-col gap-3">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-xl font-semibold tracking-tight">Destacados</h2>
            <Link href="/catalogo" className="text-sm text-marca hover:underline">Ver todo</Link>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {destacados.map((p) => (
              <TarjetaProducto key={p.id} producto={p} />
            ))}
          </div>
        </section>
      )}
      <section className="grid gap-3 sm:grid-cols-3">
        {DESTACADOS.map((d) => (
          <Tarjeta key={d.titulo}>
            <h2 className="font-semibold">{d.titulo}</h2>
            <p className="mt-1 text-sm text-texto-suave">{d.texto}</p>
          </Tarjeta>
        ))}
      </section>
    </div>
  );
}
