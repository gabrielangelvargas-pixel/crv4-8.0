import Link from "next/link";
import { notFound } from "next/navigation";
import { PasswordForm } from "@/components/password-form";
import { Aviso, EncabezadoPagina } from "@/components/ui";
import { requerirPermiso } from "@/lib/auth/dal";
import { tienePermiso } from "@/lib/auth/permisos";
import { listarRoles } from "@/lib/gestion/roles";
import { obtenerUsuario } from "@/lib/gestion/usuarios";
import { formatearFecha } from "@/lib/numeros";
import { cambiarPasswordDe, editarUsuario, eliminarUsuario } from "../actions";
import { UsuarioForm } from "../usuario-form";

export const metadata = { title: "Usuario · CRV4" };

export default async function UsuarioPage({ params, searchParams }: PageProps<"/admin/usuarios/[id]">) {
  const actor = await requerirPermiso("usuarios", "ver");
  const id = Number((await params).id);
  const usuario = Number.isInteger(id) ? await obtenerUsuario(id) : null;
  if (!usuario) notFound();

  const noEliminar = (await searchParams)["no-eliminar"] !== undefined;
  const esPropio = usuario.id === actor.id;
  // A un administrador solo lo modifica otro administrador.
  const protegido = usuario.accesoTotal && !actor.accesoTotal;
  const puedeEditar = tienePermiso(actor, "usuarios", "editar") && !protegido;
  const roles = (await listarRoles()).filter(
    (r) =>
      r.accesoGestion === usuario.accesoGestion &&
      (r.activo || r.id === usuario.rolId) &&
      (actor.accesoTotal || !r.accesoTotal || r.id === usuario.rolId),
  );

  return (
    <>
      <EncabezadoPagina
        titulo={usuario.nombre}
        descripcion={
          <>
            Último acceso: {usuario.ultimoAcceso ? formatearFecha(usuario.ultimoAcceso) : "nunca"}
            {usuario.clienteId && tienePermiso(actor, "clientes", "ver") && (
              <>
                {" · "}
                <Link href={`/admin/clientes/${usuario.clienteId}`} className="text-marca hover:underline">
                  Ver ficha del cliente
                </Link>
              </>
            )}
          </>
        }
      />
      {protegido && <Aviso>Solo un administrador puede modificar a otro administrador.</Aviso>}
      <UsuarioForm
        accion={editarUsuario.bind(null, usuario.id)}
        roles={roles}
        inicial={usuario}
        esPropio={esPropio}
        soloLectura={!puedeEditar}
      />
      {puedeEditar && (
        <PasswordForm
          accion={cambiarPasswordDe.bind(null, usuario.id)}
          titulo={esPropio ? "Cambiar tu contraseña" : "Asignar una contraseña nueva"}
        />
      )}
      {tienePermiso(actor, "usuarios", "eliminar") && !esPropio && !protegido && (
        <form
          action={eliminarUsuario.bind(null, usuario.id)}
          className="flex flex-col items-start gap-2 rounded-xl border border-red-200 bg-superficie p-4 sm:max-w-2xl"
        >
          {noEliminar && (
            <p role="alert" className="text-sm text-peligro">
              No se puede eliminar porque ya registró ventas o movimientos de stock, o es el último administrador.
              Puedes desactivarlo.
            </p>
          )}
          <button className="inline-flex min-h-11 items-center rounded-lg border border-red-200 px-4 text-sm font-medium text-peligro hover:bg-red-50">
            Eliminar usuario
          </button>
        </form>
      )}
    </>
  );
}
