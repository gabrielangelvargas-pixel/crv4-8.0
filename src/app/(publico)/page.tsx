import Link from "next/link";
import { Fragment, type CSSProperties } from "react";
import { BotonEnlace } from "@/components/ui";
import { usuarioActual } from "@/lib/auth/dal";
import { tienePermiso } from "@/lib/auth/permisos";
import { listarCatalogo, rubrosMasVisitados } from "@/lib/catalogo";
import { listarBloques, obtenerAviso, obtenerBloqueRubros, obtenerFranja, portadasActivas } from "@/lib/gestion/portadas";
import { IconoBloque } from "@/components/iconos-bloques";
import { Franja } from "@/components/franja";
import { lineasDeTexto } from "@/lib/iconos-bloque";
import { avisoVigente, frasesDeTexto, hoyEnArgentina } from "@/lib/promociones";
import { urlImagen } from "@/lib/imagenes";
import { TarjetaProducto } from "./catalogo/tarjeta-producto";
import { AvisoEmergente } from "./aviso-emergente";
import { SliderPortada } from "./slider-portada";

// Lee los destacados de la base en cada visita (no se arma en el build).
export const dynamic = "force-dynamic";


export default async function Inicio() {
  const [catalogo, portadas, bloques, franja, bloqueRubros, aviso, usuario] = await Promise.all([
    listarCatalogo({ destacados: true }),
    portadasActivas(),
    listarBloques(true),
    obtenerFranja(),
    obtenerBloqueRubros(),
    obtenerAviso(),
    usuarioActual(),
  ]);
  const masVisitados = bloqueRubros.activo ? await rubrosMasVisitados() : [];
  const destacados = catalogo.filas.slice(0, 8);
  const mostrarAviso = aviso.activo && avisoVigente(aviso.desde, aviso.hasta, hoyEnArgentina());
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
        // En celular van de a dos (el último ocupa todo el ancho si son impares); desde
        // escritorio, todos en una fila con el mismo ancho, hasta cuatro por fila.
        <section
          aria-label="Cómo compramos"
          style={{ "--columnas": Math.min(bloques.length, 4) } as CSSProperties}
          className="grid auto-rows-fr grid-cols-2 gap-3 md:gap-4 lg:grid-cols-[repeat(var(--columnas),minmax(0,1fr))]"
        >
          {bloques.map((b) => (
            <div
              key={b.id}
              className="flex flex-col items-center gap-2 rounded-2xl border border-borde bg-superficie px-3 py-5 text-center shadow-sm last:odd:col-span-2 md:px-5 lg:last:odd:col-span-1"
            >
              <span className="flex size-12 items-center justify-center rounded-full bg-fondo text-marca md:size-14">
                <IconoBloque icono={b.icono} className="size-6 md:size-7" />
              </span>
              <h2 className="text-sm font-bold tracking-wide uppercase">{b.titulo}</h2>
              {b.texto && (
                <p className="text-sm text-texto-suave">
                  {lineasDeTexto(b.texto).map((linea, i) => (
                    <Fragment key={i}>
                      {i > 0 && <br />}
                      {linea}
                    </Fragment>
                  ))}
                </p>
              )}
            </div>
          ))}
        </section>
      )}
      {franja.activo && (
        <Franja
          frases={frasesDeTexto(franja.frases)}
          icono={franja.icono}
          colorFondo={franja.colorFondo}
          colorTexto={franja.colorTexto}
          className="-mx-4 md:mx-0 md:rounded-2xl"
        />
      )}
      {masVisitados.length > 0 && (
        <section className="flex flex-col gap-3">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-xl font-semibold tracking-tight">{bloqueRubros.titulo}</h2>
            <Link href="/catalogo" className="text-sm text-marca hover:underline">Ver catálogo</Link>
          </div>
          <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {masVisitados.map((r) => {
              const foto = urlImagen(r.imagen, r.actualizadoEn);
              return (
                <li key={r.id}>
                  <Link
                    href={`/catalogo?rubro=${r.slug}`}
                    className="group flex h-full flex-col overflow-hidden rounded-2xl border border-borde bg-superficie shadow-sm hover:border-marca"
                  >
                    <div className="aspect-square overflow-hidden bg-marca-suave">
                      {foto ? (
                        // eslint-disable-next-line @next/next/no-img-element -- la imagen ya está optimizada a 600x600 WEBP
                        <img src={foto} alt="" loading="lazy" className="size-full object-cover transition-transform duration-300 group-hover:scale-105" />
                      ) : (
                        <div className="flex size-full items-center justify-center text-4xl font-bold text-marca/40">{r.nombre.charAt(0)}</div>
                      )}
                    </div>
                    <span className="px-3 py-3 text-center text-sm font-semibold md:text-base">{r.nombre}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
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
      {mostrarAviso && (
        <AvisoEmergente
          clave={`${aviso.actualizadoEn.getTime()}`}
          frecuencia={aviso.frecuencia}
          titulo={aviso.titulo}
          texto={aviso.texto}
          imagen={urlImagen(aviso.imagen, aviso.actualizadoEn)}
          botonTexto={aviso.botonTexto}
          enlace={aviso.enlace}
        />
      )}
    </div>
  );
}
