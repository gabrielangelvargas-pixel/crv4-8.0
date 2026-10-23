import { notFound } from "next/navigation";
import { EncabezadoPagina } from "@/components/ui";
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
    <>
      <EncabezadoPagina titulo={proveedor.nombre} />
      <ProveedorForm
        accion={editarProveedor.bind(null, proveedor.id)}
        inicial={proveedor}
        soloLectura={!tienePermiso(usuario, "proveedores", "editar")}
      />
      {tienePermiso(usuario, "proveedores", "eliminar") && (
        <form action={eliminarProveedor.bind(null, proveedor.id)} className="flex flex-col items-start gap-2 rounded-xl border border-red-200 bg-superficie p-4 sm:max-w-2xl">
          {enUso && (
            <p role="alert" className="text-sm text-peligro">
              No se puede eliminar porque tiene productos asociados. Puedes desactivarlo.
            </p>
          )}
          <button className="inline-flex min-h-11 items-center rounded-lg border border-red-200 px-4 text-sm font-medium text-peligro hover:bg-red-50">Eliminar proveedor</button>
        </form>
      )}
    </>
  );
}
