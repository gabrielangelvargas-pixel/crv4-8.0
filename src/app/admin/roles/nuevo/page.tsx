import { requerirPermiso } from "@/lib/auth/dal";
import { crearRol } from "../actions";
import { RolForm } from "../rol-form";

export const metadata = { title: "Nuevo rol · CRV4" };

export default async function NuevoRolPage() {
  await requerirPermiso("roles", "crear");

  return (
    <section className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">Nuevo rol</h1>
      <RolForm accion={crearRol} />
    </section>
  );
}
