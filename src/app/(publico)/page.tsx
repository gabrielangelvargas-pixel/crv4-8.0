import Link from "next/link";
import { BotonEnlace } from "@/components/ui";
import { usuarioActual } from "@/lib/auth/dal";
import { tienePermiso } from "@/lib/auth/permisos";
import { listarCatalogo } from "@/lib/catalogo";
import { listarBloques, portadasActivas } from "@/lib/gestion/portadas";
import { IconoBloque } from "@/components/iconos-bloques";
import { urlImagen } from "@/lib/imagenes";
import { TarjetaProducto } from "./catalogo/tarjeta-producto";
import { SliderPortada } from "./slider-portada";

// Lee los destacados de la base en cada visita (no se arma en el build).
export const dynamic = "force-dynamic";


export default async function Inicio() {
  const [catalogo, portadas, bloques, usuario] = await Promise.all([
    listarCatalogo({ destacados: true }),
    portadasActivas(),
    listarBloques(true),
    usuarioActual(),
  ]);
  const destacados = catalogo.filas.slice(0, 8);
  const puedeEditar = usuario?.accesoGestion && tienePermiso(usuario, "portada", "ver");
  return (
    <div className="flex flex-col gap-8 md:gap-12">
      {puedeEditar && (
        <div className="-mb-4 flex justify-end md:-mb-8">
          <Link href="/admin/portada" className="text-sm text-marca hover:underline">
            Editar portada
          </Link>
        </div>
      )}
      {portadas.length > 0 ? (
        <>
          <h1 className="sr-only">CRV4 Mayorista</h1>
          <SliderPortada
            diapositivas={portadas.map((p) => ({
              id: p.id,
              escritorio: urlImagen(p.imagenEscritorio, p.actualizadoEn)!,
              movil: urlImagen(p.imagenMovil, p.actualizadoEn),
              titulo: p.titulo,
              enlace: p.enlace,
            }))}
          />
        </>
      ) : (
        <section className="rounded-2xl bg-marca px-5 py-10 text-white md:px-12 md:py-16">
          <h1 className="max-w-xl text-3xl font-bold tracking-tight md:text-5xl">Todo para tu negocio, al por mayor</h1>
          <p className="mt-3 max-w-lg text-base text-blue-100 md:text-lg">
            Consulta el catálogo, arma tu pedido y nosotros lo preparamos.
          </p>
          <BotonEnlace href="/catalogo" variante="secundario" className="mt-6 w-full sm:w-auto">
            Ver catálogo
          </BotonEnlace>
        </section>
      )}
      {bloques.length > 0 && (
        <section aria-label="Cómo compramos" className="-mt-2 grid gap-x-6 gap-y-4 rounded-2xl border border-borde bg-superficie px-4 py-5 sm:grid-cols-2 md:-mt-4 md:px-8 lg:grid-cols-4">
          {bloques.map((b) => (
            <div key={b.id} className="flex items-start gap-3">
              <IconoBloque icono={b.icono} className="size-9 shrink-0 text-texto" />
              <div className="min-w-0">
                <h2 className="text-sm font-bold tracking-wide uppercase">{b.titulo}</h2>
                {b.texto && <p className="mt-0.5 text-sm text-texto-suave">{b.texto}</p>}
              </div>
            </div>
          ))}
        </section>
      )}
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
    </div>
  );
}
