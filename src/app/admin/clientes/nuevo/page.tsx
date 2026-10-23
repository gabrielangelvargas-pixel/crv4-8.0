import { EncabezadoPagina } from "@/components/ui";
import { requerirPermiso } from "@/lib/auth/dal";
import { crearCliente } from "../actions";
import { ClienteForm } from "../cliente-form";

export const metadata = { title: "Nuevo cliente · CRV4" };

export default async function NuevoClientePage() {
  await requerirPermiso("clientes", "crear");

  return (
    <>
      <EncabezadoPagina titulo="Nuevo cliente" />
      <ClienteForm accion={crearCliente} />
    </>
  );
}
