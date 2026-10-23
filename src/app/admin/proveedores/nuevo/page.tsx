import { EncabezadoPagina } from "@/components/ui";
import { requerirPermiso } from "@/lib/auth/dal";
import { crearProveedor } from "../actions";
import { ProveedorForm } from "../proveedor-form";

export const metadata = { title: "Nuevo proveedor · CRV4" };

export default async function NuevoProveedorPage() {
  await requerirPermiso("proveedores", "crear");

  return (
    <>
      <EncabezadoPagina titulo="Nuevo proveedor" />
      <ProveedorForm accion={crearProveedor} />
    </>
  );
}
