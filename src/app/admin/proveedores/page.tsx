import Link from "next/link";
import { IconoBuscar } from "@/components/iconos";
import { Boton, BotonEnlace, EncabezadoPagina, Insignia, TablaResponsiva } from "@/components/ui";
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
    <>
      <EncabezadoPagina
        titulo="Proveedores"
        acciones={
          tienePermiso(usuario, "proveedores", "crear") && (
            <BotonEnlace href="/admin/proveedores/nuevo">Nuevo proveedor</BotonEnlace>
          )
        }
      />
      <form className="flex gap-2 sm:max-w-md" role="search">
        <input
          name="q"
          defaultValue={busqueda}
          placeholder="Buscar por nombre o contacto"
          aria-label="Buscar proveedor"
          className="min-h-11 min-w-0 flex-1 rounded-lg border border-borde bg-superficie px-3 text-base"
        />
        <Boton variante="secundario" aria-label="Buscar">
          <IconoBuscar className="size-5" />
        </Boton>
      </form>
      <TablaResponsiva
        filas={lista}
        clave={(p) => p.id}
        vacio={busqueda ? "No hay proveedores que coincidan." : "Todavía no hay proveedores cargados."}
        columnas={[
          {
            titulo: "Proveedor",
            principal: true,
            celda: (p) => (
              <>
                <Link href={`/admin/proveedores/${p.id}`} className="font-medium text-marca hover:underline">
                  {p.nombre}
                </Link>
                {p.nombreFantasia && <p className="font-normal text-texto-suave">{p.nombreFantasia}</p>}
              </>
            ),
          },
          { titulo: "Contacto", celda: (p) => p.contacto ?? "—" },
          {
            titulo: "Teléfono",
            celda: (p) =>
              p.telefono ? (
                <a href={`tel:${p.telefono}`} className="hover:underline">
                  {p.telefono}
                </a>
              ) : (
                "—"
              ),
          },
          {
            titulo: "Estado",
            celda: (p) => <Insignia tono={p.activo ? "exito" : "neutro"}>{p.activo ? "Activo" : "Inactivo"}</Insignia>,
          },
        ]}
      />
    </>
  );
}
