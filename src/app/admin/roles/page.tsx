import Link from "next/link";
import { requerirPermiso } from "@/lib/auth/dal";
import { tienePermiso } from "@/lib/auth/permisos";
import { listarRoles } from "@/lib/gestion/roles";

export const metadata = { title: "Roles y permisos · CRV4" };

export default async function RolesPage() {
  const usuario = await requerirPermiso("roles", "ver");
  const lista = await listarRoles();

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Roles y permisos</h1>
        {tienePermiso(usuario, "roles", "crear") && (
          <Link href="/admin/roles/nuevo" className="rounded-md bg-neutral-900 px-3 py-2 text-sm font-medium text-white">
            Nuevo rol
          </Link>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-200 text-left">
              <th className="py-2 pr-4 font-medium">Rol</th>
              <th className="py-2 pr-4 font-medium">Acceso</th>
              <th className="py-2 pr-4 font-medium">Usuarios</th>
              <th className="py-2 pr-4 font-medium">Estado</th>
            </tr>
          </thead>
          <tbody>
            {lista.map((rol) => (
              <tr key={rol.id} className="border-b border-neutral-100">
                <td className="py-2 pr-4">
                  <Link href={`/admin/roles/${rol.id}`} className="font-medium hover:underline">
                    {rol.nombre}
                  </Link>
                  {rol.descripcion && <p className="text-neutral-500">{rol.descripcion}</p>}
                </td>
                <td className="py-2 pr-4">
                  {rol.accesoTotal ? "Total" : rol.accesoGestion ? "Según permisos" : "Solo web"}
                </td>
                <td className="py-2 pr-4">{rol.usuarios}</td>
                <td className="py-2 pr-4">{rol.activo ? "Activo" : "Inactivo"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
