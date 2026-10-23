import Link from "next/link";
import { IconoBuscar } from "@/components/iconos";
import { Boton, BotonEnlace, EncabezadoPagina, Insignia, TablaResponsiva } from "@/components/ui";
import { requerirPermiso } from "@/lib/auth/dal";
import { tienePermiso } from "@/lib/auth/permisos";
import { listarUsuarios, type Grupo } from "@/lib/gestion/usuarios";
import { formatearFecha } from "@/lib/numeros";

export const metadata = { title: "Usuarios · CRV4" };

const PESTANAS: { grupo: Grupo; titulo: string }[] = [
  { grupo: "equipo", titulo: "Equipo" },
  { grupo: "web", titulo: "Clientes web" },
];

export default async function UsuariosPage({ searchParams }: PageProps<"/admin/usuarios">) {
  const usuario = await requerirPermiso("usuarios", "ver");
  const { q, grupo: g } = await searchParams;
  const busqueda = typeof q === "string" ? q : "";
  const grupo: Grupo = g === "web" ? "web" : "equipo";
  const lista = await listarUsuarios({ busqueda, grupo });

  return (
    <>
      <EncabezadoPagina
        titulo="Usuarios"
        descripcion="Quién puede entrar al sistema. Las cuentas de clientes se crean solas al comprar en la web."
        acciones={
          tienePermiso(usuario, "usuarios", "crear") && <BotonEnlace href="/admin/usuarios/nuevo">Nuevo usuario</BotonEnlace>
        }
      />
      <nav className="flex gap-2 border-b border-borde" aria-label="Tipo de usuario">
        {PESTANAS.map((p) => (
          <Link
            key={p.grupo}
            href={p.grupo === "equipo" ? "/admin/usuarios" : "/admin/usuarios?grupo=web"}
            aria-current={grupo === p.grupo ? "page" : undefined}
            className="-mb-px flex min-h-11 items-center border-b-2 border-transparent px-3 text-sm text-texto-suave aria-[current=page]:border-marca aria-[current=page]:font-medium aria-[current=page]:text-marca"
          >
            {p.titulo}
          </Link>
        ))}
      </nav>
      <form className="flex gap-2 sm:max-w-md" role="search">
        {grupo === "web" && <input type="hidden" name="grupo" value="web" />}
        <input
          name="q"
          defaultValue={busqueda}
          placeholder="Nombre o usuario"
          aria-label="Buscar usuario"
          className="min-h-11 min-w-0 flex-1 rounded-lg border border-borde bg-superficie px-3 text-base"
        />
        <Boton variante="secundario" aria-label="Buscar">
          <IconoBuscar className="size-5" />
        </Boton>
      </form>
      <TablaResponsiva
        filas={lista}
        clave={(u) => u.id}
        vacio={busqueda ? "No hay usuarios que coincidan." : "Todavía no hay usuarios en este grupo."}
        columnas={[
          {
            titulo: "Usuario",
            principal: true,
            celda: (u) => (
              <>
                <Link href={`/admin/usuarios/${u.id}`} className="font-medium text-marca hover:underline">
                  {u.nombre}
                </Link>
                <p className="font-normal text-texto-suave">
                  {u.nombreUsuario}
                  {u.id === usuario.id && " (tú)"}
                </p>
              </>
            ),
          },
          { titulo: "Rol", celda: (u) => u.rol },
          { titulo: "Último acceso", celda: (u) => (u.ultimoAcceso ? formatearFecha(u.ultimoAcceso) : "Nunca") },
          {
            titulo: "Estado",
            celda: (u) => <Insignia tono={u.activo ? "exito" : "neutro"}>{u.activo ? "Activo" : "Inactivo"}</Insignia>,
          },
        ]}
      />
    </>
  );
}
