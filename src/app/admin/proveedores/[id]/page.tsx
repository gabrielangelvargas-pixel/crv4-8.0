import { notFound } from "next/navigation";
import { requerirPermiso } from "@/lib/auth/dal";
import { tienePermiso } from "@/lib/auth/permisos";
import { obtenerProveedor } from "@/lib/gestion/proveedores";
import { editarProveedor, eliminarProveedor } from "../actions";
import { ProveedorForm } from "../proveedor-form";

export const metadata = { title: "Proveedor · CRV4" };

export default async function ProveedorPage({ params, searchParams }: PageProps<"/admin/proveedores/[id]">) {
  const usuario = await requerirPermiso("proveedores", "ver");
  const id = Number((await params).id);
  const proveedor = Number.isInteger(id) ? await obtenerProveedor(id) : null;
  if (!proveedor) notFound();

  const enUso = (await searchParams)["en-uso"] !== undefined;

  return (
    <section className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">{proveedor.nombre}</h1>
      <ProveedorForm
        accion={editarProveedor.bind(null, proveedor.id)}
        inicial={proveedor}
        soloLectura={!tienePermiso(usuario, "proveedores", "editar")}
      />
      {tienePermiso(usuario, "proveedores", "eliminar") && (
        <form action={eliminarProveedor.bind(null, proveedor.id)} className="mt-4 border-t border-neutral-200 pt-4">
          {enUso && (
            <p role="alert" className="mb-2 text-sm text-red-600">
              No se puede eliminar porque tiene productos asociados. Puedes desactivarlo.
            </p>
          )}
          <button className="text-sm text-red-600 underline underline-offset-4">Eliminar proveedor</button>
        </form>
      )}
    </section>
  );
}
