import { notFound } from "next/navigation";
import { EncabezadoPagina } from "@/components/ui";
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
    <>
      <EncabezadoPagina titulo={rol.nombre} />
      {esPropio && <p className="text-sm text-texto-suave">No puedes modificar tu propio rol.</p>}
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
        <form action={eliminarRol.bind(null, rol.id)} className="flex flex-col items-start gap-2 rounded-xl border border-red-200 bg-superficie p-4 sm:max-w-3xl">
          {conUsuarios && (
            <p role="alert" className="text-sm text-peligro">
              No se puede eliminar: hay usuarios con este rol. Asígnales otro rol primero.
            </p>
          )}
          <button className="inline-flex min-h-11 items-center rounded-lg border border-red-200 px-4 text-sm font-medium text-peligro hover:bg-red-50">Eliminar rol</button>
        </form>
      )}
    </>
  );
}
