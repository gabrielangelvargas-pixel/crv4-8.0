import { EncabezadoPagina } from "@/components/ui";
import { requerirPermiso } from "@/lib/auth/dal";
import { listarRoles } from "@/lib/gestion/roles";
import { crearUsuario } from "../actions";
import { UsuarioForm } from "../usuario-form";

export const metadata = { title: "Nuevo usuario · CRV4" };

export default async function NuevoUsuarioPage() {
  const actor = await requerirPermiso("usuarios", "crear");
  // Solo roles de la gestión; el de administrador, solo si quien crea lo es.
  const roles = (await listarRoles()).filter((r) => r.activo && r.accesoGestion && (actor.accesoTotal || !r.accesoTotal));

  return (
    <>
      <EncabezadoPagina titulo="Nuevo usuario" />
      <UsuarioForm accion={crearUsuario} roles={roles} conPassword />
    </>
  );
}
