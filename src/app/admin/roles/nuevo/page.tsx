import { EncabezadoPagina } from "@/components/ui";
import { requerirPermiso } from "@/lib/auth/dal";
import { crearRol } from "../actions";
import { RolForm } from "../rol-form";

export const metadata = { title: "Nuevo rol · CRV4" };

export default async function NuevoRolPage() {
  await requerirPermiso("roles", "crear");

  return (
    <>
      <EncabezadoPagina titulo="Nuevo rol" />
      <RolForm accion={crearRol} />
    </>
  );
}
