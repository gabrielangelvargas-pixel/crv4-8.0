import Link from "next/link";
import { redirect } from "next/navigation";
import { IconoBuscar } from "@/components/iconos";
import { Boton, BotonEnlace, EncabezadoPagina, Insignia, TablaResponsiva } from "@/components/ui";
import { requerirPermiso } from "@/lib/auth/dal";
import { arbolDeRubros } from "@/lib/gestion/rubros";
import { listarStock, varianteConCodigo, VARIANTES_POR_PAGINA } from "@/lib/gestion/stock";
import { formatearCantidad } from "@/lib/numeros";

export const metadata = { title: "Stock · CRV4" };

const claseControl = "min-h-11 min-w-0 rounded-lg border border-borde bg-superficie px-3 text-base";

export default async function StockPage({ searchParams }: PageProps<"/admin/stock">) {
  await requerirPermiso("stock", "ver");
  const { q, rubro, pagina, agotados } = await searchParams;
  const busqueda = typeof q === "string" ? q.trim() : "";
  const rubroId = Number(rubro) || undefined;
  const sinStock = agotados === "1";

  // Con el lector de código de barras se escribe el código exacto: se va directo a la variante.
  if (busqueda) {
    const id = await varianteConCodigo(busqueda);
    if (id) redirect(`/admin/stock/${id}`);
  }

  const [{ filas, total, pagina: actual }, arbol] = await Promise.all([
    listarStock({ busqueda, rubroId, sinStock, pagina: Number(pagina) || 1 }),
    arbolDeRubros(),
  ]);
  const paginas = Math.max(1, Math.ceil(total / VARIANTES_POR_PAGINA));
  const enlacePagina = (n: number) => {
    const p = new URLSearchParams();
    if (busqueda) p.set("q", busqueda);
    if (rubroId) p.set("rubro", String(rubroId));
    if (sinStock) p.set("agotados", "1");
    if (n > 1) p.set("pagina", String(n));
    const texto = p.toString();
    return texto ? `/admin/stock?${texto}` : "/admin/stock";
  };

  return (
    <>
      <EncabezadoPagina
        titulo="Stock"
        descripcion="Busca un producto o escanea su código para cargar un ingreso o un ajuste."
      />
      <form className="flex flex-col gap-2 lg:max-w-3xl" role="search">
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            name="q"
            defaultValue={busqueda}
            placeholder="Nombre o código de barras"
            aria-label="Buscar producto"
            autoFocus
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
        </div>
        <label className="flex min-h-11 items-center gap-3 text-sm">
          <input type="checkbox" name="agotados" value="1" defaultChecked={sinStock} className="size-5 accent-marca" />
          Solo sin stock
        </label>
      </form>
      <TablaResponsiva
        filas={filas}
        clave={(v) => v.id}
        vacio={busqueda || rubroId || sinStock ? "No hay productos que coincidan." : "Todavía no hay productos cargados."}
        columnas={[
          {
            titulo: "Producto",
            principal: true,
            celda: (v) => (
              <>
                <Link href={`/admin/stock/${v.id}`} className="font-medium text-marca hover:underline">
                  {v.producto}
                  {v.tipoVariante !== "ninguna" && ` · ${v.valor}`}
                </Link>
                <p className="font-normal text-texto-suave">{v.codigo}</p>
              </>
            ),
          },
          {
            titulo: "Stock",
            celda: (v) => (
              <span className={Number(v.stock) <= 0 ? "font-semibold text-peligro" : "font-semibold"}>
                {formatearCantidad(v.stock)}
              </span>
            ),
          },
          {
            titulo: "Estado",
            celda: (v) =>
              v.activo && v.productoActivo ? <Insignia tono="exito">Activo</Insignia> : <Insignia>Inactivo</Insignia>,
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
