import Link from "next/link";
import { after } from "next/server";
import { BotonEnlace, Tarjeta } from "@/components/ui";
import { usuarioActual } from "@/lib/auth/dal";
import { urlImagen } from "@/lib/imagenes";
import { listarCatalogo, PRODUCTOS_POR_PAGINA_WEB, registrarVisitaRubro, rubrosWeb } from "@/lib/catalogo";
import { FilaDeslizable } from "./fila-deslizable";
import { TarjetaProducto } from "./tarjeta-producto";

export const metadata = { title: "Catálogo · CRV4 Mayorista" };

function Chip({ href, activo, children }: { href: string; activo: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      aria-current={activo ? "page" : undefined}
      className={`inline-flex min-h-8 shrink-0 items-center rounded-full px-3 text-sm whitespace-nowrap transition-colors ${
        activo ? "bg-marca font-medium text-white" : "bg-marca-suave text-texto hover:bg-marca/15"
      }`}
    >
      {children}
    </Link>
  );
}

// Rubro principal como círculo con su imagen (o su inicial) y el nombre debajo.
function Circulo({ href, activo, imagen, nombre, icono }: { href: string; activo: boolean; imagen?: string | null; nombre: string; icono?: React.ReactNode }) {
  return (
    <Link href={href} aria-current={activo ? "page" : undefined} className="group flex w-18 shrink-0 flex-col items-center gap-1.5 sm:w-22">
      <span
        className={`flex size-16 items-center justify-center overflow-hidden rounded-full bg-marca-suave ring-offset-2 ring-offset-fondo transition sm:size-20 ${
          activo ? "ring-2 ring-marca" : "ring-1 ring-borde group-hover:ring-marca"
        }`}
      >
        {imagen ? (
          // eslint-disable-next-line @next/next/no-img-element -- la imagen ya está optimizada a 600x600 WEBP
          <img src={imagen} alt="" loading="lazy" className="size-full object-cover" />
        ) : (
          (icono ?? <span className="text-2xl font-bold text-marca/50">{nombre.charAt(0)}</span>)
        )}
      </span>
      <span className={`line-clamp-2 text-center text-xs leading-tight ${activo ? "font-semibold text-marca" : "text-texto"}`}>{nombre}</span>
    </Link>
  );
}

function IconoTodos() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-7 fill-marca">
      <rect x="3" y="3" width="8" height="8" rx="2" />
      <rect x="13" y="3" width="8" height="8" rx="2" />
      <rect x="3" y="13" width="8" height="8" rx="2" />
      <rect x="13" y="13" width="8" height="8" rx="2" />
    </svg>
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
        <nav aria-label="Rubros" className="-mx-4 flex flex-col gap-3">
          <FilaDeslizable className="gap-3 px-4 py-1">
            <Circulo href={enlace({ rubro: undefined })} activo={!principal} nombre="Todos" icono={<IconoTodos />} />
            {arbol.map((r) => (
              <Circulo
                key={r.id}
                href={enlace({ rubro: r.slug })}
                activo={principal?.id === r.id}
                imagen={urlImagen(r.imagen, r.actualizadoEn)}
                nombre={r.nombre}
              />
            ))}
          </FilaDeslizable>
          {principal && (
            <FilaDeslizable className="gap-2 px-4">
              <Chip href={enlace({ rubro: principal.slug })} activo={elegido === principal}>
                Todo
              </Chip>
              {principal.subrubros.map((s) => (
                <Chip key={s.id} href={enlace({ rubro: s.slug })} activo={elegido === s}>
                  {s.nombre}
                </Chip>
              ))}
            </FilaDeslizable>
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
