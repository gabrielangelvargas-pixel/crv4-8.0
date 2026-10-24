import Link from "next/link";
import { after } from "next/server";
import { BotonEnlace, Tarjeta } from "@/components/ui";
import { usuarioActual } from "@/lib/auth/dal";
import { listarCatalogo, PRODUCTOS_POR_PAGINA_WEB, registrarVisitaRubro, rubrosWeb } from "@/lib/catalogo";
import { TarjetaProducto } from "./tarjeta-producto";

export const metadata = { title: "Catálogo · CRV4 Mayorista" };

function Chip({ href, activo, children }: { href: string; activo: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      aria-current={activo ? "page" : undefined}
      className={`inline-flex min-h-9 shrink-0 items-center rounded-full border px-3 text-sm whitespace-nowrap ${
        activo ? "border-marca bg-marca text-white" : "border-borde bg-superficie hover:border-marca"
      }`}
    >
      {children}
    </Link>
  );
}

export default async function CatalogoPage({ searchParams }: PageProps<"/catalogo">) {
  const { q, rubro: slug, pagina } = await searchParams;
  const busqueda = typeof q === "string" ? q : undefined;
  const arbol = await rubrosWeb();
  const principal = arbol.find((r) => r.slug === slug || r.subrubros.some((s) => s.slug === slug));
  const elegido = principal?.slug === slug ? principal : principal?.subrubros.find((s) => s.slug === slug);
  const { filas, total, pagina: actual } = await listarCatalogo({ busqueda, rubro: elegido, pagina: Number(pagina) || 1 });
  const paginas = Math.max(1, Math.ceil(total / PRODUCTOS_POR_PAGINA_WEB));

  // Cuenta para "los más visitados": la primera página de un rubro, sin búsqueda y sin contar al personal.
  if (elegido && actual === 1 && !busqueda && !(await usuarioActual())?.accesoGestion) {
    after(() => registrarVisitaRubro(elegido.id));
  }

  const enlace = (cambios: { rubro?: string; pagina?: number }) => {
    const p = new URLSearchParams();
    if (busqueda) p.set("q", busqueda);
    const r = "rubro" in cambios ? cambios.rubro : elegido?.slug;
    if (r) p.set("rubro", r);
    if (cambios.pagina && cambios.pagina > 1) p.set("pagina", String(cambios.pagina));
    const texto = p.toString();
    return texto ? `/catalogo?${texto}` : "/catalogo";
  };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{elegido?.nombre ?? "Catálogo"}</h1>
        <p className="mt-1 text-sm text-texto-suave">
          {busqueda ? `Resultados para “${busqueda}” · ` : ""}
          {total === 1 ? "1 producto" : `${total} productos`}
          {busqueda && (
            <>
              {" · "}
              <Link href={elegido ? `/catalogo?rubro=${elegido.slug}` : "/catalogo"} className="text-marca hover:underline">
                Quitar búsqueda
              </Link>
            </>
          )}
        </p>
      </div>

      {arbol.length > 0 && (
        <nav aria-label="Rubros" className="-mx-4 flex flex-col gap-2 overflow-hidden">
          <div className="flex gap-2 overflow-x-auto px-4 pb-1">
            <Chip href={enlace({ rubro: undefined })} activo={!principal}>
              Todos
            </Chip>
            {arbol.map((r) => (
              <Chip key={r.id} href={enlace({ rubro: r.slug })} activo={principal?.id === r.id}>
                {r.nombre}
              </Chip>
            ))}
          </div>
          {principal && principal.subrubros.length > 1 && (
            <div className="flex gap-2 overflow-x-auto px-4 pb-1">
              <Chip href={enlace({ rubro: principal.slug })} activo={elegido === principal}>
                Todo {principal.nombre}
              </Chip>
              {principal.subrubros.map((s) => (
                <Chip key={s.id} href={enlace({ rubro: s.slug })} activo={elegido === s}>
                  {s.nombre}
                </Chip>
              ))}
            </div>
          )}
        </nav>
      )}

      {filas.length === 0 ? (
        <Tarjeta className="text-sm text-texto-suave">No encontramos productos{busqueda ? " con esa búsqueda" : ""}.</Tarjeta>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {filas.map((p) => (
            <TarjetaProducto key={p.id} producto={p} />
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
