import { notFound } from "next/navigation";
import { requerirPermiso } from "@/lib/auth/dal";
import { tienePermiso } from "@/lib/auth/permisos";
import { obtenerRubro, rubrosPrincipales } from "@/lib/gestion/rubros";
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
    <section className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">{rubro.nombre}</h1>
      <RubroForm
        accion={editarRubro.bind(null, rubro.id)}
        principales={principales}
        inicial={rubro}
        soloLectura={!tienePermiso(usuario, "rubros", "editar")}
      />
      {tienePermiso(usuario, "rubros", "eliminar") && (
        <form action={eliminarRubro.bind(null, rubro.id)} className="mt-4 border-t border-neutral-200 pt-4">
          {enUso && (
            <p role="alert" className="mb-2 text-sm text-red-600">
              No se puede eliminar porque tiene subrubros o productos. Puedes desactivarlo.
            </p>
          )}
          <button className="text-sm text-red-600 underline underline-offset-4">Eliminar rubro</button>
        </form>
      )}
    </section>
  );
}
