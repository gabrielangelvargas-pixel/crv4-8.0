import { requerirPermiso } from "@/lib/auth/dal";
import { crearProveedor } from "../actions";
import { ProveedorForm } from "../proveedor-form";

export const metadata = { title: "Nuevo proveedor · CRV4" };

export default async function NuevoProveedorPage() {
  await requerirPermiso("proveedores", "crear");

  return (
    <section className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">Nuevo proveedor</h1>
      <ProveedorForm accion={crearProveedor} />
    </section>
  );
}
