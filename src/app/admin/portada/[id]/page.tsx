import { notFound } from "next/navigation";
import { EncabezadoPagina } from "@/components/ui";
import { requerirPermiso } from "@/lib/auth/dal";
import { tienePermiso } from "@/lib/auth/permisos";
import { obtenerPortada } from "@/lib/gestion/portadas";
import { urlImagen } from "@/lib/imagenes";
import { editarPortada, eliminarPortada } from "../actions";
import { PortadaForm } from "../portada-form";

export const metadata = { title: "Imagen de portada · CRV4" };

export default async function PortadaPage({ params }: PageProps<"/admin/portada/[id]">) {
  const usuario = await requerirPermiso("portada", "ver");
  const id = Number((await params).id);
  const portada = Number.isInteger(id) ? await obtenerPortada(id) : null;
  if (!portada) notFound();

  return (
    <>
      <EncabezadoPagina titulo={portada.titulo || `Imagen ${portada.id}`} />
      <PortadaForm
        accion={editarPortada.bind(null, portada.id)}
        inicial={{
          ...portada,
          imagenEscritorio: urlImagen(portada.imagenEscritorio, portada.actualizadoEn),
          imagenMovil: urlImagen(portada.imagenMovil, portada.actualizadoEn),
        }}
        soloLectura={!tienePermiso(usuario, "portada", "editar")}
      />
      {tienePermiso(usuario, "portada", "eliminar") && (
        <form action={eliminarPortada.bind(null, portada.id)} className="flex flex-col items-start gap-2 rounded-xl border border-red-200 bg-superficie p-4 lg:max-w-4xl">
          <button className="inline-flex min-h-11 items-center rounded-lg border border-red-200 px-4 text-sm font-medium text-peligro hover:bg-red-50">
            Eliminar imagen
          </button>
        </form>
      )}
    </>
  );
}
