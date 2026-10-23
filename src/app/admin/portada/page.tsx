import Link from "next/link";
import { BotonEnlace, EncabezadoPagina, Insignia, Tarjeta } from "@/components/ui";
import { requerirPermiso } from "@/lib/auth/dal";
import { tienePermiso } from "@/lib/auth/permisos";
import { listarPortadas } from "@/lib/gestion/portadas";
import { urlImagen } from "@/lib/imagenes";

export const metadata = { title: "Portada de la web · CRV4" };

export default async function PortadasPage() {
  const usuario = await requerirPermiso("portada", "ver");
  const lista = await listarPortadas();

  return (
    <>
      <EncabezadoPagina
        titulo="Portada de la web"
        descripcion="Imágenes que pasan solas en el inicio de la web, en el orden indicado."
        acciones={
          <>
            <BotonEnlace href="/" variante="secundario">Ver la web</BotonEnlace>
            {tienePermiso(usuario, "portada", "crear") && <BotonEnlace href="/admin/portada/nueva">Nueva imagen</BotonEnlace>}
          </>
        }
      />
      {lista.length === 0 ? (
        <Tarjeta className="text-sm text-texto-suave">
          Todavía no hay imágenes: el inicio muestra el cartel azul. Carga la primera con “Nueva imagen”.
        </Tarjeta>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {lista.map((p) => (
            <li key={p.id}>
              <Link href={`/admin/portada/${p.id}`} className="flex flex-col overflow-hidden rounded-xl border border-borde bg-superficie hover:border-marca">
                {/* eslint-disable-next-line @next/next/no-img-element -- la imagen ya está optimizada */}
                <img src={urlImagen(p.imagenEscritorio, p.actualizadoEn)!} alt="" className="aspect-[3/1] w-full object-cover" loading="lazy" />
                <div className="flex items-center justify-between gap-2 p-3 text-sm">
                  <span className="truncate font-medium">{p.titulo || `Imagen ${p.id}`}</span>
                  <span className="flex shrink-0 items-center gap-2">
                    <span className="text-texto-suave">Orden {p.orden}</span>
                    {p.activo ? <Insignia tono="exito">Activa</Insignia> : <Insignia>Oculta</Insignia>}
                  </span>
                </div>
                {!p.imagenMovil && (
                  <p className="px-3 pb-3 text-xs text-amber-800">
                    Sin imagen cuadrada: no se ve en el celular mientras otra la tenga.
                  </p>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
