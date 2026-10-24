import { notFound } from "next/navigation";
import { EncabezadoPagina } from "@/components/ui";
import { requerirPermiso } from "@/lib/auth/dal";
import { tienePermiso } from "@/lib/auth/permisos";
import { obtenerRubro, rubrosPrincipales } from "@/lib/gestion/rubros";
import { urlImagen } from "@/lib/imagenes";
import { editarRubro, eliminarRubro } from "../actions";
import { RubroForm } from "../rubro-form";

export const metadata = { title: "Rubro · CRV4" };

export default async function RubroPage({ params, searchParams }: PageProps<"/admin/rubros/[id]">) {
  const usuario = await requerirPermiso("rubros", "ver");
  const id = Number((await params).id);
  const rubro = Number.isInteger(id) ? await obtenerRubro(id) : null;
  if (!rubro) notFound();

  const principales = (await rubrosPrincipales()).filter((r) => r.id !== rubro.id);
  const enUso = (await searchParams)["en-uso"] !== undefined;

  return (
    <>
      <EncabezadoPagina titulo={rubro.nombre} />
      <RubroForm
        accion={editarRubro.bind(null, rubro.id)}
        principales={principales}
        inicial={{ ...rubro, imagen: urlImagen(rubro.imagen, rubro.actualizadoEn) }}
        soloLectura={!tienePermiso(usuario, "rubros", "editar")}
      />
      {tienePermiso(usuario, "rubros", "eliminar") && (
        <form action={eliminarRubro.bind(null, rubro.id)} className="flex flex-col items-start gap-2 rounded-xl border border-red-200 bg-superficie p-4 sm:max-w-2xl">
          {enUso && (
            <p role="alert" className="text-sm text-peligro">
              No se puede eliminar porque tiene subrubros o productos. Puedes desactivarlo.
            </p>
          )}
          <button className="inline-flex min-h-11 items-center rounded-lg border border-red-200 px-4 text-sm font-medium text-peligro hover:bg-red-50">Eliminar rubro</button>
        </form>
      )}
    </>
  );
}
