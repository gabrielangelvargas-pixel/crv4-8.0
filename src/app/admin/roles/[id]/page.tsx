import { notFound } from "next/navigation";
import { requerirPermiso } from "@/lib/auth/dal";
import { tienePermiso } from "@/lib/auth/permisos";
import { obtenerRol } from "@/lib/gestion/roles";
import { editarRol, eliminarRol } from "../actions";
import { RolForm } from "../rol-form";

export const metadata = { title: "Rol · CRV4" };

export default async function RolPage({ params, searchParams }: PageProps<"/admin/roles/[id]">) {
  const usuario = await requerirPermiso("roles", "ver");
  const id = Number((await params).id);
  const rol = Number.isInteger(id) ? await obtenerRol(id) : null;
  if (!rol) notFound();

  const conUsuarios = (await searchParams)["con-usuarios"] !== undefined;
  const esSistema = rol.codigo !== null;
  const esPropio = rol.id === usuario.rol.id && !usuario.accesoTotal;
  const puedeEditar = tienePermiso(usuario, "roles", "editar") && !esPropio;
  const puedeEliminar = tienePermiso(usuario, "roles", "eliminar") && !esSistema;

  return (
    <section className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">{rol.nombre}</h1>
      {esPropio && <p className="text-sm text-neutral-600">No puedes modificar tu propio rol.</p>}
      <RolForm
        accion={editarRol.bind(null, rol.id)}
        soloLectura={!puedeEditar}
        inicial={{
          nombre: rol.nombre,
          descripcion: rol.descripcion,
          activo: rol.activo,
          permisos: rol.permisos,
          esSistema,
          accesoTotal: rol.accesoTotal,
          accesoGestion: rol.accesoGestion,
        }}
      />
      {puedeEliminar && (
        <form action={eliminarRol.bind(null, rol.id)} className="mt-4 border-t border-neutral-200 pt-4">
          {conUsuarios && (
            <p role="alert" className="mb-2 text-sm text-red-600">
              No se puede eliminar: hay usuarios con este rol. Asígnales otro rol primero.
            </p>
          )}
          <button className="text-sm text-red-600 underline underline-offset-4">Eliminar rol</button>
        </form>
      )}
    </section>
  );
}
