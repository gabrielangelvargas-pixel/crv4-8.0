import Link from "next/link";
import { BotonEnlace, EncabezadoPagina, Insignia, TablaResponsiva } from "@/components/ui";
import { requerirPermiso } from "@/lib/auth/dal";
import { tienePermiso } from "@/lib/auth/permisos";
import { listarRoles } from "@/lib/gestion/roles";

export const metadata = { title: "Roles y permisos · CRV4" };

export default async function RolesPage() {
  const usuario = await requerirPermiso("roles", "ver");
  const lista = await listarRoles();

  return (
    <>
      <EncabezadoPagina
        titulo="Roles y permisos"
        descripcion="Qué puede ver y hacer cada tipo de usuario."
        acciones={tienePermiso(usuario, "roles", "crear") && <BotonEnlace href="/admin/roles/nuevo">Nuevo rol</BotonEnlace>}
      />
      <TablaResponsiva
        filas={lista}
        clave={(r) => r.id}
        columnas={[
          {
            titulo: "Rol",
            principal: true,
            celda: (r) => (
              <>
                <Link href={`/admin/roles/${r.id}`} className="font-medium text-marca hover:underline">
                  {r.nombre}
                </Link>
                {r.descripcion && <p className="font-normal text-texto-suave">{r.descripcion}</p>}
              </>
            ),
          },
          { titulo: "Acceso", celda: (r) => (r.accesoTotal ? "Total" : r.accesoGestion ? "Según permisos" : "Solo web") },
          { titulo: "Usuarios", celda: (r) => r.usuarios },
          {
            titulo: "Estado",
            celda: (r) => <Insignia tono={r.activo ? "exito" : "neutro"}>{r.activo ? "Activo" : "Inactivo"}</Insignia>,
          },
        ]}
      />
    </>
  );
}
