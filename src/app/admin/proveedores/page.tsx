import Link from "next/link";
import { requerirPermiso } from "@/lib/auth/dal";
import { tienePermiso } from "@/lib/auth/permisos";
import { listarProveedores } from "@/lib/gestion/proveedores";

export const metadata = { title: "Proveedores · CRV4" };

export default async function ProveedoresPage({ searchParams }: PageProps<"/admin/proveedores">) {
  const usuario = await requerirPermiso("proveedores", "ver");
  const { q } = await searchParams;
  const busqueda = typeof q === "string" ? q : "";
  const lista = await listarProveedores(busqueda);

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Proveedores</h1>
        {tienePermiso(usuario, "proveedores", "crear") && (
          <Link
            href="/admin/proveedores/nuevo"
            className="rounded-md bg-neutral-900 px-3 py-2 text-sm font-medium text-white"
          >
            Nuevo proveedor
          </Link>
        )}
      </div>
      <form className="flex max-w-md gap-2">
        <input
          name="q"
          defaultValue={busqueda}
          placeholder="Buscar por nombre o contacto"
          className="flex-1 rounded-md border border-neutral-300 px-3 py-2 text-base"
        />
        <button className="rounded-md border border-neutral-300 px-3 py-2 text-sm">Buscar</button>
      </form>
      {lista.length === 0 ? (
        <p className="text-neutral-600">{busqueda ? "No hay proveedores que coincidan." : "Todavía no hay proveedores cargados."}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-200 text-left">
                <th className="py-2 pr-4 font-medium">Proveedor</th>
                <th className="py-2 pr-4 font-medium">Contacto</th>
                <th className="py-2 pr-4 font-medium">Teléfono</th>
                <th className="py-2 pr-4 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody>
              {lista.map((p) => (
                <tr key={p.id} className="border-b border-neutral-100">
                  <td className="py-2 pr-4">
                    <Link href={`/admin/proveedores/${p.id}`} className="font-medium hover:underline">
                      {p.nombre}
                    </Link>
                    {p.nombreFantasia && <p className="text-neutral-500">{p.nombreFantasia}</p>}
                  </td>
                  <td className="py-2 pr-4">{p.contacto}</td>
                  <td className="py-2 pr-4">{p.telefono}</td>
                  <td className="py-2 pr-4">{p.activo ? "Activo" : "Inactivo"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
