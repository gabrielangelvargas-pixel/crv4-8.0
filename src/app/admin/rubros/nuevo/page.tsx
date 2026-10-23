import { EncabezadoPagina } from "@/components/ui";
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
    <>
      <EncabezadoPagina titulo="Nuevo rubro" />
      <RubroForm
        accion={crearRubro}
        principales={principales}
        inicial={{ rubroPadreId: principales.some((r) => r.id === padre) ? padre : null }}
      />
    </>
  );
}
