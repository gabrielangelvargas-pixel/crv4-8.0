import Link from "next/link";
import { IconoBuscar } from "@/components/iconos";
import { Boton, BotonEnlace, EncabezadoPagina, Insignia, TablaResponsiva } from "@/components/ui";
import { requerirPermiso } from "@/lib/auth/dal";
import { tienePermiso } from "@/lib/auth/permisos";
import { CLIENTES_POR_PAGINA, listarClientes } from "@/lib/gestion/clientes";

export const metadata = { title: "Clientes · CRV4" };

export default async function ClientesPage({ searchParams }: PageProps<"/admin/clientes">) {
  const usuario = await requerirPermiso("clientes", "ver");
  const { q, pagina } = await searchParams;
  const busqueda = typeof q === "string" ? q : "";
  const { filas, total, pagina: actual } = await listarClientes({ busqueda, pagina: Number(pagina) || 1 });
  const paginas = Math.max(1, Math.ceil(total / CLIENTES_POR_PAGINA));
  const enlacePagina = (n: number) => {
    const p = new URLSearchParams();
    if (busqueda) p.set("q", busqueda);
    if (n > 1) p.set("pagina", String(n));
    const texto = p.toString();
    return texto ? `/admin/clientes?${texto}` : "/admin/clientes";
  };

  return (
    <>
      <EncabezadoPagina
        titulo="Clientes"
        descripcion={`${total} ${total === 1 ? "cliente" : "clientes"}`}
        acciones={
          tienePermiso(usuario, "clientes", "crear") && <BotonEnlace href="/admin/clientes/nuevo">Nuevo cliente</BotonEnlace>
        }
      />
      <form className="flex gap-2 sm:max-w-md" role="search">
        <input
          name="q"
          defaultValue={busqueda}
          placeholder="Nombre, teléfono o email"
          aria-label="Buscar cliente"
          className="min-h-11 min-w-0 flex-1 rounded-lg border border-borde bg-superficie px-3 text-base"
        />
        <Boton variante="secundario" aria-label="Buscar">
          <IconoBuscar className="size-5" />
        </Boton>
      </form>
      <TablaResponsiva
        filas={filas}
        clave={(c) => c.id}
        vacio={busqueda ? "No hay clientes que coincidan." : "Todavía no hay clientes cargados."}
        columnas={[
          {
            titulo: "Cliente",
            principal: true,
            celda: (c) => (
              <>
                <Link href={`/admin/clientes/${c.id}`} className="font-medium text-marca hover:underline">
                  {c.nombre}
                </Link>
                {c.email && <p className="font-normal text-texto-suave">{c.email}</p>}
              </>
            ),
          },
          {
            titulo: "Teléfono",
            celda: (c) =>
              /\d/.test(c.telefono) ? (
                <a href={`tel:${c.telefono}`} className="hover:underline">
                  {c.telefono}
                </a>
              ) : (
                "—"
              ),
          },
          { titulo: "Localidad", celda: (c) => c.localidad ?? "—" },
          {
            titulo: "Estado",
            celda: (c) => (
              <span className="inline-flex flex-wrap gap-1">
                <Insignia tono={c.activo ? "exito" : "neutro"}>{c.activo ? "Activo" : "Inactivo"}</Insignia>
                {Number(c.conCuenta) > 0 && <Insignia>Cuenta web</Insignia>}
              </span>
            ),
          },
        ]}
      />
      {paginas > 1 && (
        <nav className="flex items-center justify-between gap-2 text-sm" aria-label="Páginas">
          {actual > 1 ? <BotonEnlace variante="secundario" href={enlacePagina(actual - 1)}>Anterior</BotonEnlace> : <span />}
          <span className="text-texto-suave">
            Página {actual} de {paginas}
          </span>
          {actual < paginas ? <BotonEnlace variante="secundario" href={enlacePagina(actual + 1)}>Siguiente</BotonEnlace> : <span />}
        </nav>
      )}
    </>
  );
}
