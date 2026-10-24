import { Aviso, BotonEnlace, Tarjeta } from "@/components/ui";
import { configWoo, categoriasWoo, ErrorWoo, productosWoo, type ProductoWoo } from "@/lib/woocommerce";
import { FilaDeslizable } from "../catalogo/fila-deslizable";
import { Chip, Circulo, IconoTodos, MuyPronto } from "../catalogo/navegacion-rubros";
import { Disponibilidad, Precio } from "../catalogo/tarjeta-producto";

export const metadata = { title: "Catálogo WooCommerce (prueba) · CRV4 Mayorista", robots: { index: false } };

function TarjetaWoo({ producto: p }: { producto: ProductoWoo }) {
  const contenido = (
    <>
      <div className={`aspect-square overflow-hidden bg-white ${p.disponible ? "" : "opacity-60"}`}>
        {p.imagen ? (
          // eslint-disable-next-line @next/next/no-img-element -- la imagen viene de la tienda WooCommerce
          <img src={p.imagen} alt="" loading="lazy" className="size-full object-contain" />
        ) : (
          <div className="flex size-full items-center justify-center text-xs text-texto-suave">Sin foto</div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 border-t border-borde p-3">
        <p className="text-xs text-texto-suave">{p.categoria}</p>
        <h2 className="line-clamp-2 text-sm font-medium">{p.nombre}</h2>
        <div className="mt-auto pt-1">
          <Precio venta={p.precioVenta} oferta={p.precioOferta} />
          <Disponibilidad disponible={p.disponible} />
        </div>
      </div>
    </>
  );
  const clase = "flex flex-col overflow-hidden rounded-xl border border-borde bg-superficie transition-shadow hover:shadow-md";
  return p.enlace ? (
    <a href={p.enlace} target="_blank" rel="noopener noreferrer" className={clase}>
      {contenido}
    </a>
  ) : (
    <div className={clase}>{contenido}</div>
  );
}

// Página de prueba: muestra el catálogo de la tienda WooCommerce sin guardarlo en CRV4.
// Es pública: la puede ver cualquier visitante.
export default async function CatalogoWooPage({ searchParams }: PageProps<"/catalogo-woo">) {
  const { q, categoria: slug, pagina } = await searchParams;
  const busqueda = typeof q === "string" && q.trim() ? q.trim() : undefined;

  const config = configWoo();
  if (!config) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">Catálogo WooCommerce (prueba)</h1>
        <Aviso tipo="alerta">
          Faltan configurar las variables WOO_URL, WOO_CLAVE y WOO_SECRETO en Hostinger (la dirección tiene que empezar con https://).
        </Aviso>
      </div>
    );
  }

  let datos;
  try {
    const arbol = await categoriasWoo(config);
    const principal = arbol.find((c) => c.slug === slug || c.subcategorias.some((s) => s.slug === slug));
    const elegida = principal?.slug === slug ? principal : principal?.subcategorias.find((s) => s.slug === slug);
    const resultado = await productosWoo(config, { categoria: elegida?.id, busqueda, pagina: Math.max(1, Number(pagina) || 1) });
    datos = { arbol, principal, elegida, ...resultado, actual: Math.max(1, Number(pagina) || 1) };
  } catch (error) {
    if (!(error instanceof ErrorWoo)) throw error;
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">Catálogo WooCommerce (prueba)</h1>
        <Aviso tipo="error">{error.message}</Aviso>
      </div>
    );
  }
  const { arbol, principal, elegida, productos, total, paginas, actual } = datos;

  const enlace = (cambios: { categoria?: string; pagina?: number }) => {
    const p = new URLSearchParams();
    if (busqueda) p.set("q", busqueda);
    const c = "categoria" in cambios ? cambios.categoria : elegida?.slug;
    if (c) p.set("categoria", c);
    if (cambios.pagina && cambios.pagina > 1) p.set("pagina", String(cambios.pagina));
    const texto = p.toString();
    return texto ? `/catalogo-woo?${texto}` : "/catalogo-woo";
  };

  return (
    <div className="flex flex-col gap-4">
      <Aviso>Página de prueba: catálogo leído de tu tienda WooCommerce. Se actualiza solo cada 15 minutos.</Aviso>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{elegida?.nombre ?? "Catálogo WooCommerce"}</h1>
        <p className="mt-1 text-sm text-texto-suave">
          {busqueda ? `Resultados para “${busqueda}” · ` : ""}
          {total === 1 ? "1 producto" : `${total} productos`}
        </p>
      </div>

      <form action="/catalogo-woo" className="flex gap-2">
        {elegida && <input type="hidden" name="categoria" value={elegida.slug} />}
        <input
          name="q"
          defaultValue={busqueda}
          placeholder="Buscar en la tienda"
          className="min-h-11 flex-1 rounded-lg border border-borde bg-superficie px-3 text-base"
        />
        <BotonEnlace variante="secundario" href={elegida ? `/catalogo-woo?categoria=${elegida.slug}` : "/catalogo-woo"}>
          Limpiar
        </BotonEnlace>
      </form>

      {arbol.length > 0 && (
        <nav aria-label="Categorías" className="-mx-4 flex flex-col gap-3">
          <FilaDeslizable className="gap-3 px-4 py-1">
            <Circulo href={enlace({ categoria: undefined })} activo={!principal} nombre="Todos" icono={<IconoTodos />} />
            {arbol.map((c) => (
              <Circulo key={c.id} href={enlace({ categoria: c.slug })} activo={principal?.id === c.id} imagen={c.imagen} nombre={c.nombre} />
            ))}
          </FilaDeslizable>
          {principal && principal.subcategorias.length > 0 && (
            <FilaDeslizable className="gap-2 px-4">
              <Chip href={enlace({ categoria: principal.slug })} activo={elegida === principal}>
                Todo
              </Chip>
              {principal.subcategorias.map((s) => (
                <Chip key={s.id} href={enlace({ categoria: s.slug })} activo={elegida === s}>
                  {s.nombre}
                </Chip>
              ))}
            </FilaDeslizable>
          )}
        </nav>
      )}

      {productos.length === 0 && elegida && !busqueda ? (
        <MuyPronto nombre={elegida.nombre} />
      ) : productos.length === 0 ? (
        <Tarjeta className="text-sm text-texto-suave">No encontramos productos{busqueda ? " con esa búsqueda" : ""}.</Tarjeta>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {productos.map((p) => (
            <TarjetaWoo key={p.id} producto={p} />
          ))}
        </div>
      )}

      {paginas > 1 && (
        <div className="flex items-center justify-between gap-2">
          {actual > 1 ? <BotonEnlace variante="secundario" href={enlace({ pagina: actual - 1 })}>Anterior</BotonEnlace> : <span />}
          <span className="text-sm text-texto-suave">
            Página {actual} de {paginas}
          </span>
          {actual < paginas ? <BotonEnlace variante="secundario" href={enlace({ pagina: actual + 1 })}>Siguiente</BotonEnlace> : <span />}
        </div>
      )}
    </div>
  );
}
