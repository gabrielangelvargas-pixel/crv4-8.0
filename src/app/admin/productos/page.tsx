import Link from "next/link";
import { IconoBuscar } from "@/components/iconos";
import { Boton, BotonEnlace, EncabezadoPagina, Insignia, TablaResponsiva } from "@/components/ui";
import { requerirPermiso } from "@/lib/auth/dal";
import { tienePermiso } from "@/lib/auth/permisos";
import { listarProductos, PRODUCTOS_POR_PAGINA } from "@/lib/gestion/productos";
import { arbolDeRubros } from "@/lib/gestion/rubros";
import { urlImagen } from "@/lib/imagenes";
import { formatearCantidad, formatearPrecio } from "@/lib/numeros";

export const metadata = { title: "Productos · CRV4" };

const claseControl = "min-h-11 min-w-0 rounded-lg border border-borde bg-superficie px-3 text-base";

export default async function ProductosPage({ searchParams }: PageProps<"/admin/productos">) {
  const usuario = await requerirPermiso("productos", "ver");
  const { q, rubro, pagina } = await searchParams;
  const busqueda = typeof q === "string" ? q : "";
  const rubroId = Number(rubro) || undefined;
  const [{ filas, total, pagina: actual }, arbol] = await Promise.all([
    listarProductos({ busqueda, rubroId, pagina: Number(pagina) || 1 }),
    arbolDeRubros(),
  ]);
  const paginas = Math.max(1, Math.ceil(total / PRODUCTOS_POR_PAGINA));
  const enlacePagina = (n: number) => {
    const p = new URLSearchParams();
    if (busqueda) p.set("q", busqueda);
    if (rubroId) p.set("rubro", String(rubroId));
    if (n > 1) p.set("pagina", String(n));
    const texto = p.toString();
    return texto ? `/admin/productos?${texto}` : "/admin/productos";
  };

  return (
    <>
      <EncabezadoPagina
        titulo="Productos"
        descripcion={`${total} ${total === 1 ? "producto" : "productos"}`}
        acciones={
          tienePermiso(usuario, "productos", "crear") && (
            <BotonEnlace href="/admin/productos/nuevo">Nuevo producto</BotonEnlace>
          )
        }
      />
      <form className="flex flex-col gap-2 sm:flex-row lg:max-w-3xl" role="search">
        <input
          name="q"
          defaultValue={busqueda}
          placeholder="Buscar por nombre o código"
          aria-label="Buscar producto"
          className={`${claseControl} sm:flex-1`}
        />
        <div className="flex gap-2">
          <select name="rubro" defaultValue={rubroId ?? ""} aria-label="Filtrar por rubro" className={`${claseControl} flex-1`}>
            <option value="">Todos los rubros</option>
            {arbol.map((r) => (
              <optgroup key={r.id} label={r.nombre}>
                <option value={r.id}>Todo {r.nombre}</option>
                {r.subrubros.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nombre}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
          <Boton variante="secundario" aria-label="Buscar">
            <IconoBuscar className="size-5" />
          </Boton>
        </div>
      </form>
      <TablaResponsiva
        filas={filas}
        clave={(p) => p.id}
        vacio={busqueda || rubroId ? "No hay productos que coincidan." : "Todavía no hay productos cargados."}
        columnas={[
          {
            titulo: "Producto",
            principal: true,
            celda: (p) => (
              <div className="flex items-center gap-3">
                <div className="size-12 shrink-0 overflow-hidden rounded-md border border-borde bg-white">
                  {p.imagen && (
                    // eslint-disable-next-line @next/next/no-img-element -- la foto ya está optimizada a 500x500 WEBP
                    <img src={urlImagen(p.imagen, p.actualizadoEn)!} alt="" loading="lazy" className="size-full object-contain" />
                  )}
                </div>
                <div className="min-w-0">
                  <Link href={`/admin/productos/${p.id}`} className="font-medium text-marca hover:underline">
                    {p.nombre}
                  </Link>
                  <p className="font-normal text-texto-suave">
                    {p.codigo}
                    {Number(p.variantes) > 1 && ` · ${p.variantes} variantes`}
                  </p>
                </div>
              </div>
            ),
          },
          { titulo: "Rubro", celda: (p) => (p.rubroPadre ? `${p.rubroPadre} › ${p.rubro}` : p.rubro) },
          { titulo: "Precio", celda: (p) => (p.precioVenta !== null ? formatearPrecio(p.precioVenta) : "—") },
          { titulo: "Stock", celda: (p) => formatearCantidad(p.stock) },
          {
            titulo: "Estado",
            celda: (p) => (
              <span className="inline-flex flex-wrap gap-1">
                <Insignia tono={p.activo ? "exito" : "neutro"}>{p.activo ? "Activo" : "Inactivo"}</Insignia>
                {!p.visibleWeb && <Insignia tono="alerta">Oculto en la web</Insignia>}
                {p.destacado && <Insignia>Destacado</Insignia>}
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
