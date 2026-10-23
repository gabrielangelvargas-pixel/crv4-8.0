import { requerirPermiso } from "@/lib/auth/dal";
import { rubrosPrincipales } from "@/lib/gestion/rubros";
import { crearRubro } from "../actions";
import { RubroForm } from "../rubro-form";

export const metadata = { title: "Nuevo rubro · CRV4" };

export default async function NuevoRubroPage({ searchParams }: PageProps<"/admin/rubros/nuevo">) {
  await requerirPermiso("rubros", "crear");
  const principales = await rubrosPrincipales();
  const padre = Number((await searchParams).padre);

  return (
    <section className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">Nuevo rubro</h1>
      <RubroForm
        accion={crearRubro}
        principales={principales}
        inicial={{ rubroPadreId: principales.some((r) => r.id === padre) ? padre : null }}
      />
    </section>
  );
}
